package com.transsync.ms_reservas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarReservas() {
        List<Reserva> reservas = reservaService.listarReservas();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Reservas obtenidas correctamente");
        respuesta.put("datos", reservas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerReserva(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Reserva> reserva = reservaService.obtenerReserva(id);
        if (reserva.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva encontrada");
            respuesta.put("datos", reserva.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Reserva no encontrada con id: " + id);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    @GetMapping("/bus/{busId}/asientos-ocupados")
    public ResponseEntity<Map<String, Object>> obtenerAsientosOcupados(
            @PathVariable Long busId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaViaje) {
        LocalDate fecha = (fechaViaje != null) ? fechaViaje : LocalDate.now();
        Map<String, Object> detalle = reservaService.obtenerDetalleAsientos(busId, fecha);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("busId", busId);
        respuesta.put("fechaViaje", fecha);
        respuesta.put("asientosOcupados", detalle.get("ocupados"));
        respuesta.put("asientosEnReserva", detalle.get("enReserva"));
        respuesta.put("todosBloqueados", detalle.get("todosBloqueados"));
        respuesta.put("totalOcupados", ((List<?>) detalle.get("ocupados")).size());
        respuesta.put("totalEnReserva", ((List<?>) detalle.get("enReserva")).size());
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/bloquear-temporal")
    public ResponseEntity<Map<String, Object>> bloquearAsientosTemporal(@RequestBody Map<String, Object> body) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Long busId = Long.valueOf(String.valueOf(body.get("busId")));
            String fechaStr = (String) body.get("fechaViaje");
            LocalDate fecha = (fechaStr != null && !fechaStr.isBlank()) ? LocalDate.parse(fechaStr) : LocalDate.now();
            List<?> rawAsientos = (List<?>) body.get("asientos");
            List<Integer> asientos = rawAsientos != null ? rawAsientos.stream().map(a -> Integer.valueOf(String.valueOf(a))).toList() : Collections.emptyList();
            String token = (String) body.get("token");

            List<Integer> bloqueados = reservaService.bloquearAsientosTemporal(busId, fecha, asientos, token);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Asientos bloqueados en reserva temporal exitosamente");
            respuesta.put("asientosBloqueados", bloqueados);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(respuesta);
        }
    }

    @PostMapping("/liberar-temporal")
    public ResponseEntity<Map<String, Object>> liberarAsientosTemporal(@RequestBody Map<String, Object> body) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Long busId = Long.valueOf(String.valueOf(body.get("busId")));
            String fechaStr = (String) body.get("fechaViaje");
            LocalDate fecha = (fechaStr != null && !fechaStr.isBlank()) ? LocalDate.parse(fechaStr) : LocalDate.now();
            List<?> rawAsientos = (List<?>) body.get("asientos");
            List<Integer> asientos = rawAsientos != null ? rawAsientos.stream().map(a -> Integer.valueOf(String.valueOf(a))).toList() : Collections.emptyList();

            reservaService.liberarAsientosTemporal(busId, fecha, asientos);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Asientos liberados de reserva temporal");
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(respuesta);
        }
    }

    @PostMapping("/finalizar-viaje")
    public ResponseEntity<Map<String, Object>> finalizarViaje(@RequestBody Map<String, Object> body) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Long busId = Long.valueOf(String.valueOf(body.get("busId")));
            String fechaStr = (String) body.get("fechaViaje");
            LocalDate fecha = (fechaStr != null && !fechaStr.isBlank()) ? LocalDate.parse(fechaStr) : LocalDate.now();

            Map<String, Object> resultado = reservaService.finalizarViaje(busId, fecha);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error al finalizar el viaje: " + e.getMessage());
            return ResponseEntity.badRequest().body(respuesta);
        }
    }

    @PostMapping("/multiple")
    public ResponseEntity<Map<String, Object>> crearReservasMultiples(@RequestBody ReservaMultiRequest request) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Map<String, Object> resultado = reservaService.crearReservasMultiples(request);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva de " + request.getAsientos().size() + " asiento(s) realizada con éxito");
            respuesta.put("datos", resultado);
            return ResponseEntity.status(201).body(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(400).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error interno al procesar la reserva: " + e.getMessage());
            return ResponseEntity.status(500).body(respuesta);
        }
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<Map<String, Object>> listarPorBus(@PathVariable Long busId) {
        Map<String, Object> respuesta = new HashMap<>();
        List<Reserva> reservas = reservaService.listarPorBus(busId);
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Pasajeros del bus obtenidos");
        respuesta.put("datos", reservas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/bus/{busId}/manifiesto")
    public ResponseEntity<Map<String, Object>> obtenerManifiestoBus(@PathVariable Long busId) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Map<String, Object> manifiesto = reservaService.obtenerManifiestoConductor(busId);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Manifiesto de viaje obtenido correctamente");
            respuesta.put("datos", manifiesto);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error al obtener manifiesto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(respuesta);
        }
    }

    @GetMapping("/conductor/{conductorId}/manifiesto")
    public ResponseEntity<Map<String, Object>> obtenerManifiestoConductor(@PathVariable Long conductorId) {
        Long busAsignado = conductorId;
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Map<String, Object> manifiesto = reservaService.obtenerManifiestoConductor(busAsignado);
            manifiesto.put("conductorId", conductorId);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Manifiesto del conductor obtenido correctamente");
            respuesta.put("datos", manifiesto);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error al obtener manifiesto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(respuesta);
        }
    }

    @GetMapping("/historial/cliente/{dni}")
    public ResponseEntity<Map<String, Object>> historialPorDni(@PathVariable String dni) {
        Map<String, Object> respuesta = new HashMap<>();
        List<Reserva> reservas = reservaService.obtenerHistorialPorDni(dni);
        respuesta.put("exito", true);
        respuesta.put("dni", dni);
        respuesta.put("totalReservas", reservas.size());
        respuesta.put("datos", reservas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/historial/usuario/{email}")
    public ResponseEntity<Map<String, Object>> historialPorEmail(@PathVariable String email) {
        Map<String, Object> respuesta = new HashMap<>();
        List<Reserva> reservas = reservaService.obtenerHistorialPorEmail(email);
        respuesta.put("exito", true);
        respuesta.put("email", email);
        respuesta.put("totalReservas", reservas.size());
        respuesta.put("datos", reservas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/ventas")
    public ResponseEntity<Map<String, Object>> obtenerVentasAdmin(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate fecha) {
        Map<String, Object> resumen = reservaService.obtenerResumenVentas(fecha);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Historial de ventas y recaudación obtenido correctamente");
        respuesta.put("datos", resumen);
        return ResponseEntity.ok(respuesta);
    }

    @DeleteMapping("/bus/{busId}/reiniciar")
    public ResponseEntity<Map<String, Object>> reiniciarBus(@PathVariable Long busId) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            reservaService.reiniciarReservasBus(busId);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Bus #" + busId + " reiniciado con éxito. Todos los asientos ahora están libres.");
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error al reiniciar bus: " + e.getMessage());
            return ResponseEntity.internalServerError().body(respuesta);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearReserva(@RequestBody Reserva reserva) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Reserva guardada = reservaService.crearReserva(reserva);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva creada y asiento confirmado correctamente");
            respuesta.put("datos", guardada);
            return ResponseEntity.status(201).body(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(400).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(503).body(respuesta);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarReserva(@PathVariable Long id, @RequestBody Reserva datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Reserva actualizada = reservaService.actualizarReserva(id, datosActualizados);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva actualizada correctamente");
            respuesta.put("datos", actualizada);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancelarReserva(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Reserva cancelada = reservaService.cancelarReserva(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva cancelada correctamente");
            respuesta.put("datos", cancelada);
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
}
