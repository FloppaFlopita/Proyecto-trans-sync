package com.transsync.msrutas.repository;

import com.transsync.msrutas.entity.Ruta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RutaRepository extends JpaRepository<Ruta, Long> {
    // Spring Boot genera automáticamente los métodos findAll, save, findById, etc.
}
