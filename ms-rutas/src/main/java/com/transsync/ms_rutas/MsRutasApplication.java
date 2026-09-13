package com.transsync.ms_rutas;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MsRutasApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsRutasApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(RutaRepository repository) {
        return args -> {
            repository.deleteAll(); // Limpia registros anteriores para actualizar la estructura

            Ruta r1 = new Ruta();
            r1.setOrigen("Arequipa");
            r1.setDestino("Lima");
            r1.setHorario("20:30 hrs");
            r1.setPrecio(90.00);
            repository.save(r1);

            Ruta r2 = new Ruta();
            r2.setOrigen("Cusco");
            r2.setDestino("Puno");
            r2.setHorario("08:00 hrs");
            r2.setPrecio(45.00);
            repository.save(r2);
        };
    }
}
