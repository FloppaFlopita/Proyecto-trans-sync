package com.transsync.ms_flota;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {

    boolean existsByPlaca(String placa);

    /**
     * Obtiene el bus aplicando un bloqueo pesimista de escritura (PESSIMISTIC_WRITE).
     * En PostgreSQL genera 'SELECT ... FOR UPDATE', bloqueando la fila a nivel de base de datos
     * para transacciones concurrentes hasta que la transacción actual finalice (commit o rollback).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bus b WHERE b.id = :id")
    Optional<Bus> findByIdForUpdate(@Param("id") Long id);
}

