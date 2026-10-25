package com.transsync.ms_reservas;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "ms-fidelizacion", url = "http://localhost:8106")
public interface FidelizacionClient {

    @PostMapping("/api/fidelizacion/acumular")
    ResponseEntity<Map<String, Object>> acumularPuntos(@RequestBody Map<String, Object> body);
}

