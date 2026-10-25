package com.transsync.ms_fidelizacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FidelizacionRepository extends JpaRepository<Fidelizacion, Long> {
    Optional<Fidelizacion> findByPasajeroId(Long pasajeroId);
}
