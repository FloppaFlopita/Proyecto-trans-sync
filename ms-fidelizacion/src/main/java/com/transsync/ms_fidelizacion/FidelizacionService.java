package com.transsync.ms_fidelizacion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class FidelizacionService {

    @Autowired
    private FidelizacionRepository fidelizacionRepository;

    @Autowired
    private MovimientoFidelizacionRepository movimientoRepository;

    @Transactional(readOnly = true)
    public List<Fidelizacion> listarTodas() {
        return fidelizacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Fidelizacion obtenerPorPasajero(Long pasajeroId) {
        return fidelizacionRepository.findByPasajeroId(pasajeroId)
                .orElseGet(() -> {
                    // Si no existe, se crea una cuenta inicial en BRONCE con 0 puntos
                    Fidelizacion nueva = new Fidelizacion(pasajeroId, 0, "BRONCE", LocalDate.now());
                    return fidelizacionRepository.save(nueva);
                });
    }

    @Transactional(readOnly = true)
    public List<MovimientoFidelizacion> obtenerHistorial(Long pasajeroId) {
        return movimientoRepository.findByPasajeroIdOrderByFechaDesc(pasajeroId);
    }

    @Transactional
    public Fidelizacion acumularPuntos(Long pasajeroId, Integer puntos, String motivo) {
        if (puntos == null || puntos <= 0) {
            throw new IllegalArgumentException("Los puntos a acumular deben ser mayores a 0");
        }

        Fidelizacion cuenta = obtenerPorPasajero(pasajeroId);
        cuenta.setPuntos(cuenta.getPuntos() + puntos);
        cuenta.setNivel(determinarNivel(cuenta.getPuntos()));
        cuenta.setFechaUltimaActualizacion(LocalDate.now());

        fidelizacionRepository.save(cuenta);

        MovimientoFidelizacion movimiento = new MovimientoFidelizacion(
                pasajeroId, puntos, "ACUMULACION", motivo != null ? motivo : "Acumulación de puntos por viaje"
        );
        movimientoRepository.save(movimiento);

        return cuenta;
    }

    @Transactional
    public Fidelizacion canjearPuntos(Long pasajeroId, Integer puntos, String motivo) {
        if (puntos == null || puntos <= 0) {
            throw new IllegalArgumentException("Los puntos a canjear deben ser mayores a 0");
        }

        Fidelizacion cuenta = fidelizacionRepository.findByPasajeroId(pasajeroId)
                .orElseThrow(() -> new IllegalStateException("El pasajero no cuenta con programa de fidelización"));

        if (cuenta.getPuntos() < puntos) {
            throw new IllegalStateException("Puntos insuficientes. Saldo actual: " + cuenta.getPuntos() + " puntos");
        }

        cuenta.setPuntos(cuenta.getPuntos() - puntos);
        cuenta.setNivel(determinarNivel(cuenta.getPuntos()));
        cuenta.setFechaUltimaActualizacion(LocalDate.now());

        fidelizacionRepository.save(cuenta);

        MovimientoFidelizacion movimiento = new MovimientoFidelizacion(
                pasajeroId, -puntos, "CANJE", motivo != null ? motivo : "Canje de puntos por descuento o pasaje"
        );
        movimientoRepository.save(movimiento);

        return cuenta;
    }

    private String determinarNivel(Integer puntos) {
        if (puntos >= 1000) {
            return "ORO";
        } else if (puntos >= 500) {
            return "PLATA";
        } else {
            return "BRONCE";
        }
    }
}

