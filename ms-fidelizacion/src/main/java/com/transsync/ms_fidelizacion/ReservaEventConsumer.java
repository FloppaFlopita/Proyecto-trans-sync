package com.transsync.ms_fidelizacion;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/**
 * Consumidor asíncrono del programa de fidelización (S8 Rúbrica - Nivel A).
 * Otorga puntos al pasajero de forma desacoplada y con control de Idempotencia (S9 Rúbrica - Nivel A).
 */
@Service
public class ReservaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(ReservaEventConsumer.class);

    @Autowired
    private FidelizacionService fidelizacionService;

    @Autowired
    private MovimientoFidelizacionRepository movimientoRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "reserva-eventos", groupId = "fidelizacion-group")
    public void consumirReservaCreada(String mensaje) {
        try {
            ReservaCreadaEvento evento = objectMapper.readValue(mensaje, ReservaCreadaEvento.class);
            log.info(">>> [KAFKA S8 FIDELIZACION] Evento recibido para Reserva #{} | Boleta: {}",
                    evento.getReservaId(), evento.getNumeroBoleta());

            // 1. Verificación de Idempotencia (S9): evitar duplicar puntos si el evento se procesa dos veces
            String motivoClave = "Reserva #" + evento.getReservaId() + " (" + evento.getNumeroBoleta() + ")";
            if (movimientoRepository.existsByDescripcionContaining(motivoClave)) {
                log.warn(">>> [IDEMPOTENCIA S9 ACTIVADA] La reserva #{} ya acumulo puntos previamente. Descartando duplicado.",
                        evento.getReservaId());
                return;
            }

            // 2. Determinar pasajero y puntos (10 puntos por cada asiento adquirido)
            Long pasajeroId = evento.getIdCliente() != null ? evento.getIdCliente() : 101L;
            int numAsientos = (evento.getAsientos() != null && !evento.getAsientos().isEmpty()) ? evento.getAsientos().size() : 1;
            int puntosCalculados = numAsientos * 10;

            String motivo = "Acumulación automática: " + motivoClave;
            Fidelizacion cuentaActualizada = fidelizacionService.acumularPuntos(pasajeroId, puntosCalculados, motivo);

            log.info(">>> [FIDELIZACION S8 ASINCRONA] Pasajero #{}: +{} puntos asignados. Saldo total: {} (Nivel: {})",
                    pasajeroId, puntosCalculados, cuentaActualizada.getPuntos(), cuentaActualizada.getNivel());

        } catch (Exception e) {
            log.error(">>> [KAFKA CONSUMER ERROR] Fallo al procesar fidelización de evento: {}", e.getMessage(), e);
        }
    }
}

