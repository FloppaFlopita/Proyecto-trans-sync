package com.transsync.ms_promociones;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promociones")
public class PromocionController {

    private final PromocionRepository repository;

    public PromocionController(PromocionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarTodas() {
        List<Promocion> lista = repository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("exito", true);
        response.put("mensaje", "Lista de promociones obtenida correctamente");
        response.put("datos", lista);
        return ResponseEntity.ok(response);
    }
}
