package com.transsync.ms_reservas;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;

@SpringBootApplication
@EnableFeignClients
public class MsReservasApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsReservasApplication.class, args);
    }

    // Datos de prueba: inserta reservas asignadas al Bus 1 para que el conductor tenga manifiesto
    @Bean
    CommandLineRunner initData(ReservaRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Reserva r1 = new Reserva();
                r1.setNombrePasajero("Carlos Mendoza");
                r1.setDniPasajero("12345678");
                r1.setRutaId(1L);
                r1.setBusId(1L);
                r1.setAsientoNumero(1);
                r1.setFechaViaje(LocalDate.now().plusDays(1));
                r1.setEstado("CONFIRMADA");
                repository.save(r1);

                Reserva r2 = new Reserva();
                r2.setNombrePasajero("Ana Torres");
                r2.setDniPasajero("87654321");
                r2.setRutaId(1L);
                r2.setBusId(1L);
                r2.setAsientoNumero(2);
                r2.setFechaViaje(LocalDate.now().plusDays(1));
                r2.setEstado("CONFIRMADA");
                repository.save(r2);

                Reserva r3 = new Reserva();
                r3.setNombrePasajero("Luis Quispe");
                r3.setDniPasajero("11223344");
                r3.setRutaId(1L);
                r3.setBusId(1L);
                r3.setAsientoNumero(3);
                r3.setFechaViaje(LocalDate.now().plusDays(1));
                r3.setEstado("PENDIENTE");
                repository.save(r3);

                System.out.println(">>> ms-reservas: 3 reservas de prueba insertadas para el Bus 1 (Manifiesto de Conductor listo).");
            }
        };
    }
}
