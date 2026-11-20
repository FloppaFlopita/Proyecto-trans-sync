package com.transsync.ms_flota;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/buses")
public class BusController {

    @Autowired
    private BusService busService;

    @Autowired
    private MantenimientoService mantenimientoService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarBuses() {
        List<Bus> buses = busService.listarBuses();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Buses obtenidos correctamente");
        respuesta.put("datos", buses);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        Map<String, Object> stats = busService.obtenerEstadisticasFlota();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Estadísticas analíticas de flota calculadas");
        respuesta.put("datos", stats);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerBus(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> bus = busService.obtenerBus(id);
        if (bus.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus encontrado");
            respuesta.put("datos", bus.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidad(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> opcional = busService.obtenerBus(id);
        if (opcional.isPresent()) {
            Bus bus = opcional.get();
            boolean enMantenimiento = mantenimientoService != null && mantenimientoService.busEnMantenimiento(id);
            boolean hayAsientos = (bus.getAsientosDisponibles() != null && bus.getAsientosDisponibles() > 0) && !enMantenimiento;

            String mensaje;
            if (enMantenimiento) {
                mensaje = "El vehículo " + bus.getPlaca() + " se encuentra EN MANTENIMIENTO PREVENTIVO (fuera de servicio)";
            } else if (hayAsientos) {
                mensaje = "Hay asientos disponibles";
            } else {
                mensaje = "No hay asientos disponibles (autobús lleno)";
            }

            Map<String, Object> datos = new HashMap<>();
            datos.put("busId", bus.getId());
            datos.put("placa", bus.getPlaca());
            datos.put("modelo", bus.getModelo());
            datos.put("capacidad", bus.getCapacidad());
            datos.put("asientosDisponibles", bus.getAsientosDisponibles());
            datos.put("disponible", hayAsientos);
            datos.put("enMantenimiento", enMantenimiento);

            respuesta.put("exito", true);
            respuesta.put("mensaje", mensaje);
            respuesta.put("datos", datos);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    @PutMapping("/{id}/descontar-asiento")
    public ResponseEntity<Map<String, Object>> descontarAsiento(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Bus bus = busService.descontarAsiento(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Asiento descontado correctamente");
            respuesta.put("datos", Map.of(
                "busId", bus.getId(),
                "asientosDisponibles", bus.getAsientosDisponibles()
            ));
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta); // 409 Conflict ante bus lleno o en mantenimiento
        }
    }

    @PutMapping("/{id}/liberar-asiento")
    public ResponseEntity<Map<String, Object>> liberarAsiento(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Bus bus = busService.liberarAsiento(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Asiento liberado correctamente");
            respuesta.put("datos", Map.of(
                "busId", bus.getId(),
                "asientosDisponibles", bus.getAsientosDisponibles()
            ));
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        }
    }

    @PutMapping("/{id}/reiniciar")
    public ResponseEntity<Map<String, Object>> reiniciarBus(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Bus bus = busService.reiniciarBus(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus reiniciado con todos sus asientos disponibles");
            respuesta.put("datos", bus);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarBus(@RequestBody Bus bus) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Bus guardado = busService.registrarBus(bus);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus registrado correctamente");
            respuesta.put("datos", guardado);
            return ResponseEntity.status(201).body(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(400).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarBus(@PathVariable Long id, @RequestBody Bus datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Bus actualizado = busService.actualizarBus(id, datosActualizados);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus actualizado correctamente");
            respuesta.put("datos", actualizado);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarBus(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            boolean eliminado = busService.eliminarBus(id);
            if (eliminado) {
                respuesta.put("exito", true);
                respuesta.put("mensaje", "Bus eliminado correctamente");
                return ResponseEntity.ok(respuesta);
            } else {
                respuesta.put("exito", false);
                respuesta.put("mensaje", "Bus no encontrado con id: " + id);
                return ResponseEntity.status(404).body(respuesta);
            }
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        }
    }
}
