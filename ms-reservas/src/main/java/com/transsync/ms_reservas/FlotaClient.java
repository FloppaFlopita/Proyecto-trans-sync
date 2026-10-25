package com.transsync.ms_reservas;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.Map;

// Se conecta a ms-flota usando su nombre registrado en Eureka
@FeignClient(name = "ms-flota", url = "http://localhost:8102")
public interface FlotaClient {

    // Consulta datos completos del bus
    @GetMapping("/buses/{id}")
    ResponseEntity<Map<String, Object>> obtenerBus(@PathVariable("id") Long busId);

    // Consulta si un bus tiene asientos disponibles
    @GetMapping("/buses/{id}/disponibilidad")
    ResponseEntity<Map<String, Object>> verificarDisponibilidad(@PathVariable("id") Long busId);

    // Descuenta 1 asiento al confirmar una reserva
    @PutMapping("/buses/{id}/descontar-asiento")
    ResponseEntity<Map<String, Object>> descontarAsiento(@PathVariable("id") Long busId);

    // Libera 1 asiento al cancelar una reserva
    @PutMapping("/buses/{id}/liberar-asiento")
    ResponseEntity<Map<String, Object>> liberarAsiento(@PathVariable("id") Long busId);

    // Reinicia asientos del bus
    @PutMapping("/buses/{id}/reiniciar")
    ResponseEntity<Map<String, Object>> reiniciarBus(@PathVariable("id") Long busId);
}
