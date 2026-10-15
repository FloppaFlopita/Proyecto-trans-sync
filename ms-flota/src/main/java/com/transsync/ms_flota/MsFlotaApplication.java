package com.transsync.ms_flota;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MsFlotaApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsFlotaApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(BusRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Bus b1 = new Bus();
                b1.setPlaca("ABC-123");
                b1.setModelo("Scania Marcopolo");
                b1.setCapacidad(50);
                b1.setAsientosDisponibles(50);
                repository.save(b1);

                Bus b2 = new Bus();
                b2.setPlaca("XYZ-987");
                b2.setModelo("Volvo Irizar");
                b2.setCapacidad(40);
                b2.setAsientosDisponibles(40);
                repository.save(b2);

                Bus b3 = new Bus();
                b3.setPlaca("PQR-456");
                b3.setModelo("Mercedes Benz OF-1721");
                b3.setCapacidad(45);
                b3.setAsientosDisponibles(45);
                repository.save(b3);

                System.out.println(">>> ms-flota: 3 buses de prueba insertados con asientos disponibles.");
            }
        };
    }
}
