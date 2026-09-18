package com.transsync.ms_pagos;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/pagos")
public class PagoController {

    @Autowired
    private PagoRepository pagoRepository;

    // GET /pagos - Listar todos los pagos
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarPagos() {
        List<Pago> pagos = pagoRepository.findAll();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Pagos obtenidos correctamente");
        respuesta.put("datos", pagos);
        return ResponseEntity.ok(respuesta);
    }

    // GET /pagos/{id} - Obtener pago por ID
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerPago(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Pago> pago = pagoRepository.findById(id);
        if (pago.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago encontrado");
            respuesta.put("datos", pago.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Pago no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // POST /pagos - Registrar un nuevo pago
    @PostMapping
    public ResponseEntity<Map<String, Object>> crearPago(@RequestBody Pago pago) {
        if (pago.getEstado() == null || pago.getEstado().isBlank()) {
            pago.setEstado("PENDIENTE");
        }
        if (pago.getFechaPago() == null) {
            pago.setFechaPago(LocalDateTime.now());
        }
        Pago guardado = pagoRepository.save(pago);
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Pago registrado correctamente");
        respuesta.put("datos", guardado);
        return ResponseEntity.status(201).body(respuesta);
    }

    // PUT /pagos/{id} - Actualizar estado de un pago
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarPago(@PathVariable Long id,
                                                               @RequestBody Pago datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Pago> opcional = pagoRepository.findById(id);
        if (opcional.isPresent()) {
            Pago pago = opcional.get();
            if (datosActualizados.getReservaId() != null) pago.setReservaId(datosActualizados.getReservaId());
            if (datosActualizados.getMonto() != null) pago.setMonto(datosActualizados.getMonto());
            if (datosActualizados.getMetodoPago() != null) pago.setMetodoPago(datosActualizados.getMetodoPago());
            if (datosActualizados.getEstado() != null) pago.setEstado(datosActualizados.getEstado());
            if (datosActualizados.getFechaPago() != null) pago.setFechaPago(datosActualizados.getFechaPago());
            pagoRepository.save(pago);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago actualizado correctamente");
            respuesta.put("datos", pago);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Pago no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // DELETE /pagos/{id} - Marcar pago como rechazado
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> rechazarPago(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Pago> opcional = pagoRepository.findById(id);
        if (opcional.isPresent()) {
            Pago pago = opcional.get();
            pago.setEstado("RECHAZADO");
            pagoRepository.save(pago);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago marcado como rechazado");
            respuesta.put("datos", pago);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Pago no encontrado con id: " + id);
            respuesta.put("datos", null);
            return ResponseEntity.status(404).body(respuesta);
        }
    }
}
