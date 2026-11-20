package com.transsync.ms_flota;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Long> {

    List<Mantenimiento> findByBusIdOrderByFechaProgramadaDesc(Long busId);

    List<Mantenimiento> findByEstadoOrderByFechaProgramadaAsc(EstadoMantenimiento estado);

    boolean existsByBusIdAndEstado(Long busId, EstadoMantenimiento estado);

    boolean existsByBusIdAndEstadoAndIdNot(Long busId, EstadoMantenimiento estado, Long id);

    boolean existsByBusIdAndEstadoIn(Long busId, List<EstadoMantenimiento> estados);

    List<Mantenimiento> findByFechaProgramadaBetweenOrderByFechaProgramadaAsc(LocalDate desde, LocalDate hasta);

    long countByEstado(EstadoMantenimiento estado);

    @Query("SELECT m FROM Mantenimiento m WHERE m.bus.id = :busId AND m.estado IN ('PROGRAMADO', 'EN_MANTENIMIENTO')")
    List<Mantenimiento> findActivosOProgramadosPorBus(@Param("busId") Long busId);
}
