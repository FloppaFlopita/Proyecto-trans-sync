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

    // GET /buses - Listar todos los buses
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarBuses() {
        List<Bus> buses = busService.listarBuses();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Buses obtenidos correctamente");
        respuesta.put("datos", buses);
        return ResponseEntity.ok(respuesta);
    }

    // GET /buses/{id} - Obtener bus por ID
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

    // GET /buses/{id}/disponibilidad - Consulta de asientos
    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidad(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> opcional = busService.obtenerBus(id);
        if (opcional.isPresent()) {
            Bus bus = opcional.get();
            boolean hayAsientos = bus.getAsientosDisponibles() > 0;
            respuesta.put("exito", true);
            respuesta.put("mensaje", hayAsientos ? "Hay asientos disponibles" : "No hay asientos disponibles");
            respuesta.put("datos", Map.of(
                "busId", bus.getId(),
                "placa", bus.getPlaca(),
                "modelo", bus.getModelo(),
                "asientosDisponibles", bus.getAsientosDisponibles(),
                "disponible", hayAsientos
            ));
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // PUT /buses/{id}/descontar-asiento - Descuenta 1 asiento (transaccional)
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
            return ResponseEntity.status(409).body(respuesta);
        }
    }

    // PUT /buses/{id}/liberar-asiento - Libera 1 asiento (transaccional)
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
        }
    }

    // PUT /buses/{id}/reiniciar - Reinicia todos los asientos a la capacidad total
    @PutMapping("/{id}/reiniciar")
    public ResponseEntity<Map<String, Object>> reiniciarBus(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> op = busService.obtenerBus(id);
        if (op.isPresent()) {
            Bus bus = op.get();
            bus.setAsientosDisponibles(bus.getCapacidad());
            busService.actualizarBus(id, bus);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus reiniciado con todos sus asientos disponibles");
            respuesta.put("datos", bus);
            return ResponseEntity.ok(respuesta);
        }
        respuesta.put("exito", false);
        return ResponseEntity.status(404).body(respuesta);
    }

    // POST /buses - Registrar nuevo bus
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

    // PUT /buses/{id} - Actualizar datos del bus
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

    // DELETE /buses/{id} - Eliminar bus
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarBus(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
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
    }
}
