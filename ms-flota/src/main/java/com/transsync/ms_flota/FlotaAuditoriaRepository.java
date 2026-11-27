package com.transsync.ms_flota;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlotaAuditoriaRepository extends JpaRepository<FlotaAuditoria, Long> {
    List<FlotaAuditoria> findAllByOrderByFechaOperacionDesc();
}
