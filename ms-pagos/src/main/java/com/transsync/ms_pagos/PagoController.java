package com.transsync.ms_pagos;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/pagos")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    // GET /pagos - Listar todos los pagos
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarPagos() {
        List<Pago> pagos = pagoService.listarPagos();
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
        Optional<Pago> pago = pagoService.obtenerPago(id);
        if (pago.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago encontrado");
            respuesta.put("datos", pago.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Pago no encontrado con id: " + id);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // POST /pagos - Registrar un nuevo pago (transaccional)
    @PostMapping
    public ResponseEntity<Map<String, Object>> crearPago(@RequestBody Pago pago) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Pago guardado = pagoService.crearPago(pago);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago registrado correctamente");
            respuesta.put("datos", guardado);
            return ResponseEntity.status(201).body(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(respuesta);
        }
    }

    // PUT /pagos/{id} - Actualizar estado de un pago
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarPago(@PathVariable Long id, @RequestBody Pago datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Pago pago = pagoService.actualizarPago(id, datosActualizados);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago actualizado correctamente");
            respuesta.put("datos", pago);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    // DELETE /pagos/{id} - Marcar pago como rechazado
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> rechazarPago(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Pago pago = pagoService.rechazarPago(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Pago marcado como rechazado");
            respuesta.put("datos", pago);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(respuesta);
        }
    }
}
