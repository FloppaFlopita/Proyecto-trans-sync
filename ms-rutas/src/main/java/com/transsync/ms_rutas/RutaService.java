package com.transsync.ms_rutas;

import com.transsync.ms_rutas.dto.RutaEstadisticasDTO;
import com.transsync.ms_rutas.dto.RutaRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class RutaService {

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private RutaAuditoriaRepository rutaAuditoriaRepository;

    @Transactional(readOnly = true)
    public List<Ruta> listarTodas() {
        return rutaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Ruta obtenerPorId(Long id) {
        return rutaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Ruta no encontrada con ID: " + id));
    }

    @Transactional
    public Ruta crearRuta(RutaRequestDTO dto) {
        validarReglasDeNegocio(dto.getOrigen(), dto.getDestino(), dto.getPrecio(), dto.getHorario());

        // Regla: Detección de duplicados para el mismo trayecto y horario
        boolean existeDuplicada = rutaRepository.existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCase(
                dto.getOrigen().trim(),
                dto.getDestino().trim(),
                dto.getHorario().trim()
        );
        if (existeDuplicada) {
            throw new IllegalStateException("Conflicto: Ya existe una ruta programada para el trayecto "
                    + dto.getOrigen().trim() + " -> " + dto.getDestino().trim()
                    + " en el horario " + dto.getHorario().trim());
        }

        Ruta ruta = new Ruta();
        ruta.setOrigen(dto.getOrigen().trim());
        ruta.setDestino(dto.getDestino().trim());
        ruta.setHorario(dto.getHorario().trim());
        ruta.setPrecio(dto.getPrecio());

        Ruta rutaGuardada = rutaRepository.save(ruta);

        // Auditoría transaccional dentro del mismo límite ACID
        RutaAuditoria auditoria = new RutaAuditoria(
                rutaGuardada.getId(),
                "CREACION",
                rutaGuardada.getOrigen(),
                rutaGuardada.getDestino(),
                rutaGuardada.getHorario(),
                rutaGuardada.getPrecio(),
                null,
                "Ruta creada inicialmente: " + rutaGuardada.getOrigen() + " -> " + rutaGuardada.getDestino() + " a S/." + rutaGuardada.getPrecio()
        );
        rutaAuditoriaRepository.save(auditoria);

        return rutaGuardada;
    }

    @Transactional
    public Ruta actualizarRuta(Long id, RutaRequestDTO dto) {
        Ruta rutaExistente = obtenerPorId(id);

        String detallesAnteriores = "Origen: " + rutaExistente.getOrigen() + ", Destino: " + rutaExistente.getDestino() 
                + ", Horario: " + rutaExistente.getHorario() + ", Precio: S/." + rutaExistente.getPrecio();

        String nuevoOrigen = dto.getOrigen() != null ? dto.getOrigen().trim() : rutaExistente.getOrigen();
        String nuevoDestino = dto.getDestino() != null ? dto.getDestino().trim() : rutaExistente.getDestino();
        String nuevoHorario = dto.getHorario() != null ? dto.getHorario().trim() : rutaExistente.getHorario();
        Double nuevoPrecio = dto.getPrecio() != null ? dto.getPrecio() : rutaExistente.getPrecio();

        validarReglasDeNegocio(nuevoOrigen, nuevoDestino, nuevoPrecio, nuevoHorario);

        boolean conflictoDuplicado = rutaRepository.existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCaseAndIdNot(
                nuevoOrigen, nuevoDestino, nuevoHorario, id
        );
        if (conflictoDuplicado) {
            throw new IllegalStateException("Conflicto: Ya existe otra ruta con el trayecto "
                    + nuevoOrigen + " -> " + nuevoDestino + " en el horario " + nuevoHorario);
        }

        rutaExistente.setOrigen(nuevoOrigen);
        rutaExistente.setDestino(nuevoDestino);
        rutaExistente.setHorario(nuevoHorario);
        rutaExistente.setPrecio(nuevoPrecio);

        Ruta rutaActualizada = rutaRepository.save(rutaExistente);

        String detallesNuevos = "Origen: " + rutaActualizada.getOrigen() + ", Destino: " + rutaActualizada.getDestino() 
                + ", Horario: " + rutaActualizada.getHorario() + ", Precio: S/." + rutaActualizada.getPrecio();

        // Auditoría transaccional dentro del mismo límite ACID
        RutaAuditoria auditoria = new RutaAuditoria(
                rutaActualizada.getId(),
                "MODIFICACION",
                rutaActualizada.getOrigen(),
                rutaActualizada.getDestino(),
                rutaActualizada.getHorario(),
                rutaActualizada.getPrecio(),
                detallesAnteriores,
                detallesNuevos
        );
        rutaAuditoriaRepository.save(auditoria);

        return rutaActualizada;
    }

    @Transactional
    public void eliminarRuta(Long id) {
        Ruta ruta = obtenerPorId(id);
        String detallesAnteriores = "Origen: " + ruta.getOrigen() + ", Destino: " + ruta.getDestino() 
                + ", Horario: " + ruta.getHorario() + ", Precio: S/." + ruta.getPrecio();

        rutaRepository.delete(ruta);

        // Auditoría transaccional dentro del mismo límite ACID
        RutaAuditoria auditoria = new RutaAuditoria(
                ruta.getId(),
                "ELIMINACION",
                ruta.getOrigen(),
                ruta.getDestino(),
                ruta.getHorario(),
                ruta.getPrecio(),
                detallesAnteriores,
                "Ruta dada de baja en el sistema."
        );
        rutaAuditoriaRepository.save(auditoria);
    }

    @Transactional(readOnly = true)
    public List<RutaAuditoria> listarHistorial() {
        return rutaAuditoriaRepository.findAllByOrderByFechaOperacionDesc();
    }

    @Transactional(readOnly = true)
    public List<Ruta> buscarRutas(String origen, String destino, Double maxPrecio) {
        return rutaRepository.buscarRutasAvanzado(
                origen != null ? origen.trim() : null,
                destino != null ? destino.trim() : null,
                maxPrecio
        );
    }

    @Transactional(readOnly = true)
    public RutaEstadisticasDTO obtenerEstadisticas() {
        long totalRutas = rutaRepository.count();
        if (totalRutas == 0) {
            return new RutaEstadisticasDTO(0, 0, 0, 0.0, 0.0, 0.0, Collections.emptyList(), Collections.emptyMap());
        }

        Long totalOrigenes = rutaRepository.countDistinctOrigenes();
        Long totalDestinos = rutaRepository.countDistinctDestinos();
        Double avgPrecio = rutaRepository.findAveragePrecio();
        Double minPrecio = rutaRepository.findMinPrecio();
        Double maxPrecio = rutaRepository.findMaxPrecio();

        double avgRedondeado = avgPrecio != null
                ? BigDecimal.valueOf(avgPrecio).setScale(2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        List<Object[]> rawDestinos = rutaRepository.findDestinosMasFrecuentes();
        List<Map<String, Object>> destinosPopulares = new ArrayList<>();
        if (rawDestinos != null) {
            for (Object[] row : rawDestinos) {
                if (row != null && row.length >= 2) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("destino", row[0]);
                    map.put("frecuencia", row[1]);
                    destinosPopulares.add(map);
                }
            }
        }

        // Distribución de turnos según horario
        Map<String, Long> turnos = new LinkedHashMap<>();
        turnos.put("Mañana", 0L);
        turnos.put("Tarde", 0L);
        turnos.put("Noche", 0L);

        List<Ruta> todas = rutaRepository.findAll();
        for (Ruta r : todas) {
            String h = r.getHorario() != null ? r.getHorario().toLowerCase() : "";
            if (h.contains("06:") || h.contains("07:") || h.contains("08:") || h.contains("09:") || h.contains("10:") || h.contains("11:") || h.contains("am")) {
                turnos.put("Mañana", turnos.get("Mañana") + 1);
            } else if (h.contains("12:") || h.contains("13:") || h.contains("14:") || h.contains("15:") || h.contains("16:") || h.contains("17:")) {
                turnos.put("Tarde", turnos.get("Tarde") + 1);
            } else {
                turnos.put("Noche", turnos.get("Noche") + 1);
            }
        }

        return new RutaEstadisticasDTO(
                totalRutas,
                totalOrigenes != null ? totalOrigenes : 0,
                totalDestinos != null ? totalDestinos : 0,
                avgRedondeado,
                minPrecio != null ? minPrecio : 0.0,
                maxPrecio != null ? maxPrecio : 0.0,
                destinosPopulares,
                turnos
        );
    }

    private void validarReglasDeNegocio(String origen, String destino, Double precio, String horario) {
        if (origen == null || origen.trim().isEmpty()) {
            throw new IllegalArgumentException("La ciudad de origen es obligatoria.");
        }
        if (destino == null || destino.trim().isEmpty()) {
            throw new IllegalArgumentException("La ciudad de destino es obligatoria.");
        }
        // Regla: Origen y destino no pueden ser idénticos
        if (origen.trim().equalsIgnoreCase(destino.trim())) {
            throw new IllegalArgumentException("Regla de negocio infringida: La ciudad de origen ("
                    + origen.trim() + ") no puede ser idéntica a la ciudad de destino.");
        }
        // Regla: Tarifa estrictamente mayor a 0
        if (precio == null || precio <= 0) {
            throw new IllegalArgumentException("Regla de negocio: La tarifa de pasaje debe ser mayor a S/. 0.00. Valor recibido: " + precio);
        }
        if (horario == null || horario.trim().isEmpty()) {
            throw new IllegalArgumentException("El horario de salida es obligatorio.");
        }
    }
}
