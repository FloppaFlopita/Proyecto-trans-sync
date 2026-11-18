package com.transsync.ms_reservas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByBusId(Long busId);
    List<Reserva> findByBusIdAndEstado(Long busId, String estado);
    Long countByBusIdAndEstado(Long busId, String estado);

    // Búsqueda de asientos ocupados para un bus y fecha
    List<Reserva> findByBusIdAndFechaViajeAndEstadoIn(Long busId, LocalDate fechaViaje, List<String> estados);
    List<Reserva> findByBusIdAndFechaViajeAndEstado(Long busId, LocalDate fechaViaje, String estado);
    void deleteByBusIdAndFechaViajeAndAsientoNumeroInAndEstado(Long busId, LocalDate fechaViaje, List<Integer> asientos, String estado);

    // Verificar si un asiento específico ya está reservado en esa fecha
    List<Reserva> findByBusIdAndFechaViajeAndAsientoNumeroAndEstadoIn(Long busId, LocalDate fechaViaje, Integer asientoNumero, List<String> estados);

    // Historial por pasajero
    List<Reserva> findByDniPasajeroOrderByFechaViajeDesc(String dniPasajero);
    List<Reserva> findByEmailPasajeroOrderByFechaViajeDesc(String emailPasajero);

    // Historial global de ventas para Admin
    List<Reserva> findByEstadoOrderByFechaViajeDesc(String estado);
    List<Reserva> findByEstadoInOrderByFechaViajeDesc(List<String> estados);
}
