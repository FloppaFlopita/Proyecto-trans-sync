package com.transsync.ms_rutas;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RutaRepository extends JpaRepository<Ruta, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Ruta r WHERE r.id = :id")
    Optional<Ruta> findByIdForUpdate(@Param("id") Long id);

    boolean existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCase(String origen, String destino, String horario);

    boolean existsByOrigenIgnoreCaseAndDestinoIgnoreCaseAndHorarioIgnoreCaseAndIdNot(String origen, String destino, String horario, Long id);

    boolean existsByBusIdAndHorarioIgnoreCase(Long busId, String horario);

    boolean existsByBusIdAndHorarioIgnoreCaseAndIdNot(Long busId, String horario, Long id);

    @Query("SELECT r FROM Ruta r WHERE " +
           "(:origen IS NULL OR :origen = '' OR LOWER(r.origen) LIKE LOWER(CONCAT('%', :origen, '%'))) AND " +
           "(:destino IS NULL OR :destino = '' OR LOWER(r.destino) LIKE LOWER(CONCAT('%', :destino, '%'))) AND " +
           "(:maxPrecio IS NULL OR r.precio <= :maxPrecio)")
    List<Ruta> buscarRutasAvanzado(
            @Param("origen") String origen,
            @Param("destino") String destino,
            @Param("maxPrecio") Double maxPrecio
    );

    @Query("SELECT COUNT(DISTINCT LOWER(r.origen)) FROM Ruta r")
    Long countDistinctOrigenes();

    @Query("SELECT COUNT(DISTINCT LOWER(r.destino)) FROM Ruta r")
    Long countDistinctDestinos();

    @Query("SELECT AVG(r.precio) FROM Ruta r")
    Double findAveragePrecio();

    @Query("SELECT MIN(r.precio) FROM Ruta r")
    Double findMinPrecio();

    @Query("SELECT MAX(r.precio) FROM Ruta r")
    Double findMaxPrecio();

    @Query("SELECT r.destino, COUNT(r) FROM Ruta r GROUP BY r.destino ORDER BY COUNT(r) DESC")
    List<Object[]> findDestinosMasFrecuentes();
}
