package com.transsync.ms_flota;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @Autowired
    private FlotaAuditoriaRepository flotaAuditoriaRepository;

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @Transactional(readOnly = true)
    public List<Bus> listarBuses() {
        return busRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<FlotaAuditoria> listarHistorial() {
        return flotaAuditoriaRepository.findAllByOrderByFechaOperacionDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Bus> obtenerBus(Long id) {
        return busRepository.findById(id);
    }

    private void registrarAuditoria(Long busId, String placa, String tipoOperacion,
                                    Integer antes, Integer despues, String detalles) {
        if (flotaAuditoriaRepository != null) {
            flotaAuditoriaRepository.save(new FlotaAuditoria(busId, placa, tipoOperacion, antes, despues, detalles));
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public Bus registrarBus(Bus bus) {
        if (bus.getPlaca() == null || bus.getPlaca().isBlank()) {
            throw new IllegalArgumentException("La placa es obligatoria");
        }
        if (bus.getPlaca().trim().length() < 6) {
            throw new IllegalArgumentException("La placa debe contener al menos 6 caracteres (ej. ABC-123)");
        }
        if (bus.getCapacidad() == null || bus.getCapacidad() <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor a 0");
        }
        if (bus.getCapacidad() < 10 || bus.getCapacidad() > 80) {
            throw new IllegalArgumentException("La capacidad del autobús debe estar comprendida entre 10 y 80 asientos");
        }
        if (busRepository.existsByPlaca(bus.getPlaca().toUpperCase().trim())) {
            throw new IllegalStateException("Ya existe un bus con la placa: " + bus.getPlaca());
        }

        bus.setPlaca(bus.getPlaca().toUpperCase().trim());
        if (bus.getAsientosDisponibles() == null) {
            bus.setAsientosDisponibles(bus.getCapacidad());
        } else if (bus.getAsientosDisponibles() < 0 || bus.getAsientosDisponibles() > bus.getCapacidad()) {
            throw new IllegalArgumentException("Los asientos disponibles deben estar entre 0 y la capacidad máxima (" + bus.getCapacidad() + ")");
        }

        Bus guardado = busRepository.save(bus);
        registrarAuditoria(guardado.getId(), guardado.getPlaca(), "REGISTRO_BUS",
                0, guardado.getAsientosDisponibles(),
                "Unidad registrada: " + guardado.getModelo() + " (" + guardado.getCapacidad() + " asientos)");
        return guardado;
    }

    @Transactional(rollbackFor = Exception.class)
    public Bus descontarAsiento(Long id) {
        // Bloqueo pesimista: SELECT ... FOR UPDATE a nivel de fila en base de datos
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        // Regla de Negocio: Si el bus está en mantenimiento preventivo o correctivo activo, rechazar inmediatamente
        if (mantenimientoRepository != null && mantenimientoRepository.existsByBusIdAndEstado(id, EstadoMantenimiento.EN_MANTENIMIENTO)) {
            throw new IllegalStateException("El bus " + bus.getPlaca() + " se encuentra EN MANTENIMIENTO y no puede admitir pasajeros.");
        }

        if (bus.getAsientosDisponibles() == null || bus.getAsientosDisponibles() <= 0) {
            throw new IllegalStateException("No hay asientos disponibles para descontar en el bus: " + bus.getPlaca());
        }

        int antes = bus.getAsientosDisponibles();
        bus.setAsientosDisponibles(antes - 1);
        Bus guardado = busRepository.save(bus);
        registrarAuditoria(guardado.getId(), guardado.getPlaca(), "VENTA_ASIENTO",
                antes, guardado.getAsientosDisponibles(),
                "Descuento transaccional de 1 asiento por venta/reserva");
        return guardado;
    }

    @Transactional(rollbackFor = Exception.class)
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
        Bus guardado = busRepository.save(bus);
        registrarAuditoria(guardado.getId(), guardado.getPlaca(), "LIBERACION_ASIENTO",
                disponibles, guardado.getAsientosDisponibles(),
                "Liberación transaccional de 1 asiento");
        return guardado;
    }

    @Transactional(rollbackFor = Exception.class)
    public Bus reiniciarBus(Long id) {
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        int antes = bus.getAsientosDisponibles() != null ? bus.getAsientosDisponibles() : 0;
        bus.setAsientosDisponibles(bus.getCapacidad());
        Bus guardado = busRepository.save(bus);
        registrarAuditoria(guardado.getId(), guardado.getPlaca(), "REINICIO_CAPACIDAD",
                antes, guardado.getAsientosDisponibles(),
                "Capacidad restablecida al 100% (" + guardado.getCapacidad() + " asientos)");
        return guardado;
    }

    @Transactional(rollbackFor = Exception.class)
    public Bus actualizarBus(Long id, Bus datosActualizados) {
        // Bloqueo pesimista SELECT ... FOR UPDATE para evitar condiciones de carrera con ventas simultáneas
        Bus bus = busRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + id));

        int antes = bus.getAsientosDisponibles() != null ? bus.getAsientosDisponibles() : 0;

        if (datosActualizados.getPlaca() != null && !datosActualizados.getPlaca().isBlank()) {
            String nuevaPlaca = datosActualizados.getPlaca().toUpperCase().trim();
            if (!nuevaPlaca.equals(bus.getPlaca()) && busRepository.existsByPlaca(nuevaPlaca)) {
                throw new IllegalStateException("Ya existe un bus con la placa: " + nuevaPlaca);
            }
            bus.setPlaca(nuevaPlaca);
        }

        if (datosActualizados.getModelo() != null && !datosActualizados.getModelo().isBlank()) {
            bus.setModelo(datosActualizados.getModelo().trim());
        }

        if (datosActualizados.getCapacidad() != null) {
            if (datosActualizados.getCapacidad() < 10 || datosActualizados.getCapacidad() > 80) {
                throw new IllegalArgumentException("La capacidad del autobús debe estar entre 10 y 80 asientos");
            }
            int ocupados = (bus.getCapacidad() != null && bus.getAsientosDisponibles() != null)
                    ? Math.max(0, bus.getCapacidad() - bus.getAsientosDisponibles()) : 0;
            if (datosActualizados.getCapacidad() < ocupados) {
                throw new IllegalStateException("No se puede reducir la capacidad a " + datosActualizados.getCapacidad()
                        + " porque ya existen " + ocupados + " asientos ocupados.");
            }
            if (datosActualizados.getAsientosDisponibles() == null) {
                bus.setAsientosDisponibles(datosActualizados.getCapacidad() - ocupados);
            }
            bus.setCapacidad(datosActualizados.getCapacidad());
        }

        if (datosActualizados.getAsientosDisponibles() != null) {
            if (datosActualizados.getAsientosDisponibles() < 0) {
                throw new IllegalArgumentException("Los asientos disponibles no pueden ser negativos");
            }
            if (datosActualizados.getAsientosDisponibles() > bus.getCapacidad()) {
                throw new IllegalArgumentException("Los asientos disponibles no pueden exceder la capacidad del bus (" + bus.getCapacidad() + ")");
            }
            bus.setAsientosDisponibles(datosActualizados.getAsientosDisponibles());
        }

        Bus guardado = busRepository.save(bus);
        registrarAuditoria(guardado.getId(), guardado.getPlaca(), "ACTUALIZACION_BUS",
                antes, guardado.getAsientosDisponibles(),
                "Datos actualizados: " + guardado.getModelo() + " (" + guardado.getCapacidad() + " ast.)");
        return guardado;
    }

    private void validarBusSinRutasAsignadas(Long busId, String placa) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject("http://localhost:8101/rutas", Map.class);
            if (resp != null && resp.get("datos") instanceof List<?> rutas) {
                for (Object item : rutas) {
                    if (item instanceof Map<?, ?> r && r.get("busId") != null) {
                        long assignedBusId = Long.parseLong(String.valueOf(r.get("busId")));
                        if (assignedBusId == busId) {
                            throw new IllegalStateException("No se puede eliminar el autobús " + placa
                                    + " porque está asignado a la ruta " + r.get("origen") + " -> " + r.get("destino")
                                    + " (" + r.get("horario") + ").");
                        }
                    }
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception ignored) {
            // Si ms-rutas no responde, no bloqueamos el borrado local
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean eliminarBus(Long id) {
        Optional<Bus> opcional = busRepository.findByIdForUpdate(id);
        if (opcional.isPresent()) {
            Bus bus = opcional.get();
            validarBusSinRutasAsignadas(id, bus.getPlaca());
            if (mantenimientoRepository != null) {
                if (mantenimientoRepository.existsByBusIdAndEstadoIn(id, List.of(EstadoMantenimiento.EN_MANTENIMIENTO, EstadoMantenimiento.PROGRAMADO))) {
                    throw new IllegalStateException("No se puede eliminar un autobús que tiene mantenimiento activo o programado");
                }
                // Limpiar historial de mantenimientos finalizados/cancelados dentro de la misma transacción ACID
                mantenimientoRepository.deleteByBusId(id);
            }
            busRepository.delete(bus);
            registrarAuditoria(bus.getId(), bus.getPlaca(), "ELIMINACION_BUS",
                    bus.getAsientosDisponibles(), 0,
                    "Unidad dada de baja: " + bus.getModelo());
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstadisticasFlota() {
        List<Bus> lista = busRepository.findAll();
        int totalBuses = lista.size();
        int capacidadTotal = lista.stream().mapToInt(b -> b.getCapacidad() != null ? b.getCapacidad() : 0).sum();
        int asientosLibres = lista.stream().mapToInt(b -> b.getAsientosDisponibles() != null ? b.getAsientosDisponibles() : 0).sum();
        int asientosOcupados = Math.max(0, capacidadTotal - asientosLibres);

        double porcentajeOcupacion = capacidadTotal > 0 ? Math.round(((double) asientosOcupados / capacidadTotal) * 1000.0) / 10.0 : 0.0;

        long enMantenimiento = mantenimientoRepository != null ? mantenimientoRepository.countByEstado(EstadoMantenimiento.EN_MANTENIMIENTO) : 0;
        long programadosMantenimiento = mantenimientoRepository != null ? mantenimientoRepository.countByEstado(EstadoMantenimiento.PROGRAMADO) : 0;

        long busesLlenos = lista.stream().filter(b -> b.getAsientosDisponibles() != null && b.getAsientosDisponibles() <= 0).count();
        long busesDisponibles = lista.stream().filter(b -> b.getAsientosDisponibles() != null && b.getAsientosDisponibles() > 0).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBuses", totalBuses);
        stats.put("capacidadTotal", capacidadTotal);
        stats.put("asientosLibres", asientosLibres);
        stats.put("asientosOcupados", asientosOcupados);
        stats.put("porcentajeOcupacion", porcentajeOcupacion);
        stats.put("busesEnMantenimiento", enMantenimiento);
        stats.put("mantenimientosProgramados", programadosMantenimiento);
        stats.put("busesOperativos", totalBuses - enMantenimiento);
        stats.put("busesLlenos", busesLlenos);
        stats.put("busesDisponibles", busesDisponibles);
        return stats;
    }
}
