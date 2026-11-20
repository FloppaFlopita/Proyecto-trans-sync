package com.transsync.ms_rutas;

import com.transsync.ms_rutas.dto.RutaRequestDTO;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(RutaAuditoriaRollbackIntegrationTest.TestConfig.class)
public class RutaAuditoriaRollbackIntegrationTest {

    private static final String DB_HOST = "127.0.0.1";
    private static final int DB_PORT = 8544;

    @Autowired
    private RutaTransaccionalTestHelper helper;

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private RutaAuditoriaRepository auditoriaRepository;

    @BeforeAll
    static void verificarPostgreSQLPruebas() {
        boolean postgresDisponible = false;
        try (Socket socket = new Socket(DB_HOST, DB_PORT)) {
            postgresDisponible = true;
        } catch (Exception ignored) {
            postgresDisponible = false;
        }

        Assumptions.assumeTrue(postgresDisponible,
                "Prueba omitida: PostgreSQL de pruebas en " + DB_HOST + ":" + DB_PORT + " no está disponible.");
    }

    @Test
    @DisplayName("Rollback ACID: Cuando falla la auditoría o se aborta la transacción, la ruta NO queda persistida")
    void testRollback_CreacionRutaConFallaEnAuditoria() {
        long conteoRutasAntes = rutaRepository.count();
        long conteoAuditoriaAntes = auditoriaRepository.count();

        RutaRequestDTO dto = new RutaRequestDTO("Iquitos", "Tarapoto", "10:00 hrs", 75.0);

        assertThrows(RuntimeException.class, () -> {
            helper.crearRutaYForzarFallo(dto);
        });

        long conteoRutasDespues = rutaRepository.count();
        long conteoAuditoriaDespues = auditoriaRepository.count();

        // Verificamos que ninguna fila quedó en PostgreSQL (Rollback atómico)
        assertEquals(conteoRutasAntes, conteoRutasDespues, "La tabla 'rutas' debe quedar intacta tras rollback");
        assertEquals(conteoAuditoriaAntes, conteoAuditoriaDespues, "La tabla 'rutas_auditoria' no debe tener registros huérfanos");
    }

    @Test
    @DisplayName("Persistencia atómica exitosa: Ruta y Auditoría se confirman conjuntamente")
    void testCommit_CreacionRutaYAuditoriaExitosas() {
        RutaRequestDTO dto = new RutaRequestDTO("Chimbote", "Huaraz", "06:00 hrs", 35.0);

        Ruta r = helper.crearRutaExitosa(dto);

        assertNotNull(r.getId());
        List<RutaAuditoria> historial = auditoriaRepository.findByRutaIdOrderByFechaOperacionDesc(r.getId());
        assertEquals(1, historial.size(), "Debe existir exactamente 1 registro de auditoría");
        assertEquals("CREACION", historial.get(0).getTipoOperacion());
        assertEquals("Chimbote", historial.get(0).getOrigen());
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public RutaTransaccionalTestHelper rutaTransaccionalTestHelper(
                RutaRepository rutaRepo,
                RutaAuditoriaRepository auditRepo,
                RutaService rutaService) {
            return new RutaTransaccionalTestHelper(rutaRepo, auditRepo, rutaService);
        }
    }

    @Service
    public static class RutaTransaccionalTestHelper {
        private final RutaRepository rutaRepo;
        private final RutaAuditoriaRepository auditRepo;
        private final RutaService rutaService;

        public RutaTransaccionalTestHelper(RutaRepository rutaRepo, RutaAuditoriaRepository auditRepo, RutaService rutaService) {
            this.rutaRepo = rutaRepo;
            this.auditRepo = auditRepo;
            this.rutaService = rutaService;
        }

        @Transactional
        public void crearRutaYForzarFallo(RutaRequestDTO dto) {
            // Se invoca el servicio que guarda la ruta y la auditoría
            rutaService.crearRuta(dto);

            // Se fuerza una excepción no comprobada para provocar ROLLBACK total
            throw new RuntimeException("Simulación de fallo forzado para verificar rollback de auditoría y ruta");
        }

        @Transactional
        public Ruta crearRutaExitosa(RutaRequestDTO dto) {
            return rutaService.crearRuta(dto);
        }
    }
}
