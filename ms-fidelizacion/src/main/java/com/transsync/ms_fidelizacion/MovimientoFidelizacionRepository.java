package com.transsync.ms_fidelizacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovimientoFidelizacionRepository extends JpaRepository<MovimientoFidelizacion, Long> {
    List<MovimientoFidelizacion> findByPasajeroIdOrderByFechaDesc(Long pasajeroId);
}

