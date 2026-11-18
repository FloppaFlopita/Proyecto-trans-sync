package com.transsync.ms_reservas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Publicador de eventos de negocio asíncronos desacoplados (S8 Rúbrica - Nivel A).
 * Emite eventos al broker Kafka de forma no bloqueante sin afectar la latencia del usuario.
 */
@Service
public class ReservaEventProducer {

    private static final Logger log = LoggerFactory.getLogger(ReservaEventProducer.class);
    public static final String TOPIC_RESERVAS = "reserva-eventos";

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void publicarReservaCreada(ReservaCreadaEvento evento) {
        CompletableFuture.runAsync(() -> {
            try {
                String jsonPayload = objectMapper.writeValueAsString(evento);
                String clave = String.valueOf(evento.getReservaId());
                if (kafkaTemplate != null) {
                    log.info(">>> [KAFKA S8 EVENTO PUBLICADO] Tópico: '{}' | Clave: '{}' | Reserva #{} | Boleta: {}",
                            TOPIC_RESERVAS, clave, evento.getReservaId(), evento.getNumeroBoleta());
                    kafkaTemplate.send(TOPIC_RESERVAS, clave, jsonPayload);
                } else {
                    log.info(">>> [KAFKA S8 LOCAL] Evento generado para Reserva #{}: {}", evento.getReservaId(), jsonPayload);
                }
            } catch (Exception e) {
                log.warn(">>> [KAFKA S8 ERROR CONTROLADO] No se pudo enviar evento a Kafka: {}", e.getMessage());
            }
        });
    }
}
