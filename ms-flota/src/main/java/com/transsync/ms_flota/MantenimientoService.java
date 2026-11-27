package com.transsync.ms_flota;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MantenimientoService {

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @Autowired
    private BusRepository busRepository;

    @Transactional(readOnly = true)
    public List<MantenimientoResponseDTO> listarTodos() {
        return mantenimientoRepository.findAll().stream()
                .map(MantenimientoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MantenimientoResponseDTO obtenerPorId(Long id) {
        Mantenimiento m = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mantenimiento no encontrado con ID: " + id));
        return MantenimientoResponseDTO.fromEntity(m);
    }

    @Transactional(readOnly = true)
    public List<MantenimientoResponseDTO> listarPorBus(Long busId) {
        return mantenimientoRepository.findByBusIdOrderByFechaProgramadaDesc(busId).stream()
                .map(MantenimientoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MantenimientoResponseDTO> listarPorEstado(EstadoMantenimiento estado) {
        return mantenimientoRepository.findByEstadoOrderByFechaProgramadaAsc(estado).stream()
                .map(MantenimientoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MantenimientoResponseDTO> listarProximos(int dias) {
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(dias);
        return mantenimientoRepository.findByFechaProgramadaBetweenOrderByFechaProgramadaAsc(hoy, limite).stream()
                .map(MantenimientoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public MantenimientoResponseDTO programarMantenimiento(MantenimientoRequestDTO dto) {
        // Bloqueo pesimista sobre el bus para serializar programación y evitar condiciones de carrera
        Bus bus = busRepository.findByIdForUpdate(dto.getBusId())
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + dto.getBusId()));

        if (dto.getFechaProgramada() == null) {
            throw new IllegalArgumentException("La fecha programada de mantenimiento es obligatoria");
        }

        // Impedir programar en fecha pasada
        if (dto.getFechaProgramada().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("No se puede programar un mantenimiento en una fecha anterior a hoy");
        }

        // Impedir solapamiento de mantenimientos activos o programados para el mismo bus
        List<Mantenimiento> activos = mantenimientoRepository.findActivosOProgramadosPorBus(bus.getId());
        if (!activos.isEmpty()) {
            throw new IllegalStateException("El bus " + bus.getPlaca() + " ya tiene un mantenimiento activo o programado (ID #" 
                    + activos.get(0).getId() + " - " + activos.get(0).getEstado() + ")");
        }

        Mantenimiento m = new Mantenimiento();
        m.setBus(bus);
        m.setTipo(dto.getTipo().toUpperCase().trim());
        m.setDescripcion(dto.getDescripcion().trim());
        m.setFechaProgramada(dto.getFechaProgramada());
        m.setCosto(dto.getCosto() != null ? dto.getCosto() : 0.0);
        m.setTaller(dto.getTaller() != null && !dto.getTaller().isBlank() ? dto.getTaller().trim() : "Taller Central TransSync");
        m.setEstado(EstadoMantenimiento.PROGRAMADO);
        m.setObservaciones(dto.getObservaciones());

        Mantenimiento guardado = mantenimientoRepository.save(m);
        return MantenimientoResponseDTO.fromEntity(guardado);
    }

    @Transactional(rollbackFor = Exception.class)
    public MantenimientoResponseDTO iniciarMantenimiento(Long id) {
        Mantenimiento m = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mantenimiento no encontrado con ID: " + id));

        // Bloqueo pesimista PESSIMISTIC_WRITE sobre el bus para coordinar con BusService.descontarAsiento
        Bus bus = busRepository.findByIdForUpdate(m.getBus().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + m.getBus().getId()));

        if (m.getEstado() != EstadoMantenimiento.PROGRAMADO) {
            throw new IllegalStateException("Transición inválida: Solo se puede iniciar un mantenimiento que esté en estado PROGRAMADO (actual: " + m.getEstado() + ")");
        }

        if (mantenimientoRepository.existsByBusIdAndEstado(bus.getId(), EstadoMantenimiento.EN_MANTENIMIENTO)) {
            throw new IllegalStateException("El bus " + bus.getPlaca() + " ya se encuentra actualmente EN_MANTENIMIENTO en taller.");
        }

        m.setEstado(EstadoMantenimiento.EN_MANTENIMIENTO);
        m.setFechaInicio(LocalDateTime.now());
        Mantenimiento guardado = mantenimientoRepository.save(m);
        return MantenimientoResponseDTO.fromEntity(guardado);
    }

    @Transactional(rollbackFor = Exception.class)
    public MantenimientoResponseDTO finalizarMantenimiento(Long id, Double costoReal, String observaciones) {
        Mantenimiento m = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mantenimiento no encontrado con ID: " + id));

        // Bloqueo pesimista sobre el bus para asegurar serialización con operaciones de asignación
        Bus bus = busRepository.findByIdForUpdate(m.getBus().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + m.getBus().getId()));

        if (m.getEstado() != EstadoMantenimiento.EN_MANTENIMIENTO) {
            throw new IllegalStateException("Transición inválida: Solo se puede finalizar un mantenimiento que esté EN_MANTENIMIENTO (actual: " + m.getEstado() + ")");
        }

        m.setEstado(EstadoMantenimiento.FINALIZADO);
        m.setFechaFin(LocalDateTime.now());
        if (costoReal != null && costoReal > 0) {
            m.setCosto(costoReal);
        }
        if (observaciones != null && !observaciones.isBlank()) {
            m.setObservaciones(observaciones.trim());
        }

        // Verificamos si existe otro mantenimiento concurrente para el mismo bus
        boolean otroActivo = mantenimientoRepository.existsByBusIdAndEstadoAndIdNot(bus.getId(), EstadoMantenimiento.EN_MANTENIMIENTO, id);
        if (otroActivo) {
            String nota = (m.getObservaciones() != null ? m.getObservaciones() + " | " : "") + 
                    "Advertencia: El bus continúa en taller debido a otra intervención concurrente activa.";
            m.setObservaciones(nota);
        }

        Mantenimiento guardado = mantenimientoRepository.save(m);
        return MantenimientoResponseDTO.fromEntity(guardado);
    }

    @Transactional
    public MantenimientoResponseDTO cancelarMantenimiento(Long id, String motivo) {
        Mantenimiento m = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mantenimiento no encontrado con ID: " + id));

        // Bloqueo pesimista para proteger transición de cancelación
        Bus bus = busRepository.findByIdForUpdate(m.getBus().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bus no encontrado con ID: " + m.getBus().getId()));

        if (m.getEstado() == EstadoMantenimiento.FINALIZADO || m.getEstado() == EstadoMantenimiento.CANCELADO) {
            throw new IllegalStateException("No se puede cancelar un mantenimiento ya " + m.getEstado());
        }

        m.setEstado(EstadoMantenimiento.CANCELADO);
        m.setFechaFin(LocalDateTime.now());
        if (motivo != null && !motivo.isBlank()) {
            String obs = m.getObservaciones() != null ? m.getObservaciones() + " | Cancelado: " + motivo : "Cancelado: " + motivo;
            m.setObservaciones(obs);
        }

        Mantenimiento guardado = mantenimientoRepository.save(m);
        return MantenimientoResponseDTO.fromEntity(guardado);
    }

    @Transactional(readOnly = true)
    public boolean busEnMantenimiento(Long busId) {
        return mantenimientoRepository.existsByBusIdAndEstado(busId, EstadoMantenimiento.EN_MANTENIMIENTO);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerResumenMantenimiento() {
        long totalProgramados = mantenimientoRepository.countByEstado(EstadoMantenimiento.PROGRAMADO);
        long totalEnMantenimiento = mantenimientoRepository.countByEstado(EstadoMantenimiento.EN_MANTENIMIENTO);
        long totalFinalizados = mantenimientoRepository.countByEstado(EstadoMantenimiento.FINALIZADO);
        long totalCancelados = mantenimientoRepository.countByEstado(EstadoMantenimiento.CANCELADO);

        Map<String, Object> resumen = new HashMap<>();
        resumen.put("programados", totalProgramados);
        resumen.put("enMantenimiento", totalEnMantenimiento);
        resumen.put("finalizados", totalFinalizados);
        resumen.put("cancelados", totalCancelados);
        resumen.put("totalIntervenciones", totalProgramados + totalEnMantenimiento + totalFinalizados + totalCancelados);
        return resumen;
    }
}
