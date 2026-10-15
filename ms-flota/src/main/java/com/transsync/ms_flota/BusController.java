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
    private BusRepository busRepository;

    // GET /buses - Listar todos los buses
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarBuses() {
        List<Bus> buses = busRepository.findAll();
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
        Optional<Bus> bus = busRepository.findById(id);
        if (bus.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus encontrado");
            respuesta.put("datos", bus.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // GET /buses/{id}/disponibilidad - Consulta de asientos (usado por OpenFeign de ms-reservas)
    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidad(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> opcional = busRepository.findById(id);
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
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // PUT /buses/{id}/descontar-asiento - Descuenta 1 asiento al confirmar reserva (llamado por ms-reservas)
    @PutMapping("/{id}/descontar-asiento")
    public ResponseEntity<Map<String, Object>> descontarAsiento(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> opcional = busRepository.findById(id);
        if (opcional.isPresent()) {
            Bus bus = opcional.get();
            if (bus.getAsientosDisponibles() <= 0) {
                respuesta.put("exito", false);
                respuesta.put("mensaje", "No hay asientos disponibles para descontar");
                respuesta.put("datos", null);
                return ResponseEntity.status(409).body(respuesta);
            }
            bus.setAsientosDisponibles(bus.getAsientosDisponibles() - 1);
            busRepository.save(bus);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Asiento descontado correctamente");
            respuesta.put("datos", Map.of(
                "busId", bus.getId(),
                "asientosDisponibles", bus.getAsientosDisponibles()
            ));
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // PUT /buses/{id}/liberar-asiento - Libera 1 asiento al cancelar reserva
    @PutMapping("/{id}/liberar-asiento")
    public ResponseEntity<Map<String, Object>> liberarAsiento(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> opcional = busRepository.findById(id);
        if (opcional.isPresent()) {
            Bus bus = opcional.get();
            if (bus.getAsientosDisponibles() < bus.getCapacidad()) {
                bus.setAsientosDisponibles(bus.getAsientosDisponibles() + 1);
                busRepository.save(bus);
            }
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Asiento liberado correctamente");
            respuesta.put("datos", Map.of(
                "busId", bus.getId(),
                "asientosDisponibles", bus.getAsientosDisponibles()
            ));
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // POST /buses - Registrar nuevo bus (valida placa duplicada)
    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarBus(@RequestBody Bus bus) {
        Map<String, Object> respuesta = new HashMap<>();

        // Validar placa no vacía
        if (bus.getPlaca() == null || bus.getPlaca().isBlank()) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "La placa es obligatoria");
            respuesta.put("datos", null);
            return ResponseEntity.status(400).body(respuesta);
        }

        // Validar capacidad
        if (bus.getCapacidad() == null || bus.getCapacidad() <= 0) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "La capacidad debe ser mayor a 0");
            respuesta.put("datos", null);
            return ResponseEntity.status(400).body(respuesta);
        }

        // Validar placa duplicada
        if (busRepository.existsByPlaca(bus.getPlaca().toUpperCase())) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Ya existe un bus con la placa: " + bus.getPlaca());
            respuesta.put("datos", null);
            return ResponseEntity.status(409).body(respuesta);
        }

        bus.setPlaca(bus.getPlaca().toUpperCase());
        // Si no se envía asientosDisponibles, arranca igual a capacidad
        if (bus.getAsientosDisponibles() == null) {
            bus.setAsientosDisponibles(bus.getCapacidad());
        }

        Bus guardado = busRepository.save(bus);
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Bus registrado correctamente");
        respuesta.put("datos", guardado);
        return ResponseEntity.status(201).body(respuesta);
    }

    // PUT /buses/{id} - Actualizar datos del bus
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarBus(@PathVariable Long id,
                                                              @RequestBody Bus datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Bus> opcional = busRepository.findById(id);
        if (opcional.isPresent()) {
            Bus bus = opcional.get();

            // Validar placa duplicada si se está cambiando
            if (datosActualizados.getPlaca() != null && !datosActualizados.getPlaca().isBlank()) {
                String nuevaPlaca = datosActualizados.getPlaca().toUpperCase();
                if (!nuevaPlaca.equals(bus.getPlaca()) && busRepository.existsByPlaca(nuevaPlaca)) {
                    respuesta.put("exito", false);
                    respuesta.put("mensaje", "Ya existe un bus con la placa: " + nuevaPlaca);
                    respuesta.put("datos", null);
                    return ResponseEntity.status(409).body(respuesta);
                }
                bus.setPlaca(nuevaPlaca);
            }
            if (datosActualizados.getModelo() != null) bus.setModelo(datosActualizados.getModelo());
            if (datosActualizados.getCapacidad() != null && datosActualizados.getCapacidad() > 0)
                bus.setCapacidad(datosActualizados.getCapacidad());
            if (datosActualizados.getAsientosDisponibles() != null)
                bus.setAsientosDisponibles(datosActualizados.getAsientosDisponibles());

            busRepository.save(bus);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus actualizado correctamente");
            respuesta.put("datos", bus);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // DELETE /buses/{id} - Eliminar bus
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarBus(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        if (busRepository.existsById(id)) {
            busRepository.deleteById(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus eliminado correctamente");
            respuesta.put("datos", null);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Bus no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }
}
