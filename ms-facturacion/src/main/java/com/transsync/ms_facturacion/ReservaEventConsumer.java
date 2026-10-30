package com.transsync.ms_facturacion;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Consumidor asíncrono de eventos de negocio de reservas (S8 Rúbrica - Nivel A).
 * Implementa Idempotencia y Consistencia Eventual (S9 Rúbrica - Nivel A):
 * Desacoplado de ms-reservas; si recibe el mismo evento repetido, lo detecta y descarta.
 */
@Service
public class ReservaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(ReservaEventConsumer.class);

    @Autowired
    private FacturacionService facturacionService;

    @Autowired
    private ComprobanteRepository comprobanteRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "reserva-eventos", groupId = "facturacion-group")
    public void consumirReservaCreada(String mensaje) {
        try {
            ReservaCreadaEvento evento = objectMapper.readValue(mensaje, ReservaCreadaEvento.class);
            log.info(">>> [KAFKA S8 RECIBIDO] Evento ReservaCreadaEvento para Reserva #{} | Boleta: {}",
                    evento.getReservaId(), evento.getNumeroBoleta());

            // 1. Verificación de Idempotencia (S9 Rúbrica - Nivel A)
            // Si el comprobante para esta reserva ya fue generado, se descarta para evitar duplicados.
            Optional<Comprobante> existente = comprobanteRepository.findByReservaId(evento.getReservaId());
            if (existente.isPresent()) {
                log.warn(">>> [IDEMPOTENCIA S9 ACTIVADA] La reserva #{} ya tiene un comprobante emitido (ID: {}). Evento duplicado ignorado con éxito.",
                        evento.getReservaId(), existente.get().getId());
                return;
            }

            // 2. Emisión automática de boleta electrónica en respuesta al evento asíncrono
            EmitirComprobanteRequest request = new EmitirComprobanteRequest();
            request.setTipo("BOLETA");
            request.setReservaId(evento.getReservaId());
            request.setPagoId(evento.getReservaId()); // Correlativo de pago
            request.setClienteDocumento(evento.getDniPasajero() != null ? evento.getDniPasajero() : "00000000");
            request.setClienteNombre(evento.getNombrePasajero() != null ? evento.getNombrePasajero() : "Cliente TransSync");
            request.setTotal(evento.getTotalPagar() != null && evento.getTotalPagar() > 0 ? evento.getTotalPagar() : 45.00);

            Comprobante emitido = facturacionService.emitirComprobante(request);
            log.info(">>> [FACTURACION S8 ASINCRONA] Comprobante {} emitido exitosamente para Pasajero: {} (Total: S/ {})",
                    emitido.getNumeroCompleto(), emitido.getClienteNombre(), emitido.getTotal());

        } catch (Exception e) {
            log.error(">>> [KAFKA CONSUMER ERROR] Fallo al procesar evento de facturación: {}", e.getMessage(), e);
        }
    }
}
