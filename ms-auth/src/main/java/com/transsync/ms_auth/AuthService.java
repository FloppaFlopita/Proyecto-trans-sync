package com.transsync.ms_auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail();
        if (email == null || email.isBlank() || request.getPassword() == null) {
            throw new IllegalArgumentException("Debe ingresar email y contraseña");
        }

        Usuario usuario = usuarioRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales incorrectas: usuario no encontrado"));

        if (!usuario.isHabilitado()) {
            throw new IllegalStateException("La cuenta de usuario se encuentra deshabilitada");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Credenciales incorrectas: contraseña inválida");
        }

        String token = jwtService.generarToken(usuario);
        List<String> roles = usuario.getRoles().stream()
                .map(Rol::getNombre)
                .sorted()
                .toList();

        return new LoginResponse(
                token,
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                roles,
                usuario.getIdCliente(),
                usuario.getIdConductor()
        );
    }

    @Transactional
    public Usuario registrar(RegisterRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("El email y la contraseña son obligatorios");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalStateException("Ya existe un usuario registrado con el email: " + email);
        }

        String rolNombre = request.getRol() != null ? request.getRol().toUpperCase() : "CLIENTE";
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseGet(() -> rolRepository.save(new Rol(rolNombre)));

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setNombreCompleto(request.getNombreCompleto() != null ? request.getNombreCompleto() : email);
        usuario.setHabilitado(true);
        usuario.setRoles(new HashSet<>(Collections.singletonList(rol)));

        if ("CLIENTE".equals(rolNombre)) {
            usuario.setIdCliente(System.currentTimeMillis() % 10000);
        } else if ("CONDUCTOR".equals(rolNombre)) {
            usuario.setIdConductor(System.currentTimeMillis() % 1000);
        }

        return usuarioRepository.save(usuario);
    }
}

