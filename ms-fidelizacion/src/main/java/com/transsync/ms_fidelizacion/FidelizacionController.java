package com.transsync.ms_fidelizacion;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fidelizacion")
public class FidelizacionController {

    private final FidelizacionRepository repository;

    public FidelizacionController(FidelizacionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarTodas() {
        List<Fidelizacion> lista = repository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("exito", true);
        response.put("mensaje", "Lista de fidelización obtenida correctamente");
        response.put("datos", lista);
        return ResponseEntity.ok(response);
    }
}
