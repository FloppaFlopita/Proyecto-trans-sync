package com.transsync.ms_auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class MsAuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsAuthApplication.class, args);
    }

    @Bean
    CommandLineRunner initSecurityData(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (rolRepository.count() == 0) {
                Rol rolAdmin = rolRepository.save(new Rol("ADMIN"));
                Rol rolConductor = rolRepository.save(new Rol("CONDUCTOR"));
                Rol rolCliente = rolRepository.save(new Rol("CLIENTE"));

                // 1. Usuario Administrador
                Usuario admin = new Usuario();
                admin.setEmail("admin@transsync.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setNombreCompleto("Administrador General");
                admin.setHabilitado(true);
                admin.setRoles(new HashSet<>(Collections.singletonList(rolAdmin)));
                usuarioRepository.save(admin);

                // 2. Usuario Conductor (Personal Autorizado)
                Usuario conductor = new Usuario();
                conductor.setEmail("conductor@transsync.com");
                conductor.setPassword(passwordEncoder.encode("chofer123"));
                conductor.setNombreCompleto("Mario Quispe Choque (Conductor)");
                conductor.setHabilitado(true);
                conductor.setIdConductor(1L); // Asignado al Bus 1
                conductor.setRoles(new HashSet<>(Collections.singletonList(rolConductor)));
                usuarioRepository.save(conductor);

                // 3. Usuario Pasajero / Cliente
                Usuario cliente = new Usuario();
                cliente.setEmail("cliente@transsync.com");
                cliente.setPassword(passwordEncoder.encode("cliente123"));
                cliente.setNombreCompleto("Carlos Mendoza Flores (Cliente)");
                cliente.setHabilitado(true);
                cliente.setIdCliente(101L);
                cliente.setRoles(new HashSet<>(Collections.singletonList(rolCliente)));
                usuarioRepository.save(cliente);

                System.out.println(">>> ms-auth: Roles y Usuarios Semilla creados exitosamente:");
                System.out.println(">>>   ADMIN:     admin@transsync.com / admin123");
                System.out.println(">>>   CONDUCTOR: conductor@transsync.com / chofer123 (idConductor: 1)");
                System.out.println(">>>   CLIENTE:   cliente@transsync.com / cliente123 (idCliente: 101)");
            }
        };
    }
}
