package com.transsync.ms_facturacion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/facturacion")
public class FacturacionController {

    @Autowired
    private FacturacionService facturacionService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarTodos() {
        Map<String, Object> response = new HashMap<>();
        response.put("exito", true);
        response.put("mensaje", "Lista de comprobantes obtenida correctamente");
        response.put("datos", facturacionService.listarTodos());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerPorId(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Optional<Comprobante> comprobante = facturacionService.obtenerPorId(id);
        if (comprobante.isPresent()) {
            response.put("exito", true);
            response.put("mensaje", "Comprobante encontrado");
            response.put("datos", comprobante.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("exito", false);
            response.put("mensaje", "Comprobante no encontrado con ID: " + id);
            return ResponseEntity.status(404).body(response);
        }
    }

    @GetMapping("/reserva/{reservaId}")
    public ResponseEntity<Map<String, Object>> obtenerPorReserva(@PathVariable Long reservaId) {
        Map<String, Object> response = new HashMap<>();
        Optional<Comprobante> comprobante = facturacionService.obtenerPorReserva(reservaId);
        if (comprobante.isPresent()) {
            response.put("exito", true);
            response.put("mensaje", "Comprobante encontrado para la reserva");
            response.put("datos", comprobante.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("exito", false);
            response.put("mensaje", "No hay comprobante emitido para la reserva ID: " + reservaId);
            return ResponseEntity.status(404).body(response);
        }
    }

    @PostMapping("/emitir")
    public ResponseEntity<Map<String, Object>> emitirComprobante(@RequestBody EmitirComprobanteRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (request.getReservaId() == null || request.getPagoId() == null || request.getTotal() == null) {
                response.put("exito", false);
                response.put("mensaje", "Los campos reservaId, pagoId y total son obligatorios");
                return ResponseEntity.badRequest().body(response);
            }

            Comprobante emitido = facturacionService.emitirComprobante(request);
            response.put("exito", true);
            response.put("mensaje", "Comprobante emitido exitosamente: " + emitido.getNumeroCompleto());
            response.put("datos", emitido);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalStateException e) {
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(response);
        } catch (Exception e) {
            response.put("exito", false);
            response.put("mensaje", "Error al emitir comprobante: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/anular")
    public ResponseEntity<Map<String, Object>> anularComprobante(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            String motivo = body != null ? body.get("motivo") : null;
            Comprobante anulado = facturacionService.anularComprobante(id, motivo);
            response.put("exito", true);
            response.put("mensaje", "Comprobante anulado correctamente");
            response.put("datos", anulado);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(response);
        } catch (IllegalStateException e) {
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(response);
        } catch (Exception e) {
            response.put("exito", false);
            response.put("mensaje", "Error al anular comprobante: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

