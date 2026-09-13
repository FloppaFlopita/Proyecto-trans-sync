package com.transsync.msauth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credenciales) {
        // Aquí irá la lógica real de validación y JWT de Spring Security
        Map<String, Object> respuesta = Map.of(
            "exito", true,
            "mensaje", "Login exitoso",
            "datos", Map.of("token", "jwt_simulado_123", "rol", "ROLE_CLIENTE")
        );
        return ResponseEntity.ok(respuesta);
    }
}
