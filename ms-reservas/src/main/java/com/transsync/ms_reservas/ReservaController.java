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

    // POST /reservas - Crear nueva reserva
    @PostMapping
    public ResponseEntity<Map<String, Object>> crearReserva(@RequestBody Reserva reserva) {
        if (reserva.getEstado() == null || reserva.getEstado().isBlank()) {
            reserva.setEstado("PENDIENTE");
        }
        Reserva guardada = reservaRepository.save(reserva);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Reserva creada correctamente");
        respuesta.put("datos", guardada);
        return ResponseEntity.status(201).body(respuesta);
    }

    // PUT /reservas/{id} - Actualizar estado de reserva
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

    // DELETE /reservas/{id} - Cancelar reserva
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancelarReserva(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Reserva> opcional = reservaRepository.findById(id);
        if (opcional.isPresent()) {
            Reserva reserva = opcional.get();
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
