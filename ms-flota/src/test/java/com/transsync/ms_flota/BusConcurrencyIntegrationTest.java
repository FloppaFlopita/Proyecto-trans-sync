package com.transsync.ms_flota;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.net.Socket;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Prueba de integración de concurrencia real para Bloqueo Pesimista (PESSIMISTIC_WRITE).
 * 
 * Simula 20 hilos concurrentes compitiendo exactamente en el mismo instante (vía CountDownLatch)
 * por el ÚLTIMO asiento disponible (asientosDisponibles = 1) en un bus sobre PostgreSQL real.
 */
@SpringBootTest
@ActiveProfiles("test")
public class BusConcurrencyIntegrationTest {

    private static final String DB_HOST = "127.0.0.1";
    private static final int DB_PORT = 8544;

    @Autowired
    private BusService busService;

    @Autowired
    private BusRepository busRepository;

    @BeforeAll
    static void verificarDisponibilidadPostgreSQL() {
        boolean postgresDisponible = false;
        try (Socket socket = new Socket(DB_HOST, DB_PORT)) {
            postgresDisponible = true;
        } catch (Exception ignored) {
            postgresDisponible = false;
        }

        Assumptions.assumeTrue(postgresDisponible, 
                "Prueba de integración de concurrencia omitida: PostgreSQL de pruebas en " 
                + DB_HOST + ":" + DB_PORT + " no está disponible.");
    }

    @Test
    @DisplayName("Concurrencia: 20 hilos intentando descontar simultáneamente el último asiento disponible")
    void testConcurrencia_20HilosDescontandoUltimoAsiento() throws InterruptedException {
        assertNotNull(busService, "El bean BusService debe estar cargado");
        assertNotNull(busRepository, "El bean BusRepository debe estar cargado");

        // 1. Arrange: Bus con exactamente 1 asiento disponible
        Bus bus = new Bus();
        bus.setPlaca("TEST-CONC-01");
        bus.setModelo("Scania Concurrency Test");
        bus.setCapacidad(50);
        bus.setAsientosDisponibles(1);
        Bus busGuardado = busRepository.save(bus);
        Long busId = busGuardado.getId();

        int totalHilos = 20;
        ExecutorService executor = Executors.newFixedThreadPool(totalHilos);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(totalHilos);

        AtomicInteger exitos = new AtomicInteger(0);
        AtomicInteger conflictos = new AtomicInteger(0);

        // 2. Act: 20 hilos disparados exactamente al unísono
        for (int i = 0; i < totalHilos; i++) {
            executor.submit(() -> {
                try {
                    startGate.await(); // Espera a que todos los hilos estén listos
                    busService.descontarAsiento(busId);
                    exitos.incrementAndGet();
                } catch (IllegalStateException e) {
                    // Conflicto de disponibilidad esperado (HTTP 409)
                    conflictos.incrementAndGet();
                } catch (Exception e) {
                    conflictos.incrementAndGet();
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown(); // Señal de inicio simultánea
        boolean completado = endGate.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        // 3. Assert
        assertTrue(completado, "Todos los hilos debieron terminar en menos de 15 segundos");
        assertEquals(1, exitos.get(), "Exactamente 1 hilo debió lograr descontar el último asiento");
        assertEquals(19, conflictos.get(), "Exactamente 19 hilos debieron ser rechazados por falta de asientos");

        // Verificación en base de datos del estado final
        Bus busFinal = busRepository.findById(busId).orElseThrow();
        assertEquals(0, busFinal.getAsientosDisponibles(), 
                "El saldo final de asientos disponibles debe ser exactamente 0, evitando sobreventas");
    }
}
