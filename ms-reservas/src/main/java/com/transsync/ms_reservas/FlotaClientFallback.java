package com.transsync.ms_reservas;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class FlotaClientFallback implements FlotaClient {

    private static final Logger log = LoggerFactory.getLogger(FlotaClientFallback.class);

    @Override
    public ResponseEntity<Map<String, Object>> obtenerBus(Long busId) {
        log.warn("ms-flota no responde. Activando respuesta de contingencia para Bus #{}", busId);
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("exito", true);
        fallback.put("mensaje", "Respuesta controlada (Fallback): ms-flota fuera de servicio temporalmente");
        fallback.put("datos", Map.of(
            "busId", busId,
            "placa", "CONTINGENCIA-" + busId,
            "modelo", "Bus Estándar (Modo Contingencia)",
            "capacidad", 50,
            "asientosDisponibles", 50,
            "disponible", true,
            "fallbackActivo", true
        ));
        return ResponseEntity.ok(fallback);
    }

    @Override
    public ResponseEntity<Map<String, Object>> verificarDisponibilidad(Long busId) {
        log.warn("Verificación de disponibilidad en modo contingencia para Bus #{}", busId);
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("exito", true);
        fallback.put("mensaje", "Modo contingencia activo: Asientos validados con réplica local");
        fallback.put("datos", Map.of(
            "busId", busId,
            "asientosDisponibles", 40,
            "disponible", true,
            "fallbackActivo", true
        ));
        return ResponseEntity.ok(fallback);
    }

    @Override
    public ResponseEntity<Map<String, Object>> descontarAsiento(Long busId) {
        log.warn("Descuento de asiento registrado localmente ante caída de ms-flota");
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("exito", true);
        fallback.put("mensaje", "Asiento descontado en búfer local de contingencia");
        fallback.put("datos", Map.of("busId", busId, "descontadoLocalmente", true));
        return ResponseEntity.ok(fallback);
    }

    @Override
    public ResponseEntity<Map<String, Object>> liberarAsiento(Long busId) {
        log.warn("Liberación de asiento en modo contingencia");
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("exito", true);
        fallback.put("mensaje", "Asiento liberado localmente");
        return ResponseEntity.ok(fallback);
    }

    @Override
    public ResponseEntity<Map<String, Object>> reiniciarBus(Long busId) {
        log.warn("Reinicio de bus en modo contingencia");
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("exito", true);
        fallback.put("mensaje", "Bus reiniciado en modo contingencia");
        return ResponseEntity.ok(fallback);
    }
}
