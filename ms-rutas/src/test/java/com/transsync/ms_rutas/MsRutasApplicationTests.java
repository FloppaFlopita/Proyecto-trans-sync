package com.transsync.ms_rutas;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.CommandLineRunner;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MsRutasApplicationTests {

    @Mock
    private RutaRepository rutaRepository;

    @Test
    @DisplayName("initData: Cuando ya existen rutas registradas, conserva los registros y no ejecuta deleteAll ni save")
    void testInitData_WhenExistingRoutesPresent_ShouldPreserveRecords() throws Exception {
        // Arrange: la base de datos ya contiene 3 rutas existentes
        when(rutaRepository.count()).thenReturn(3L);

        MsRutasApplication application = new MsRutasApplication();
        CommandLineRunner runner = application.initData(rutaRepository);

        // Act: se ejecuta el runner de inicialización
        runner.run();

        // Assert: NUNCA se debe invocar deleteAll ni modificar rutas
        verify(rutaRepository, never()).deleteAll();
        verify(rutaRepository, never()).save(any(Ruta.class));
        verify(rutaRepository, never()).delete(any(Ruta.class));
        verify(rutaRepository, never()).deleteById(anyLong());
        verify(rutaRepository, times(1)).count();
    }

    @Test
    @DisplayName("initData: Cuando la tabla está vacía, inserta las 2 rutas semilla sin invocar deleteAll")
    void testInitData_WhenTableIsEmpty_ShouldSeedInitialRoutes() throws Exception {
        // Arrange: tabla vacía
        when(rutaRepository.count()).thenReturn(0L);

        MsRutasApplication application = new MsRutasApplication();
        CommandLineRunner runner = application.initData(rutaRepository);

        // Act
        runner.run();

        // Assert: NUNCA se invoca deleteAll y se insertan las 2 rutas semilla
        verify(rutaRepository, never()).deleteAll();

        ArgumentCaptor<Ruta> rutaCaptor = ArgumentCaptor.forClass(Ruta.class);
        verify(rutaRepository, times(2)).save(rutaCaptor.capture());

        List<Ruta> rutasGuardadas = rutaCaptor.getAllValues();
        assertEquals(2, rutasGuardadas.size());

        Ruta r1 = rutasGuardadas.get(0);
        assertEquals("Arequipa", r1.getOrigen());
        assertEquals("Lima", r1.getDestino());
        assertEquals("20:30 hrs", r1.getHorario());
        assertEquals(90.00, r1.getPrecio());

        Ruta r2 = rutasGuardadas.get(1);
        assertEquals("Cusco", r2.getOrigen());
        assertEquals("Puno", r2.getDestino());
        assertEquals("08:00 hrs", r2.getHorario());
        assertEquals(45.00, r2.getPrecio());
    }
}
