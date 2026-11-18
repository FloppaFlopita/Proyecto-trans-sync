package com.transsync.ms_rutas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/rutas")
public class RutaController {

    @Autowired
    private RutaRepository rutaRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarRutas() {
        List<Ruta> rutas = rutaRepository.findAll();
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", true);
        respuesta.put("mensaje", "Rutas obtenidas correctamente");
        respuesta.put("datos", rutas);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerRuta(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Ruta> ruta = rutaRepository.findById(id);
        if (ruta.isPresent()) {
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta encontrada");
            respuesta.put("datos", ruta.get());
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Ruta no encontrada con id: " + id);
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> guardarRuta(@RequestBody Ruta ruta) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Ruta guardada = rutaRepository.save(ruta);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta registrada con éxito");
            respuesta.put("datos", guardada);
            return ResponseEntity.status(201).body(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error al guardar ruta: " + e.getMessage());
            return ResponseEntity.status(400).body(respuesta);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarRuta(@PathVariable Long id, @RequestBody Ruta datosActualizados) {
        Map<String, Object> respuesta = new HashMap<>();
        Optional<Ruta> opt = rutaRepository.findById(id);
        if (opt.isPresent()) {
            Ruta ruta = opt.get();
            if (datosActualizados.getOrigen() != null) ruta.setOrigen(datosActualizados.getOrigen());
            if (datosActualizados.getDestino() != null) ruta.setDestino(datosActualizados.getDestino());
            if (datosActualizados.getHorario() != null) ruta.setHorario(datosActualizados.getHorario());
            if (datosActualizados.getPrecio() != null) ruta.setPrecio(datosActualizados.getPrecio());
            Ruta guardada = rutaRepository.save(ruta);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta actualizada correctamente");
            respuesta.put("datos", guardada);
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Ruta no encontrada");
            return ResponseEntity.status(404).body(respuesta);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarRuta(@PathVariable Long id) {
        Map<String, Object> respuesta = new HashMap<>();
        if (rutaRepository.existsById(id)) {
            rutaRepository.deleteById(id);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Ruta eliminada correctamente");
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Ruta no encontrada");
            return ResponseEntity.status(404).body(respuesta);
        }
    }
}
