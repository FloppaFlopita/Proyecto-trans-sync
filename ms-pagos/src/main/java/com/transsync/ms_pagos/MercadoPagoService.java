package com.transsync.ms_pagos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MercadoPagoService {

    @Value("${mercadopago.access-token}")
    private String accessToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> crearPreferencia(Map<String, Object> datos) {
        String url = "https://api.mercadopago.com/checkout/preferences";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // Detalle del producto / pasaje
        Map<String, Object> item = new HashMap<>();
        String titulo = (String) datos.getOrDefault("rutaNombre", "Pasaje TransSync");
        Double precio = Double.valueOf(datos.getOrDefault("montoTotal", 50.0).toString());

        item.put("title", "TransSync: " + titulo);
        item.put("quantity", 1);
        item.put("unit_price", precio);
        item.put("currency_id", "PEN");

        List<Map<String, Object>> items = Collections.singletonList(item);

        // Payer
        Map<String, Object> payer = new HashMap<>();
        payer.put("name", datos.getOrDefault("nombreComprador", "Pasajero TransSync"));
        payer.put("email", datos.getOrDefault("emailComprador", "cliente@transsync.com"));

        // Back URLs para retorno a Angular
        Map<String, Object> backUrls = new HashMap<>();
        String frontendUrl = (String) datos.getOrDefault("frontendUrl", "http://localhost:4200/reservas");
        backUrls.put("success", frontendUrl + "?mp_status=approved");
        backUrls.put("failure", frontendUrl + "?mp_status=failure");
        backUrls.put("pending", frontendUrl + "?mp_status=pending");

        Map<String, Object> body = new HashMap<>();
        body.put("items", items);
        body.put("payer", payer);
        body.put("back_urls", backUrls);
        body.put("auto_return", "approved");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        return response.getBody();
    }
}
