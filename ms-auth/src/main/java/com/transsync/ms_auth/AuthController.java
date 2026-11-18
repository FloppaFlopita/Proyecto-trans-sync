package com.transsync.ms_auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            LoginResponse response = authService.login(request);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Login exitoso");
            respuesta.put("datos", response);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(401).body(respuesta);
        } catch (IllegalStateException e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", e.getMessage());
            return ResponseEntity.status(403).body(respuesta);
        } catch (Exception e) {
            respuesta.put("exito", false);
            respuesta.put("mensaje", "Error interno en autenticación: " + e.getMessage());
            return ResponseEntity.internalServerError().body(respuesta);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        Map<String, Object> respuesta = new HashMap<>();
        try {
            Usuario usuario = authService.registrar(request);
            respuesta.put("exito", true);
            respuesta.put("mensaje", "Usuario registrado exitosamente");
            respuesta.put("datos", Map.of(
                "id", usuario.getId(),
                "email", usuario.getEmail(),
                "nombreCompleto", usuario.getNombreCompleto()
            ));
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
            respuesta.put("mensaje", "Error interno en registro: " + e.getMessage());
            return ResponseEntity.internalServerError().body(respuesta);
        }
    }

    @GetMapping("/validar")
    public ResponseEntity<Map<String, Object>> validarToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> respuesta = new HashMap<>();
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            respuesta.put("valido", false);
            respuesta.put("mensaje", "Header Authorization ausente o inválido");
            return ResponseEntity.status(401).body(respuesta);
        }

        String token = authHeader.substring(7);
        boolean valido = jwtService.validarToken(token);
        if (valido) {
            respuesta.put("valido", true);
            respuesta.put("claims", jwtService.extraerClaims(token));
            return ResponseEntity.ok(respuesta);
        } else {
            respuesta.put("valido", false);
            respuesta.put("mensaje", "Token expirado o firma inválida");
            return ResponseEntity.status(401).body(respuesta);
        }
    }
}
