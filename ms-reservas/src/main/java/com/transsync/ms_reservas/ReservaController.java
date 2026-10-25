package com.transsync.ms_reservas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    // GET /reservas - Listar todas las reservas
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarReservas() {
        List<Reserva> reservas = reservaService.listarReservas();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Reservas obtenidas correctamente");
        respuesta.put("datos", reservas);
        return ResponseEntity.ok(respuesta);
    }

    // GET /reservas/{id} - Obtener reserva por ID
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

    // GET /reservas/bus/{busId}/asientos-ocupados - Consultar asientos bloqueados/ocupados para un bus y fecha
    @GetMapping("/bus/{busId}/asientos-ocupados")
    public ResponseEntity<Map<String, Object>> obtenerAsientosOcupados(
            @PathVariable Long busId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaViaje) {
        LocalDate fecha = (fechaViaje != null) ? fechaViaje : LocalDate.now();
        List<Integer> asientosOcupados = reservaService.obtenerAsientosOcupados(busId, fecha);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("busId", busId);
        respuesta.put("fechaViaje", fecha);
        respuesta.put("asientosOcupados", asientosOcupados);
        respuesta.put("totalOcupados", asientosOcupados.size());
        return ResponseEntity.ok(respuesta);
    }

    // POST /reservas/multiple - Reserva de uno o más asientos seleccionados en el bus
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

    // GET /reservas/bus/{busId} - Listar pasajeros asignados a un bus
    @GetMapping("/bus/{busId}")
    public ResponseEntity<Map<String, Object>> listarPorBus(@PathVariable Long busId) {
        Map<String, Object> respuesta = new HashMap<>();
        List<Reserva> reservas = reservaService.listarPorBus(busId);
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Pasajeros del bus obtenidos");
        respuesta.put("datos", reservas);
        return ResponseEntity.ok(respuesta);
    }

    // GET /reservas/bus/{busId}/manifiesto - Manifiesto completo para el conductor
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

    // GET /reservas/conductor/{conductorId}/manifiesto - Manifiesto por ID del conductor
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

    // GET /reservas/historial/cliente/{dni} - Historial de compras/reservas por DNI
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

    // GET /reservas/historial/usuario/{email} - Historial de compras/reservas por Email
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

    // GET /reservas/ventas - Historial global de ventas para Administrador con filtro por fecha
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

    // DELETE /reservas/bus/{busId}/reiniciar - Reiniciar bus para demostración en vivo
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

    // POST /reservas - Crear nueva reserva individual
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

    // PUT /reservas/{id} - Actualizar datos de la reserva
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

    // DELETE /reservas/{id} - Cancelar reserva y liberar asiento en ms-flota
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
