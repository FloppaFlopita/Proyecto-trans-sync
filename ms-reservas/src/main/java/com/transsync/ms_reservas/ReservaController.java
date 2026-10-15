package com.transsync.ms_reservas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/reservas")
public class ReservaController {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private FlotaClient flotaClient;

    // GET /reservas - Listar todas las reservas
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarReservas() {
        List<Reserva> reservas = reservaRepository.findAll();
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
        Optional<Reserva> reserva = reservaRepository.findById(id);
        if (reserva.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva encontrada");
            respuesta.put("datos", reserva.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Reserva no encontrada con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // POST /reservas - Crear nueva reserva con validación de disponibilidad en ms-flota
    @PostMapping
    public ResponseEntity<Map<String, Object>> crearReserva(@RequestBody Reserva reserva) {
        Map<String, Object> respuesta = new HashMap<>();

        // Validar que se envió un busId
        if (reserva.getBusId() == null) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Debe especificar el busId para la reserva");
            respuesta.put("datos", null);
            return ResponseEntity.status(400).body(respuesta);
        }

        // Consultar disponibilidad a ms-flota via OpenFeign
        try {
            ResponseEntity<Map<String, Object>> respuestaFlota =
                    flotaClient.verificarDisponibilidad(reserva.getBusId());

            Map<String, Object> datosFlota = (Map<String, Object>) respuestaFlota.getBody().get("datos");
            boolean disponible = (Boolean) datosFlota.get("disponible");

            if (!disponible) {
                respuesta.put("exito", false);
                respuesta.put("mensaje", "No hay asientos disponibles en el bus con id: " + reserva.getBusId());
                respuesta.put("datos", null);
                return ResponseEntity.status(409).body(respuesta);
            }

            // Hay asientos: descontar 1 asiento en ms-flota
            flotaClient.descontarAsiento(reserva.getBusId());

        } catch (Exception e) {
            // Si ms-flota no responde, igual se guarda como PENDIENTE con advertencia
            respuesta.put("exito", false);
            respuesta.put("mensaje", "No se pudo verificar disponibilidad con ms-flota: " + e.getMessage());
            respuesta.put("datos", null);
            return ResponseEntity.status(503).body(respuesta);
        }

        // Todo OK: guardar la reserva como CONFIRMADA
        reserva.setEstado("CONFIRMADA");
        Reserva guardada = reservaRepository.save(reserva);

        respuesta.put("exito", true);
        respuesta.put("mensaje", "Reserva creada y asiento confirmado correctamente");
        respuesta.put("datos", guardada);
        return ResponseEntity.status(201).body(respuesta);
    }

    // PUT /reservas/{id} - Actualizar datos de la reserva
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarReserva(@PathVariable Long id,
                                                                  @RequestBody Reserva datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Reserva> opcional = reservaRepository.findById(id);
        if (opcional.isPresent()) {
            Reserva reserva = opcional.get();
            if (datosActualizados.getNombrePasajero() != null) reserva.setNombrePasajero(datosActualizados.getNombrePasajero());
            if (datosActualizados.getDniPasajero() != null) reserva.setDniPasajero(datosActualizados.getDniPasajero());
            if (datosActualizados.getRutaId() != null) reserva.setRutaId(datosActualizados.getRutaId());
            if (datosActualizados.getBusId() != null) reserva.setBusId(datosActualizados.getBusId());
            if (datosActualizados.getFechaViaje() != null) reserva.setFechaViaje(datosActualizados.getFechaViaje());
            if (datosActualizados.getEstado() != null) reserva.setEstado(datosActualizados.getEstado());
            reservaRepository.save(reserva);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva actualizada correctamente");
            respuesta.put("datos", reserva);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Reserva no encontrada con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // DELETE /reservas/{id} - Cancelar reserva y liberar asiento en ms-flota
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancelarReserva(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Reserva> opcional = reservaRepository.findById(id);
        if (opcional.isPresent()) {
            Reserva reserva = opcional.get();

            // Liberar el asiento en ms-flota si la reserva estaba CONFIRMADA
            if ("CONFIRMADA".equals(reserva.getEstado()) && reserva.getBusId() != null) {
                try {
                    flotaClient.liberarAsiento(reserva.getBusId());
                } catch (Exception e) {
                    // Log del error pero igual cancela la reserva
                    System.err.println(">>> Advertencia: no se pudo liberar asiento en ms-flota: " + e.getMessage());
                }
            }

            reserva.setEstado("CANCELADA");
            reservaRepository.save(reserva);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Reserva cancelada correctamente");
            respuesta.put("datos", reserva);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Reserva no encontrada con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }
}
