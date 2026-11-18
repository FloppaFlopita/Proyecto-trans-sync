package com.transsync.ms_fidelizacion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/fidelizacion")
public class FidelizacionController {

    @Autowired
    private FidelizacionService fidelizacionService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarTodas() {
        Map<String, Object> response = new HashMap<>();
        response.put("exito", true);
        response.put("mensaje", "Lista de fidelización obtenida correctamente");
        response.put("datos", fidelizacionService.listarTodas());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pasajero/{pasajeroId}")
    public ResponseEntity<Map<String, Object>> obtenerPorPasajero(@PathVariable Long pasajeroId) {
        Map<String, Object> response = new HashMap<>();
        response.put("exito", true);
        response.put("mensaje", "Cuenta de fidelización obtenida");
        response.put("datos", fidelizacionService.obtenerPorPasajero(pasajeroId));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/historial/{pasajeroId}")
    public ResponseEntity<Map<String, Object>> obtenerHistorial(@PathVariable Long pasajeroId) {
        Map<String, Object> response = new HashMap<>();
        response.put("exito", true);
        response.put("mensaje", "Historial de movimientos obtenido");
        response.put("datos", fidelizacionService.obtenerHistorial(pasajeroId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/acumular")
    public ResponseEntity<Map<String, Object>> acumularPuntos(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long pasajeroId = Long.valueOf(body.get("pasajeroId").toString());
            Integer puntos = Integer.valueOf(body.get("puntos").toString());
            String motivo = body.get("motivo") != null ? body.get("motivo").toString() : null;

            Fidelizacion cuenta = fidelizacionService.acumularPuntos(pasajeroId, puntos, motivo);
            response.put("exito", true);
            response.put("mensaje", "Puntos acumulados correctamente");
            response.put("datos", cuenta);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("exito", false);
            response.put("mensaje", "Error al acumular puntos: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/canjear")
    public ResponseEntity<Map<String, Object>> canjearPuntos(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long pasajeroId = Long.valueOf(body.get("pasajeroId").toString());
            Integer puntos = Integer.valueOf(body.get("puntos").toString());
            String motivo = body.get("motivo") != null ? body.get("motivo").toString() : null;

            Fidelizacion cuenta = fidelizacionService.canjearPuntos(pasajeroId, puntos, motivo);
            response.put("exito", true);
            response.put("mensaje", "Puntos canjeados correctamente");
            response.put("datos", cuenta);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("exito", false);
            response.put("mensaje", "Error al canjear puntos: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
