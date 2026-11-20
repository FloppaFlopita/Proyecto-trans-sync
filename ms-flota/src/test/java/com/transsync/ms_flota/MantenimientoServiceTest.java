package com.transsync.ms_flota;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MantenimientoServiceTest {

    @Mock
    private MantenimientoRepository mantenimientoRepository;

    @Mock
    private BusRepository busRepository;

    @InjectMocks
    private MantenimientoService mantenimientoService;

    private Bus busMock;
    private Mantenimiento mantenimientoMock;

    @BeforeEach
    void setUp() {
        busMock = new Bus();
        busMock.setId(1L);
        busMock.setPlaca("ABC-123");
        busMock.setModelo("Scania Marcopolo");
        busMock.setCapacidad(50);
        busMock.setAsientosDisponibles(50);

        mantenimientoMock = new Mantenimiento();
        mantenimientoMock.setId(10L);
        mantenimientoMock.setBus(busMock);
        mantenimientoMock.setTipo("PREVENTIVO");
        mantenimientoMock.setDescripcion("Revisión de frenos");
        mantenimientoMock.setFechaProgramada(LocalDate.now().plusDays(2));
        mantenimientoMock.setEstado(EstadoMantenimiento.PROGRAMADO);
        mantenimientoMock.setCosto(350.0);
    }

    @Test
    @DisplayName("1. Programar mantenimiento exitoso cuando el bus existe y no tiene solapamientos")
    void testProgramarMantenimiento_Exitoso() {
        MantenimientoRequestDTO dto = new MantenimientoRequestDTO();
        dto.setBusId(1L);
        dto.setTipo("PREVENTIVO");
        dto.setDescripcion("Cambio de aceite de motor y filtros");
        dto.setFechaProgramada(LocalDate.now().plusDays(3));
        dto.setCosto(250.0);

        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busMock));
        when(mantenimientoRepository.findActivosOProgramadosPorBus(1L)).thenReturn(Collections.emptyList());
        when(mantenimientoRepository.save(any(Mantenimiento.class))).thenAnswer(inv -> {
            Mantenimiento m = inv.getArgument(0);
            m.setId(100L);
            return m;
        });

        MantenimientoResponseDTO resp = mantenimientoService.programarMantenimiento(dto);

        assertNotNull(resp);
        assertEquals(EstadoMantenimiento.PROGRAMADO, resp.getEstado());
        assertEquals("ABC-123", resp.getBusPlaca());
        verify(busRepository, times(1)).findByIdForUpdate(1L);
        verify(mantenimientoRepository, times(1)).save(any(Mantenimiento.class));
    }

    @Test
    @DisplayName("2. Rechazo con IllegalStateException al programar si el bus ya tiene mantenimiento activo")
    void testProgramarMantenimiento_ConflictoSolapamiento() {
        MantenimientoRequestDTO dto = new MantenimientoRequestDTO();
        dto.setBusId(1L);
        dto.setTipo("CORRECTIVO");
        dto.setDescripcion("Reparación embrague");
        dto.setFechaProgramada(LocalDate.now().plusDays(1));

        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busMock));
        when(mantenimientoRepository.findActivosOProgramadosPorBus(1L)).thenReturn(List.of(mantenimientoMock));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                mantenimientoService.programarMantenimiento(dto)
        );

        assertTrue(ex.getMessage().contains("ya tiene un mantenimiento activo o programado"));
        verify(mantenimientoRepository, never()).save(any(Mantenimiento.class));
    }

    @Test
    @DisplayName("3. Iniciar mantenimiento realiza transición PROGRAMADO -> EN_MANTENIMIENTO y registra fechaInicio")
    void testIniciarMantenimiento_Exitoso() {
        when(mantenimientoRepository.findById(10L)).thenReturn(Optional.of(mantenimientoMock));
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busMock));
        when(mantenimientoRepository.save(any(Mantenimiento.class))).thenAnswer(inv -> inv.getArgument(0));

        MantenimientoResponseDTO resp = mantenimientoService.iniciarMantenimiento(10L);

        assertNotNull(resp);
        assertEquals(EstadoMantenimiento.EN_MANTENIMIENTO, resp.getEstado());
        assertNotNull(mantenimientoMock.getFechaInicio());
    }

    @Test
    @DisplayName("4. Rechazo al iniciar mantenimiento si el estado no es PROGRAMADO")
    void testIniciarMantenimiento_EstadoInvalido() {
        mantenimientoMock.setEstado(EstadoMantenimiento.FINALIZADO);
        when(mantenimientoRepository.findById(10L)).thenReturn(Optional.of(mantenimientoMock));
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busMock));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                mantenimientoService.iniciarMantenimiento(10L)
        );

        assertTrue(ex.getMessage().contains("Transición inválida"));
        verify(mantenimientoRepository, never()).save(any(Mantenimiento.class));
    }

    @Test
    @DisplayName("5. Finalizar mantenimiento realiza transición EN_MANTENIMIENTO -> FINALIZADO y registra fechaFin")
    void testFinalizarMantenimiento_Exitoso() {
        mantenimientoMock.setEstado(EstadoMantenimiento.EN_MANTENIMIENTO);
        when(mantenimientoRepository.findById(10L)).thenReturn(Optional.of(mantenimientoMock));
        when(busRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(busMock));
        when(mantenimientoRepository.save(any(Mantenimiento.class))).thenAnswer(inv -> inv.getArgument(0));

        MantenimientoResponseDTO resp = mantenimientoService.finalizarMantenimiento(10L, 400.0, "Prueba de frenos OK");

        assertNotNull(resp);
        assertEquals(EstadoMantenimiento.FINALIZADO, resp.getEstado());
        assertEquals(400.0, resp.getCosto());
        assertNotNull(mantenimientoMock.getFechaFin());
    }
}
