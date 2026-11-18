package com.transsync.ms_pagos;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Transactional(readOnly = true)
    public List<Pago> listarPagos() {
        return pagoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Pago> obtenerPago(Long id) {
        return pagoRepository.findById(id);
    }

    @Transactional
    public Pago crearPago(Pago pago) {
        if (pago.getMonto() == null || pago.getMonto() <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor a 0");
        }
        if (pago.getReservaId() == null) {
            throw new IllegalArgumentException("Debe especificar la reservaId");
        }

        if (pago.getEstado() == null || pago.getEstado().isBlank()) {
            pago.setEstado("PENDIENTE");
        }
        if (pago.getFechaPago() == null) {
            pago.setFechaPago(LocalDateTime.now());
        }

        return pagoRepository.save(pago);
    }

    @Transactional
    public Pago actualizarPago(Long id, Pago datosActualizados) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado con id: " + id));

        if (datosActualizados.getReservaId() != null) pago.setReservaId(datosActualizados.getReservaId());
        if (datosActualizados.getMonto() != null) pago.setMonto(datosActualizados.getMonto());
        if (datosActualizados.getMetodoPago() != null) pago.setMetodoPago(datosActualizados.getMetodoPago());
        if (datosActualizados.getEstado() != null) pago.setEstado(datosActualizados.getEstado());
        if (datosActualizados.getFechaPago() != null) pago.setFechaPago(datosActualizados.getFechaPago());

        return pagoRepository.save(pago);
    }

    @Transactional
    public Pago rechazarPago(Long id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado con id: " + id));

        pago.setEstado("RECHAZADO");
        return pagoRepository.save(pago);
    }
}

