package com.transsync.ms_flota;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/buses/mantenimientos")
public class MantenimientoController {

    @Autowired
    private MantenimientoService mantenimientoService;

    // GET /buses/mantenimientos - Listar todas las intervenciones
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarTodos() {
        List<MantenimientoResponseDTO> lista = mantenimientoService.listarTodos();
        Map<String, Object> resp = new HashMap<>();
        resp.put("exito", true);
        resp.put("mensaje", "Historial de mantenimientos obtenido correctamente");
        resp.put("datos", lista);
        return ResponseEntity.ok(resp);
    }

    // GET /buses/mantenimientos/{id} - Obtener por ID
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerPorId(@PathVariable Long id) {
        Map<String, Object> resp = new HashMap<>();
        try {
            MantenimientoResponseDTO dto = mantenimientoService.obtenerPorId(id);
            resp.put("exito", true);
            resp.put("mensaje", "Mantenimiento encontrado");
            resp.put("datos", dto);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(resp);
        }
    }

    // GET /buses/mantenimientos/bus/{busId} - Historial por autobús
    @GetMapping("/bus/{busId}")
    public ResponseEntity<Map<String, Object>> listarPorBus(@PathVariable Long busId) {
        List<MantenimientoResponseDTO> lista = mantenimientoService.listarPorBus(busId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("exito", true);
        resp.put("mensaje", "Historial del autobús obtenido correctamente");
        resp.put("datos", lista);
        return ResponseEntity.ok(resp);
    }

    // GET /buses/mantenimientos/proximos - Próximos mantenimientos a 30 días
    @GetMapping("/proximos")
    public ResponseEntity<Map<String, Object>> listarProximos(@RequestParam(defaultValue = "30") int dias) {
        List<MantenimientoResponseDTO> lista = mantenimientoService.listarProximos(dias);
        Map<String, Object> resp = new HashMap<>();
        resp.put("exito", true);
        resp.put("mensaje", "Próximos mantenimientos programados");
        resp.put("datos", lista);
        return ResponseEntity.ok(resp);
    }

    // GET /buses/mantenimientos/resumen - Métricas analíticas de mantenimiento
    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> obtenerResumen() {
        Map<String, Object> resumen = mantenimientoService.obtenerResumenMantenimiento();
        Map<String, Object> resp = new HashMap<>();
        resp.put("exito", true);
        resp.put("mensaje", "Resumen operativo de mantenimiento obtenido");
        resp.put("datos", resumen);
        return ResponseEntity.ok(resp);
    }

    // POST /buses/mantenimientos - Programar nueva intervención
    @PostMapping
    public ResponseEntity<Map<String, Object>> programarMantenimiento(@Valid @RequestBody MantenimientoRequestDTO dto) {
        Map<String, Object> resp = new HashMap<>();
        try {
            MantenimientoResponseDTO guardado = mantenimientoService.programarMantenimiento(dto);
            resp.put("exito", true);
            resp.put("mensaje", "Mantenimiento preventivo programado exitosamente");
            resp.put("datos", guardado);
            return ResponseEntity.status(201).body(resp);
        } catch (IllegalArgumentException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(400).body(resp);
        } catch (IllegalStateException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(resp); // 409 Conflict ante solapamiento
        }
    }

    // PUT /buses/mantenimientos/{id}/iniciar - Iniciar intervención (PROGRAMADO -> EN_MANTENIMIENTO)
    @PutMapping("/{id}/iniciar")
    public ResponseEntity<Map<String, Object>> iniciarMantenimiento(@PathVariable Long id) {
        Map<String, Object> resp = new HashMap<>();
        try {
            MantenimientoResponseDTO actualizado = mantenimientoService.iniciarMantenimiento(id);
            resp.put("exito", true);
            resp.put("mensaje", "Mantenimiento iniciado. El vehículo queda temporalmente inhabilitado para viajes.");
            resp.put("datos", actualizado);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(resp);
        } catch (IllegalStateException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(resp);
        }
    }

    // PUT /buses/mantenimientos/{id}/finalizar - Finalizar intervención (EN_MANTENIMIENTO -> FINALIZADO)
    @PutMapping("/{id}/finalizar")
    public ResponseEntity<Map<String, Object>> finalizarMantenimiento(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> resp = new HashMap<>();
        try {
            Double costo = null;
            String obs = null;
            if (payload != null) {
                if (payload.get("costo") != null) {
                    costo = Double.valueOf(payload.get("costo").toString());
                }
                if (payload.get("observaciones") != null) {
                    obs = payload.get("observaciones").toString();
                }
            }
            MantenimientoResponseDTO finalizado = mantenimientoService.finalizarMantenimiento(id, costo, obs);
            resp.put("exito", true);
            resp.put("mensaje", "Mantenimiento finalizado con éxito. El vehículo vuelve a estar disponible para la flota.");
            resp.put("datos", finalizado);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(resp);
        } catch (IllegalStateException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(resp);
        }
    }

    // PUT /buses/mantenimientos/{id}/cancelar - Cancelar intervención
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Map<String, Object>> cancelarMantenimiento(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String motivo = payload != null ? payload.get("motivo") : null;
            MantenimientoResponseDTO cancelado = mantenimientoService.cancelarMantenimiento(id, motivo);
            resp.put("exito", true);
            resp.put("mensaje", "Mantenimiento cancelado");
            resp.put("datos", cancelado);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(resp);
        } catch (IllegalStateException e) {
            resp.put("exito", false);
            resp.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(resp);
        }
    }
}
