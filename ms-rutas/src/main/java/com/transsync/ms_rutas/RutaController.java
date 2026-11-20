package com.transsync.ms_rutas;

import com.transsync.ms_rutas.dto.RutaEstadisticasDTO;
import com.transsync.ms_rutas.dto.RutaRequestDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/rutas")
public class RutaController {

    @Autowired
    private RutaService rutaService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarRutas() {
        List<Ruta> rutas = rutaService.listarTodas();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Rutas obtenidas correctamente");
        respuesta.put("datos", rutas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerRuta(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Ruta ruta = rutaService.obtenerPorId(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta encontrada");
            respuesta.put("datos", ruta);
            return ResponseEntity.ok(respuesta);
        } catch (NoSuchElementException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(respuesta);
        }
    }

    @GetMapping("/buscar")
    public ResponseEntity<Map<String, Object>> buscarRutas(
            @RequestParam(required = false) String origen,
            @RequestParam(required = false) String destino,
            @RequestParam(required = false) Double maxPrecio
    ) {
        List<Ruta> rutas = rutaService.buscarRutas(origen, destino, maxPrecio);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Búsqueda de rutas completada");
        respuesta.put("datos", rutas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        RutaEstadisticasDTO stats = rutaService.obtenerEstadisticas();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Estadísticas analíticas de rutas calculadas");
        respuesta.put("datos", stats);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/historial")
    public ResponseEntity<Map<String, Object>> listarHistorial() {
        List<RutaAuditoria> historial = rutaService.listarHistorial();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Historial de auditoría transaccional de rutas obtenido");
        respuesta.put("datos", historial);
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> guardarRuta(@Valid @RequestBody RutaRequestDTO request) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Ruta guardada = rutaService.crearRuta(request);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta registrada con éxito");
            respuesta.put("datos", guardada);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error interno al guardar ruta: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(respuesta);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarRuta(
            @PathVariable Long id,
            @Valid @RequestBody RutaRequestDTO request
    ) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Ruta guardada = rutaService.actualizarRuta(id, request);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta actualizada correctamente");
            respuesta.put("datos", guardada);
            return ResponseEntity.ok(respuesta);
        } catch (NoSuchElementException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error al actualizar ruta: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(respuesta);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarRuta(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            rutaService.eliminarRuta(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta eliminada correctamente");
            return ResponseEntity.ok(respuesta);
        } catch (NoSuchElementException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(respuesta);
        }
    }
}
