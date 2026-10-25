package com.transsync.ms_facturacion;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class MsFacturacionApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsFacturacionApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(ComprobanteRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Comprobante c1 = new Comprobante();
                c1.setSerie("B001");
                c1.setNumero(1L);
                c1.setTipo("BOLETA");
                c1.setReservaId(1L);
                c1.setPagoId(1L);
                c1.setClienteDocumento("12345678");
                c1.setClienteNombre("Carlos Mendoza");
                c1.setSubtotal(38.56);
                c1.setIgv(6.94);
                c1.setTotal(45.50);
                c1.setEstado("EMITIDO");
                c1.setFechaEmision(LocalDateTime.now().minusDays(1));
                repository.save(c1);

                System.out.println(">>> ms-facturacion: Comprobante semilla B001-00000001 emitido.");
            }
        };
    }
}

