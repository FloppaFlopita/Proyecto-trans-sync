package com.transsync.ms_pagos;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class MsPagosApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsPagosApplication.class, args);
    }

    // Datos de prueba: solo inserta si la tabla está vacía
    @Bean
    CommandLineRunner initData(PagoRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Pago p1 = new Pago();
                p1.setReservaId(1L);
                p1.setMonto(45.50);
                p1.setMetodoPago("YAPE");
                p1.setEstado("COMPLETADO");
                p1.setFechaPago(LocalDateTime.now().minusDays(1));
                repository.save(p1);

                Pago p2 = new Pago();
                p2.setReservaId(2L);
                p2.setMonto(38.00);
                p2.setMetodoPago("TARJETA");
                p2.setEstado("PENDIENTE");
                p2.setFechaPago(LocalDateTime.now());
                repository.save(p2);

                Pago p3 = new Pago();
                p3.setReservaId(3L);
                p3.setMonto(52.00);
                p3.setMetodoPago("EFECTIVO");
                p3.setEstado("PENDIENTE");
                p3.setFechaPago(LocalDateTime.now());
                repository.save(p3);

                System.out.println(">>> ms-pagos: 3 pagos de prueba insertados.");
            }
        };
    }
}
