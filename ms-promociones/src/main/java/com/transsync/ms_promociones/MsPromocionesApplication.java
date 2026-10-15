package com.transsync.ms_promociones;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.time.LocalDate;

@SpringBootApplication
public class MsPromocionesApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsPromocionesApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(PromocionRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new Promocion("Verano Transync", "15% de descuento en rutas del sur", 15.0, LocalDate.now(), LocalDate.now().plusMonths(1), true));
                repository.save(new Promocion("Finde Largo", "10% de descuento comprando ida y vuelta", 10.0, LocalDate.now(), LocalDate.now().plusDays(5), true));
                System.out.println("--- Datos semilla de Promociones insertados ---");
            }
        };
    }
}
