package com.transsync.ms_flota;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.net.Socket;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Prueba de integración que certifica el comportamiento de ROLLBACK REAL
 * sobre PostgreSQL aislado en el puerto 8544.
 *
 * Valida que una falla en una operación compuesta de mantenimiento revierta
 * de manera atómica tanto los cambios sobre el autobús como la persistencia
 * del registro de mantenimiento, sin dejar datos parciales ni inconsistentes.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(MantenimientoRollbackIntegrationTest.TestConfig.class)
public class MantenimientoRollbackIntegrationTest {

    private static final String DB_HOST = "127.0.0.1";
    private static final int DB_PORT = 8544;

    @Autowired
    private MantenimientoTransaccionalTestHelper helper;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @BeforeAll
    static void verificarPostgreSQLPruebas() {
        boolean postgresDisponible = false;
        try (Socket socket = new Socket(DB_HOST, DB_PORT)) {
            postgresDisponible = true;
        } catch (Exception ignored) {
            postgresDisponible = false;
        }

        Assumptions.assumeTrue(postgresDisponible,
                "Prueba de rollback omitida: PostgreSQL de pruebas en "
                + DB_HOST + ":" + DB_PORT + " no está disponible.");
    }

    @Test
    @DisplayName("Rollback Real: Excepción controlada revierte cambios en Bus y Mantenimiento en PostgreSQL")
    void testRollbackReal_FalloControladoRevierteTodaLaOperacion() {
        // 1. Arrange: Crear un autobús de prueba con 50 asientos disponibles
        Bus bus = new Bus();
        bus.setPlaca("ROLL-BK-01");
        bus.setModelo("Scania Rollback Verification");
        bus.setCapacidad(50);
        bus.setAsientosDisponibles(50);
        Bus busGuardado = busRepository.save(bus);
        Long busId = busGuardado.getId();

        // 2. Act: Ejecutar operación transaccional a través del proxy de Spring provocando una falla deliberada
        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            helper.ejecutarOperacionMantenimientoConFallo(busId, "CORRECTIVO_URGENTE", "Intervención de prueba", true);
        });

        assertTrue(excepcion.getMessage().contains("Fallo deliberado para rollback"),
                "El mensaje de excepción debe coincidir con el fallo simulado");

        // 3. Assert en base de datos independiente después del rollback
        // A. Verificar que NO existe ningún registro parcial en la tabla 'mantenimientos'
        List<Mantenimiento> mantenimientosGuardados = mantenimientoRepository.findByBusIdOrderByFechaProgramadaDesc(busId);
        assertTrue(mantenimientosGuardados.isEmpty(),
                "ROLLBACK EXITOSO: No debe existir ningún registro de mantenimiento en PostgreSQL debido al rollback");

        // B. Verificar que el autobús mantiene su estado y disponibilidad original
        Bus busConsultado = busRepository.findById(busId).orElseThrow();
        assertEquals(50, busConsultado.getAsientosDisponibles(),
                "ROLLBACK EXITOSO: Los asientos del bus deben continuar en 50; la modificación a 0 fue revertida");
        assertEquals("ROLL-BK-01", busConsultado.getPlaca());

        // Limpieza de datos de prueba
        busRepository.deleteById(busId);
    }

    @Test
    @DisplayName("Commit Real: Operación sin fallos confirma exitosamente cambios en Bus y Mantenimiento")
    void testCommitReal_OperacionExitosaConfirmaAmbosRegistros() {
        // 1. Arrange
        Bus bus = new Bus();
        bus.setPlaca("ROLL-OK-02");
        bus.setModelo("Volvo Commit Verification");
        bus.setCapacidad(40);
        bus.setAsientosDisponibles(40);
        Bus busGuardado = busRepository.save(bus);
        Long busId = busGuardado.getId();

        // 2. Act: Operación transaccional exitosa (sin fallos)
        Long mantenimientoId = helper.ejecutarOperacionMantenimientoConFallo(busId, "PREVENTIVO", "Mantenimiento rutinario", false);
        assertNotNull(mantenimientoId, "Debe retornar el ID del mantenimiento generado");

        // 3. Assert: Verificar que ambos registros están efectivamente persistidos en PostgreSQL
        Bus busActualizado = busRepository.findById(busId).orElseThrow();
        assertEquals(0, busActualizado.getAsientosDisponibles(),
                "COMMIT EXITOSO: Los asientos del bus deben reflejar el cambio a 0");

        Mantenimiento mantPersistido = mantenimientoRepository.findById(mantenimientoId).orElseThrow();
        assertEquals(EstadoMantenimiento.EN_MANTENIMIENTO, mantPersistido.getEstado());
        assertEquals("PREVENTIVO", mantPersistido.getTipo());

        // Limpieza de datos de prueba
        mantenimientoRepository.deleteById(mantenimientoId);
        busRepository.deleteById(busId);
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public MantenimientoTransaccionalTestHelper mantenimientoTransaccionalTestHelper(
                MantenimientoRepository mantenimientoRepository,
                BusRepository busRepository) {
            return new MantenimientoTransaccionalTestHelper(mantenimientoRepository, busRepository);
        }
    }

    /**
     * Componente auxiliar exclusivo para pruebas de integración.
     * Al estar anotado con @Transactional, Spring genera un proxy dinámico
     * que gestiona la transacción real con PostgreSQL.
     */
    @Service
    public static class MantenimientoTransaccionalTestHelper {

        private final MantenimientoRepository mantenimientoRepository;
        private final BusRepository busRepository;

        public MantenimientoTransaccionalTestHelper(
                MantenimientoRepository mantenimientoRepository,
                BusRepository busRepository) {
            this.mantenimientoRepository = mantenimientoRepository;
            this.busRepository = busRepository;
        }

        @Transactional
        public Long ejecutarOperacionMantenimientoConFallo(Long busId, String tipo, String descripcion, boolean provocarFallo) {
            // 1. Modificación del autobús: bloqueo a nivel de fila y actualización
            Bus bus = busRepository.findByIdForUpdate(busId)
                    .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + busId));

            bus.setAsientosDisponibles(0); // Bloqueo de asientos para mantenimiento
            busRepository.saveAndFlush(bus); // Forzar flush SQL a PostgreSQL

            // 2. Persistencia del registro de mantenimiento
            Mantenimiento m = new Mantenimiento();
            m.setBus(bus);
            m.setTipo(tipo);
            m.setDescripcion(descripcion);
            m.setFechaProgramada(LocalDate.now());
            m.setFechaInicio(LocalDateTime.now());
            m.setEstado(EstadoMantenimiento.EN_MANTENIMIENTO);
            m.setTaller("Taller Central TransSync");
            m.setCosto(850.0);
            Mantenimiento guardado = mantenimientoRepository.saveAndFlush(m); // Forzar INSERT SQL a PostgreSQL

            // 3. Provocar deliberadamente la falla controlada
            if (provocarFallo) {
                throw new RuntimeException("Fallo deliberado para rollback: Error inesperado tras persistir entidades");
            }

            return guardado.getId();
        }
    }
}
