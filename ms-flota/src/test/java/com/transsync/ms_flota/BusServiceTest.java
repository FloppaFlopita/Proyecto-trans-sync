package com.transsync.ms_flota;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusServiceTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private MantenimientoRepository mantenimientoRepository;

    @InjectMocks
    private BusService busService;

    private Bus busPrueba;

    @BeforeEach
    void setUp() {
        busPrueba = new Bus();
        busPrueba.setId(1L);
        busPrueba.setPlaca("ABC-123");
        busPrueba.setModelo("Scania Marcopolo");
        busPrueba.setCapacidad(50);
        busPrueba.setAsientosDisponibles(50);
    }

    @Test
    @DisplayName("1. Descuento exitoso cuando existen asientos disponibles usando bloqueo pesimista")
    void testDescontarAsiento_Exitoso() {
        // Arrange
        busPrueba.setAsientosDisponibles(10);
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busPrueba));
        when(busRepository.save(any(Bus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Bus resultado = busService.descontarAsiento(1L);

        // Assert
        assertNotNull(resultado);
        assertEquals(9, resultado.getAsientosDisponibles(), "Los asientos disponibles deben decrementar en 1");
        verify(busRepository, times(1)).findByIdForUpdate(1L);
        verify(busRepository, times(1)).save(busPrueba);
    }

    @Test
    @DisplayName("2. Rechazo con IllegalStateException cuando no hay asientos disponibles (asientos = 0)")
    void testDescontarAsiento_RechazoCuandoNoHayAsientos() {
        // Arrange
        busPrueba.setAsientosDisponibles(0);
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busPrueba));

        // Act & Assert
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            busService.descontarAsiento(1L);
        });

        assertTrue(ex.getMessage().contains("No hay asientos disponibles"), 
                "El mensaje debe indicar falta de asientos disponibles");
        assertEquals(0, busPrueba.getAsientosDisponibles(), "Los asientos disponibles no deben cambiar ni ser negativos");
        verify(busRepository, times(1)).findByIdForUpdate(1L);
        verify(busRepository, never()).save(any(Bus.class));
    }

    @Test
    @DisplayName("3. Liberación exitosa de asientos cuando los disponibles son menores a la capacidad")
    void testLiberarAsiento_Exitoso() {
        // Arrange
        busPrueba.setCapacidad(40);
        busPrueba.setAsientosDisponibles(35);
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busPrueba));
        when(busRepository.save(any(Bus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Bus resultado = busService.liberarAsiento(1L);

        // Assert
        assertNotNull(resultado);
        assertEquals(36, resultado.getAsientosDisponibles(), "Los asientos disponibles deben incrementar en 1");
        verify(busRepository, times(1)).findByIdForUpdate(1L);
        verify(busRepository, times(1)).save(busPrueba);
    }

    @Test
    @DisplayName("4. Rechazo con IllegalStateException cuando se intenta superar la capacidad máxima")
    void testLiberarAsiento_RechazoCuandoSuperaCapacidadMaxima() {
        // Arrange: el bus ya tiene todos sus asientos disponibles
        busPrueba.setCapacidad(40);
        busPrueba.setAsientosDisponibles(40);
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busPrueba));

        // Act & Assert
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            busService.liberarAsiento(1L);
        });

        assertTrue(ex.getMessage().contains("capacidad máxima"), 
                "El mensaje debe indicar que ya se alcanzó la capacidad máxima");
        assertEquals(40, busPrueba.getAsientosDisponibles(), "No debe sobrepasar la capacidad de 40");
        verify(busRepository, times(1)).findByIdForUpdate(1L);
        verify(busRepository, never()).save(any(Bus.class));
    }

    @Test
    @DisplayName("5. Rechazo con IllegalArgumentException cuando el ID de bus no existe")
    void testOperaciones_BusNoExiste_LanzaIllegalArgument() {
        when(busRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> busService.descontarAsiento(999L));
        assertThrows(IllegalArgumentException.class, () -> busService.liberarAsiento(999L));
        assertThrows(IllegalArgumentException.class, () -> busService.reiniciarBus(999L));

        verify(busRepository, never()).save(any(Bus.class));
    }

    @Test
    @DisplayName("6. Controlador BusController devuelve HTTP 409 Conflict ante falta de asientos o exceso de capacidad")
    void testController_ManejoConflicto409() {
        // Mock del servicio en el controlador
        BusService mockService = mock(BusService.class);
        BusController controller = new BusController();
        // Inyección por reflexión / setter del campo privado busService
        try {
            java.lang.reflect.Field field = BusController.class.getDeclaredField("busService");
            field.setAccessible(true);
            field.set(controller, mockService);
        } catch (Exception e) {
            fail("Error al inyectar mock en controlador: " + e.getMessage());
        }

        // Caso A: Descuento conflictivo -> HTTP 409
        when(mockService.descontarAsiento(1L))
                .thenThrow(new IllegalStateException("No hay asientos disponibles"));
        ResponseEntity<Map<String, Object>> respDescontar = controller.descontarAsiento(1L);

        assertEquals(HttpStatus.CONFLICT, respDescontar.getStatusCode());
        assertNotNull(respDescontar.getBody());
        assertEquals(false, respDescontar.getBody().get("exito"));
        assertEquals("No hay asientos disponibles", respDescontar.getBody().get("mensaje"));

        // Caso B: Liberación conflictiva -> HTTP 409
        when(mockService.liberarAsiento(1L))
                .thenThrow(new IllegalStateException("Capacidad máxima completa"));
        ResponseEntity<Map<String, Object>> respLiberar = controller.liberarAsiento(1L);

        assertEquals(HttpStatus.CONFLICT, respLiberar.getStatusCode());
        assertNotNull(respLiberar.getBody());
        assertEquals(false, respLiberar.getBody().get("exito"));
        assertEquals("Capacidad máxima completa", respLiberar.getBody().get("mensaje"));
    }

    @Test
    @DisplayName("7. Rechazo con IllegalStateException al descontar asiento si el bus está EN_MANTENIMIENTO")
    void testDescontarAsiento_RechazoCuandoBusEnMantenimiento() {
        // Arrange
        busPrueba.setAsientosDisponibles(20);
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busPrueba));
        when(mantenimientoRepository.existsByBusIdAndEstado(1L, EstadoMantenimiento.EN_MANTENIMIENTO)).thenReturn(true);

        // Act & Assert
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            busService.descontarAsiento(1L);
        });

        assertTrue(ex.getMessage().contains("EN MANTENIMIENTO"));
        verify(busRepository, never()).save(any(Bus.class));
    }
}
