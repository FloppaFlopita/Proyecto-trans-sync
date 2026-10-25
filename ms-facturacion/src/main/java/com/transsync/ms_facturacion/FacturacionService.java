package com.transsync.ms_facturacion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FacturacionService {

    @Autowired
    private ComprobanteRepository comprobanteRepository;

    @Transactional(readOnly = true)
    public List<Comprobante> listarTodos() {
        return comprobanteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Comprobante> obtenerPorId(Long id) {
        return comprobanteRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Comprobante> obtenerPorReserva(Long reservaId) {
        return comprobanteRepository.findByReservaId(reservaId);
    }

    @Transactional(readOnly = true)
    public List<Comprobante> obtenerPorCliente(String documento) {
        return comprobanteRepository.findByClienteDocumento(documento);
    }

    @Transactional
    public synchronized Comprobante emitirComprobante(EmitirComprobanteRequest request) {
        // Validar si ya se emitió un comprobante para esta reserva
        Optional<Comprobante> existente = comprobanteRepository.findByReservaId(request.getReservaId());
        if (existente.isPresent() && "EMITIDO".equals(existente.get().getEstado())) {
            throw new IllegalStateException("Ya existe un comprobante emitido para la reserva ID: " + request.getReservaId());
        }

        String serie = "FACTURA".equalsIgnoreCase(request.getTipo()) ? "F001" : "B001";
        Long proximoNumero = comprobanteRepository.findMaxNumeroBySerie(serie) + 1;

        // Cálculos de IGV (18%)
        BigDecimal totalBd = BigDecimal.valueOf(request.getTotal()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal divisor = BigDecimal.valueOf(1.18);
        BigDecimal subtotalBd = totalBd.divide(divisor, 2, RoundingMode.HALF_UP);
        BigDecimal igvBd = totalBd.subtract(subtotalBd);

        Comprobante comprobante = new Comprobante();
        comprobante.setSerie(serie);
        comprobante.setNumero(proximoNumero);
        comprobante.setTipo(serie.startsWith("F") ? "FACTURA" : "BOLETA");
        comprobante.setReservaId(request.getReservaId());
        comprobante.setPagoId(request.getPagoId());
        comprobante.setClienteDocumento(request.getClienteDocumento());
        comprobante.setClienteNombre(request.getClienteNombre());
        comprobante.setSubtotal(subtotalBd.doubleValue());
        comprobante.setIgv(igvBd.doubleValue());
        comprobante.setTotal(totalBd.doubleValue());
        comprobante.setEstado("EMITIDO");
        comprobante.setFechaEmision(LocalDateTime.now());

        return comprobanteRepository.save(comprobante);
    }

    @Transactional
    public Comprobante anularComprobante(Long id, String motivo) {
        Comprobante comprobante = comprobanteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado con ID: " + id));

        if ("ANULADO".equals(comprobante.getEstado())) {
            throw new IllegalStateException("El comprobante ya se encuentra anulado");
        }

        comprobante.setEstado("ANULADO");
        comprobante.setMotivoAnulacion(motivo != null ? motivo : "Anulación por cancelación de viaje");
        comprobante.setFechaAnulacion(LocalDateTime.now());

        return comprobanteRepository.save(comprobante);
    }
}

