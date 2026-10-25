package com.transsync.ms_facturacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    @Query("SELECT COALESCE(MAX(c.numero), 0) FROM Comprobante c WHERE c.serie = :serie")
    Long findMaxNumeroBySerie(@Param("serie") String serie);

    Optional<Comprobante> findByReservaId(Long reservaId);

    List<Comprobante> findByClienteDocumento(String clienteDocumento);

    Optional<Comprobante> findBySerieAndNumero(String serie, Long numero);
}

