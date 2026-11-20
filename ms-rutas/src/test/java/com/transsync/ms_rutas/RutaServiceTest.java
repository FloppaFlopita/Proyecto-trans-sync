package com.transsync.ms_rutas;

import com.transsync.ms_rutas.dto.RutaEstadisticasDTO;
import com.transsync.ms_rutas.dto.RutaRequestDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RutaServiceTest {

    @Mock
    private RutaRepository rutaRepository;

    @Mock
    private RutaAuditoriaRepository rutaAuditoriaRepository;

    @InjectMocks
    private RutaService rutaService;

    @Test
    @DisplayName("Regla 1: Debe registrar una nueva ruta válidamente")
    void testCrearRuta_Exitoso() {
        RutaRequestDTO request = new RutaRequestDTO("Lima", "Arequipa", "20:00 hrs", 85.0);

        when(rutaRepository.existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCase("Lima", "Arequipa", "20:00 hrs"))
                .thenReturn(false);

        Ruta rutaGuardada = new Ruta();
        rutaGuardada.setId(1L);
        rutaGuardada.setOrigen("Lima");
        rutaGuardada.setDestino("Arequipa");
        rutaGuardada.setHorario("20:00 hrs");
        rutaGuardada.setPrecio(85.0);

        when(rutaRepository.save(any(Ruta.class))).thenReturn(rutaGuardada);

        Ruta resultado = rutaService.crearRuta(request);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals("Lima", resultado.getOrigen());
        assertEquals("Arequipa", resultado.getDestino());
        assertEquals(85.0, resultado.getPrecio());
        verify(rutaRepository).save(any(Ruta.class));
    }

    @Test
    @DisplayName("Regla 2: Debe rechazar origen y destino idénticos")
    void testCrearRuta_RechazarOrigenIgualDestino() {
        RutaRequestDTO request = new RutaRequestDTO("Lima", "lima", "10:00 hrs", 50.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            rutaService.crearRuta(request);
        });

        assertTrue(ex.getMessage().contains("no puede ser idéntica"));
        verify(rutaRepository, never()).save(any(Ruta.class));
    }

    @Test
    @DisplayName("Regla 3: Debe rechazar tarifa negativa o cero")
    void testCrearRuta_RechazarPrecioInvalido() {
        RutaRequestDTO request = new RutaRequestDTO("Cusco", "Puno", "08:00 hrs", -15.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            rutaService.crearRuta(request);
        });

        assertTrue(ex.getMessage().contains("debe ser mayor a S/. 0.00"));
        verify(rutaRepository, never()).save(any(Ruta.class));
    }

    @Test
    @DisplayName("Regla 4: Debe detectar y rechazar rutas duplicadas en el mismo horario")
    void testCrearRuta_RechazarDuplicado() {
        RutaRequestDTO request = new RutaRequestDTO("Arequipa", "Tacna", "06:00 hrs", 40.0);

        when(rutaRepository.existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCase("Arequipa", "Tacna", "06:00 hrs"))
                .thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            rutaService.crearRuta(request);
        });

        assertTrue(ex.getMessage().contains("Ya existe una ruta"));
        verify(rutaRepository, never()).save(any(Ruta.class));
    }

    @Test
    @DisplayName("Regla 5: Debe actualizar una ruta existente correctamente")
    void testActualizarRuta_Exitoso() {
        Ruta rutaExistente = new Ruta();
        rutaExistente.setId(2L);
        rutaExistente.setOrigen("Lima");
        rutaExistente.setDestino("Trujillo");
        rutaExistente.setHorario("14:00 hrs");
        rutaExistente.setPrecio(60.0);

        when(rutaRepository.findById(2L)).thenReturn(Optional.of(rutaExistente));
        when(rutaRepository.existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCaseAndIdNot("Lima", "Trujillo", "15:00 hrs", 2L))
                .thenReturn(false);
        when(rutaRepository.save(any(Ruta.class))).thenAnswer(i -> i.getArgument(0));

        RutaRequestDTO dtoActualizado = new RutaRequestDTO("Lima", "Trujillo", "15:00 hrs", 65.0);
        Ruta resultado = rutaService.actualizarRuta(2L, dtoActualizado);

        assertEquals("15:00 hrs", resultado.getHorario());
        assertEquals(65.0, resultado.getPrecio());
    }

    @Test
    @DisplayName("Regla 6: Debe buscar rutas por criterios avanzados")
    void testBuscarRutasAvanzado() {
        Ruta r1 = new Ruta();
        r1.setId(1L);
        r1.setOrigen("Lima");
        r1.setDestino("Arequipa");
        r1.setPrecio(80.0);

        when(rutaRepository.buscarRutasAvanzado("Lima", "Arequipa", 100.0))
                .thenReturn(Collections.singletonList(r1));

        List<Ruta> resultado = rutaService.buscarRutas("Lima", "Arequipa", 100.0);

        assertEquals(1, resultado.size());
        assertEquals("Lima", resultado.get(0).getOrigen());
    }

    @Test
    @DisplayName("Regla 7: Debe calcular estadísticas analíticas de la red de rutas")
    void testCalcularEstadisticas() {
        when(rutaRepository.count()).thenReturn(3L);
        when(rutaRepository.countDistinctOrigenes()).thenReturn(2L);
        when(rutaRepository.countDistinctDestinos()).thenReturn(3L);
        when(rutaRepository.findAveragePrecio()).thenReturn(75.50);
        when(rutaRepository.findMinPrecio()).thenReturn(40.0);
        when(rutaRepository.findMaxPrecio()).thenReturn(110.0);

        List<Object[]> frecuentes = new ArrayList<>();
        frecuentes.add(new Object[]{"Arequipa", 2L});
        frecuentes.add(new Object[]{"Puno", 1L});
        when(rutaRepository.findDestinosMasFrecuentes()).thenReturn(frecuentes);

        Ruta r1 = new Ruta();
        r1.setHorario("08:00 hrs");
        Ruta r2 = new Ruta();
        r2.setHorario("14:30 hrs");
        Ruta r3 = new Ruta();
        r3.setHorario("21:00 hrs");
        when(rutaRepository.findAll()).thenReturn(Arrays.asList(r1, r2, r3));

        RutaEstadisticasDTO stats = rutaService.obtenerEstadisticas();

        assertEquals(3L, stats.getTotalRutas());
        assertEquals(2L, stats.getTotalOrigenes());
        assertEquals(3L, stats.getTotalDestinos());
        assertEquals(75.50, stats.getPrecioPromedio());
        assertEquals(40.0, stats.getPrecioMinimo());
        assertEquals(110.0, stats.getPrecioMaximo());
        assertEquals(2, stats.getDestinosPopulares().size());
        assertEquals(1L, stats.getDistribucionTurnos().get("Mañana"));
        assertEquals(1L, stats.getDistribucionTurnos().get("Tarde"));
        assertEquals(1L, stats.getDistribucionTurnos().get("Noche"));
    }

    @Test
    @DisplayName("Regla 8: Debe registrar auditoría al crear una ruta")
    void testAuditoria_Creacion() {
        RutaRequestDTO request = new RutaRequestDTO("Chiclayo", "Piura", "09:00 hrs", 35.0);

        when(rutaRepository.existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCase(any(), any(), any())).thenReturn(false);
        Ruta rutaGuardada = new Ruta();
        rutaGuardada.setId(10L);
        rutaGuardada.setOrigen("Chiclayo");
        rutaGuardada.setDestino("Piura");
        rutaGuardada.setHorario("09:00 hrs");
        rutaGuardada.setPrecio(35.0);

        when(rutaRepository.save(any(Ruta.class))).thenReturn(rutaGuardada);
        when(rutaAuditoriaRepository.save(any(RutaAuditoria.class))).thenAnswer(i -> i.getArgument(0));

        rutaService.crearRuta(request);

        verify(rutaAuditoriaRepository, times(1)).save(argThat(audit -> 
            "CREACION".equals(audit.getTipoOperacion()) &&
            audit.getRutaId().equals(10L) &&
            "Chiclayo".equals(audit.getOrigen())
        ));
    }

    @Test
    @DisplayName("Regla 9: Debe registrar auditoría al eliminar una ruta")
    void testAuditoria_Eliminacion() {
        Ruta ruta = new Ruta();
        ruta.setId(20L);
        ruta.setOrigen("Lima");
        ruta.setDestino("Huancayo");
        ruta.setHorario("07:00 hrs");
        ruta.setPrecio(50.0);

        when(rutaRepository.findById(20L)).thenReturn(Optional.of(ruta));
        when(rutaAuditoriaRepository.save(any(RutaAuditoria.class))).thenAnswer(i -> i.getArgument(0));

        rutaService.eliminarRuta(20L);

        verify(rutaRepository, times(1)).delete(ruta);
        verify(rutaAuditoriaRepository, times(1)).save(argThat(audit -> 
            "ELIMINACION".equals(audit.getTipoOperacion()) &&
            audit.getRutaId().equals(20L)
        ));
    }

    @Test
    @DisplayName("Regla 10: Debe listar historial de auditoría ordenado descendentemente")
    void testAuditoria_ListarHistorial() {
        RutaAuditoria a1 = new RutaAuditoria(1L, "CREACION", "Lima", "Ica", "08:00 hrs", 40.0, null, "Creada");
        when(rutaAuditoriaRepository.findAllByOrderByFechaOperacionDesc()).thenReturn(List.of(a1));

        List<RutaAuditoria> historial = rutaService.listarHistorial();

        assertEquals(1, historial.size());
        assertEquals("CREACION", historial.get(0).getTipoOperacion());
        verify(rutaAuditoriaRepository, times(1)).findAllByOrderByFechaOperacionDesc();
    }
}
