package com.transsync.ms_rutas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RutaAuditoriaRepository extends JpaRepository<RutaAuditoria, Long> {

    List<RutaAuditoria> findAllByOrderByFechaOperacionDesc();

    List<RutaAuditoria> findByRutaIdOrderByFechaOperacionDesc(Long rutaId);
}
