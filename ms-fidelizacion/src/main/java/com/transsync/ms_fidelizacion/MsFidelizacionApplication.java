package com.transsync.ms_fidelizacion;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.time.LocalDate;

@SpringBootApplication
public class MsFidelizacionApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsFidelizacionApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(FidelizacionRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new Fidelizacion(101L, 1500, "ORO", LocalDate.now()));
                repository.save(new Fidelizacion(102L, 300, "BRONCE", LocalDate.now()));
                System.out.println("--- Datos semilla de Fidelizacion insertados ---");
            }
        };
    }
}
