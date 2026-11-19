package com.transsync.ms_flota;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    @Transactional(readOnly = true)
    public List<Bus> listarBuses() {
        return busRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Bus> obtenerBus(Long id) {
        return busRepository.findById(id);
    }

    @Transactional
    public Bus registrarBus(Bus bus) {
        if (bus.getPlaca() == null || bus.getPlaca().isBlank()) {
            throw new IllegalArgumentException("La placa es obligatoria");
        }
        if (bus.getCapacidad() == null || bus.getCapacidad() <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor a 0");
        }
        if (busRepository.existsByPlaca(bus.getPlaca().toUpperCase())) {
            throw new IllegalStateException("Ya existe un bus con la placa: " + bus.getPlaca());
        }

        bus.setPlaca(bus.getPlaca().toUpperCase());
        if (bus.getAsientosDisponibles() == null) {
            bus.setAsientosDisponibles(bus.getCapacidad());
        }

        return busRepository.save(bus);
    }

    @Transactional
    public Bus descontarAsiento(Long id) {
        // Bloqueo pesimista: SELECT ... FOR UPDATE a nivel de fila en base de datos
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        if (bus.getAsientosDisponibles() == null || bus.getAsientosDisponibles() <= 0) {
            throw new IllegalStateException("No hay asientos disponibles para descontar en el bus: " + bus.getPlaca());
        }

        bus.setAsientosDisponibles(bus.getAsientosDisponibles() - 1);
        return busRepository.save(bus);
    }

    @Transactional
    public Bus liberarAsiento(Long id) {
        // Bloqueo pesimista: garantiza lectura exclusiva para validar capacidad sin sobrepasar el límite
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        int capacidad = (bus.getCapacidad() != null) ? bus.getCapacidad() : 0;
        int disponibles = (bus.getAsientosDisponibles() != null) ? bus.getAsientosDisponibles() : 0;

        if (disponibles >= capacidad) {
            throw new IllegalStateException("No se puede liberar asiento: el bus " + bus.getPlaca() + 
                    " ya tiene la capacidad máxima completa (" + capacidad + ")");
        }

        bus.setAsientosDisponibles(disponibles + 1);
        return busRepository.save(bus);
    }

    @Transactional
    public Bus reiniciarBus(Long id) {
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        bus.setAsientosDisponibles(bus.getCapacidad());
        return busRepository.save(bus);
    }

    @Transactional
    public Bus actualizarBus(Long id, Bus datosActualizados) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        if (datosActualizados.getPlaca() != null && !datosActualizados.getPlaca().isBlank()) {
            String nuevaPlaca = datosActualizados.getPlaca().toUpperCase();
            if (!nuevaPlaca.equals(bus.getPlaca()) && busRepository.existsByPlaca(nuevaPlaca)) {
                throw new IllegalStateException("Ya existe un bus con la placa: " + nuevaPlaca);
            }
            bus.setPlaca(nuevaPlaca);
        }

        if (datosActualizados.getModelo() != null) bus.setModelo(datosActualizados.getModelo());
        if (datosActualizados.getCapacidad() != null && datosActualizados.getCapacidad() > 0)
            bus.setCapacidad(datosActualizados.getCapacidad());
        if (datosActualizados.getAsientosDisponibles() != null)
            bus.setAsientosDisponibles(datosActualizados.getAsientosDisponibles());

        return busRepository.save(bus);
    }

    @Transactional
    public boolean eliminarBus(Long id) {
        if (busRepository.existsById(id)) {
            busRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

