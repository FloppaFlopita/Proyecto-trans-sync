package com.transsync.ms_reservas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private FlotaClient flotaClient;

    @Autowired(required = false)
    private FidelizacionClient fidelizacionClient;

    @Transactional(readOnly = true)
    public List<Reserva> listarReservas() {
        return reservaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Reserva> obtenerReserva(Long id) {
        return reservaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarPorBus(Long busId) {
        return reservaRepository.findByBusId(busId);
    }

    /**
     * Devuelve la lista de números de asientos ocupados/bloqueados para un bus y fecha.
     */
    @Transactional(readOnly = true)
    public List<Integer> obtenerAsientosOcupados(Long busId, LocalDate fechaViaje) {
        LocalDate fecha = (fechaViaje != null) ? fechaViaje : LocalDate.now();
        List<Reserva> activas = reservaRepository.findByBusIdAndFechaViajeAndEstadoIn(
                busId, fecha, List.of("CONFIRMADA", "PENDIENTE")
        );
        return activas.stream()
                .map(Reserva::getAsientoNumero)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Manifiesto para el Conductor:
     * Devuelve información del bus, cuántos asientos están reservados/comprados,
     * cuántos libres y la lista detallada de pasajeros asignados con sus asientos y contacto.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerManifiestoConductor(Long busId) {
        Map<String, Object> manifiesto = new HashMap<>();

        // 1. Obtener información del bus desde ms-flota
        String placa = "BUS-TS-01";
        String modelo = "MERCEDES SCANIA 2025";
        int capacidadTotal = 50;
        int asientosDisponibles = 50;

        try {
            ResponseEntity<Map<String, Object>> respuestaFlota = flotaClient.obtenerBus(busId);
            if (respuestaFlota != null && respuestaFlota.getBody() != null && Boolean.TRUE.equals(respuestaFlota.getBody().get("exito"))) {
                Map<String, Object> datosBus = (Map<String, Object>) respuestaFlota.getBody().get("datos");
                if (datosBus != null) {
                    placa = String.valueOf(datosBus.get("placa"));
                    modelo = String.valueOf(datosBus.get("modelo"));
                    capacidadTotal = Integer.parseInt(String.valueOf(datosBus.get("capacidad")));
                    asientosDisponibles = Integer.parseInt(String.valueOf(datosBus.get("asientosDisponibles")));
                }
            }
        } catch (Exception e) {
            System.err.println(">>> Advertencia al consultar ms-flota para manifiesto: " + e.getMessage());
        }

        // 2. Obtener lista de reservas activas para este bus
        List<Reserva> confirmadas = reservaRepository.findByBusIdAndEstado(busId, "CONFIRMADA");
        List<Reserva> pendientes = reservaRepository.findByBusIdAndEstado(busId, "PENDIENTE");

        int asientosOcupados = confirmadas.size() + pendientes.size();

        // 3. Mapear pasajeros para la vista del conductor
        List<Map<String, Object>> listaPasajeros = new ArrayList<>();
        int asientoAuto = 1;
        for (Reserva r : confirmadas) {
            Map<String, Object> pas = new HashMap<>();
            pas.put("reservaId", r.getId());
            pas.put("asiento", r.getAsientoNumero() != null ? r.getAsientoNumero() : asientoAuto++);
            pas.put("nombrePasajero", r.getNombrePasajero());
            pas.put("dniPasajero", r.getDniPasajero());
            pas.put("telefonoPasajero", r.getTelefonoPasajero() != null ? r.getTelefonoPasajero() : "No registrado");
            pas.put("emailPasajero", r.getEmailPasajero() != null ? r.getEmailPasajero() : "Sin correo");
            pas.put("estadoBoleto", "CONFIRMADO/PAGADO");
            pas.put("metodoPago", r.getMetodoPago() != null ? r.getMetodoPago() : "TARJETA");
            pas.put("rutaNombre", r.getRutaNombre() != null ? r.getRutaNombre() : "Lima - Arequipa");
            pas.put("numeroBoleta", r.getNumeroBoleta() != null ? r.getNumeroBoleta() : "B001-" + r.getId());
            pas.put("fechaViaje", r.getFechaViaje());
            listaPasajeros.add(pas);
        }
        for (Reserva r : pendientes) {
            Map<String, Object> pas = new HashMap<>();
            pas.put("reservaId", r.getId());
            pas.put("asiento", r.getAsientoNumero() != null ? r.getAsientoNumero() : asientoAuto++);
            pas.put("nombrePasajero", r.getNombrePasajero());
            pas.put("dniPasajero", r.getDniPasajero());
            pas.put("telefonoPasajero", r.getTelefonoPasajero() != null ? r.getTelefonoPasajero() : "No registrado");
            pas.put("emailPasajero", r.getEmailPasajero() != null ? r.getEmailPasajero() : "Sin correo");
            pas.put("estadoBoleto", "PENDIENTE_PAGO");
            pas.put("fechaViaje", r.getFechaViaje());
            listaPasajeros.add(pas);
        }

        // Ordenar pasajeros por número de asiento
        listaPasajeros.sort(Comparator.comparingInt(p -> (Integer) p.get("asiento")));

        // 4. Armar el resumen del conductor
        manifiesto.put("busId", busId);
        manifiesto.put("placa", placa);
        manifiesto.put("modelo", modelo);
        manifiesto.put("capacidadTotal", capacidadTotal);
        manifiesto.put("asientosOcupados", asientosOcupados);
        manifiesto.put("asientosDisponibles", Math.max(0, capacidadTotal - asientosOcupados));
        manifiesto.put("totalPasajeros", listaPasajeros.size());
        manifiesto.put("pasajeros", listaPasajeros);

        return manifiesto;
    }

    /**
     * Reserva múltiple de asientos:
     * - Permite elegir 1 o más asientos (ej: [12, 13]).
     * - Valida que ninguno esté previamente reservado/bloqueado.
     * - Descuenta cupos en ms-flota.
     * - Si el cliente tiene cuenta o email, acumula puntos de fidelización automáticamente.
     */
    @Transactional
    public Map<String, Object> crearReservasMultiples(ReservaMultiRequest req) {
        if (req.getNombrePasajero() == null || req.getNombrePasajero().isBlank()) {
            throw new IllegalArgumentException("El nombre del pasajero es obligatorio");
        }
        if (req.getDniPasajero() == null || req.getDniPasajero().isBlank()) {
            throw new IllegalArgumentException("El DNI del pasajero es obligatorio");
        }
        if (req.getTelefonoPasajero() == null || req.getTelefonoPasajero().isBlank()) {
            throw new IllegalArgumentException("El número de teléfono es obligatorio");
        }
        if (req.getBusId() == null) {
            throw new IllegalArgumentException("El ID del bus es obligatorio");
        }
        if (req.getAsientos() == null || req.getAsientos().isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos 1 asiento");
        }

        LocalDate fecha = (req.getFechaViaje() != null) ? req.getFechaViaje() : LocalDate.now();
        double precioUnitario = (req.getPrecioUnitario() != null && req.getPrecioUnitario() > 0) ? req.getPrecioUnitario() : 45.00;

        // 1. Validar si alguno de los asientos ya está ocupado para esa fecha
        List<Integer> yaOcupados = obtenerAsientosOcupados(req.getBusId(), fecha);
        for (Integer asiento : req.getAsientos()) {
            if (yaOcupados.contains(asiento)) {
                throw new IllegalStateException("El asiento número " + asiento + " ya se encuentra reservado/bloqueado para la fecha " + fecha);
            }
        }

        // 2. Verificar disponibilidad global en ms-flota
        try {
            ResponseEntity<Map<String, Object>> respFlota = flotaClient.verificarDisponibilidad(req.getBusId());
            if (respFlota.getBody() != null && Boolean.TRUE.equals(respFlota.getBody().get("exito"))) {
                Map<String, Object> datos = (Map<String, Object>) respFlota.getBody().get("datos");
                int disponibles = Integer.parseInt(String.valueOf(datos.get("asientosDisponibles")));
                if (disponibles < req.getAsientos().size()) {
                    throw new IllegalStateException("No hay suficientes asientos disponibles en el bus (Solicitados: " + req.getAsientos().size() + ", Disponibles: " + disponibles + ")");
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            System.err.println(">>> Advertencia al verificar disponibilidad en ms-flota: " + e.getMessage());
        }

        // 3. Crear las reservas individuales para cada asiento seleccionado
        List<Reserva> creadas = new ArrayList<>();
        int asientosDescontados = 0;

        try {
            for (Integer asiento : req.getAsientos()) {
                Reserva r = new Reserva();
                r.setNombrePasajero(req.getNombrePasajero());
                r.setDniPasajero(req.getDniPasajero());
                r.setTelefonoPasajero(req.getTelefonoPasajero());
                r.setEmailPasajero(req.getEmailPasajero());
                r.setRutaId(req.getRutaId() != null ? req.getRutaId() : 1L);
                r.setRutaNombre(req.getRutaNombre() != null ? req.getRutaNombre() : "Lima - Arequipa");
                r.setBusId(req.getBusId());
                r.setAsientoNumero(asiento);
                r.setFechaViaje(fecha);
                r.setPrecio(precioUnitario);
                r.setMetodoPago(req.getMetodoPago() != null ? req.getMetodoPago() : "TARJETA");
                r.setFechaHoraVenta(java.time.LocalDateTime.now());
                long numSecuencia = reservaRepository.count() + 1;
                r.setNumeroBoleta(String.format("B001-%06d", numSecuencia));
                r.setEstado("CONFIRMADA");

                // Descontar en ms-flota
                flotaClient.descontarAsiento(req.getBusId());
                asientosDescontados++;

                Reserva guardada = reservaRepository.save(r);
                creadas.add(guardada);
            }
        } catch (Exception e) {
            // Compensación: revertir los asientos descontados
            for (int i = 0; i < asientosDescontados; i++) {
                try {
                    flotaClient.liberarAsiento(req.getBusId());
                } catch (Exception ex) {
                    System.err.println(">>> Error en compensación de asiento: " + ex.getMessage());
                }
            }
            throw new RuntimeException("Error al procesar reserva múltiple: " + e.getMessage(), e);
        }

        // 4. Fidelización automática: si el usuario tiene cuenta o email, otorgar puntos
        int puntosGanados = 0;
        if (fidelizacionClient != null && (req.getIdCliente() != null || (req.getEmailPasajero() != null && !req.getEmailPasajero().isBlank()))) {
            try {
                Long pasajeroId = req.getIdCliente() != null ? req.getIdCliente() : 101L;
                int puntos = req.getAsientos().size() * 10; // 10 puntos por cada asiento comprado
                Map<String, Object> fidelReq = new HashMap<>();
                fidelReq.put("pasajeroId", pasajeroId);
                fidelReq.put("puntos", puntos);
                fidelReq.put("motivo", "Compra de " + req.getAsientos().size() + " asiento(s) - TransSync");
                fidelizacionClient.acumularPuntos(fidelReq);
                puntosGanados = puntos;
            } catch (Exception e) {
                System.err.println(">>> Advertencia: no se pudo acumular puntos en ms-fidelizacion: " + e.getMessage());
            }
        }

        double totalPagar = req.getAsientos().size() * precioUnitario;

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("reservas", creadas);
        resultado.put("cantidadBoletos", creadas.size());
        resultado.put("asientosReservados", req.getAsientos());
        resultado.put("precioUnitario", precioUnitario);
        resultado.put("totalPagar", totalPagar);
        resultado.put("puntosFidelizacionGanados", puntosGanados);
        resultado.put("estado", "CONFIRMADA");

        return resultado;
    }

    @Transactional
    public Reserva crearReserva(Reserva reserva) {
        if (reserva.getBusId() == null) {
            throw new IllegalArgumentException("Debe especificar el busId para la reserva");
        }

        // Validar si el asiento específico ya está ocupado
        LocalDate fecha = (reserva.getFechaViaje() != null) ? reserva.getFechaViaje() : LocalDate.now();
        if (reserva.getAsientoNumero() != null) {
            List<Integer> ocupados = obtenerAsientosOcupados(reserva.getBusId(), fecha);
            if (ocupados.contains(reserva.getAsientoNumero())) {
                throw new IllegalStateException("El asiento número " + reserva.getAsientoNumero() + " ya está reservado/ocupado.");
            }
        }

        // Paso 1: Consultar disponibilidad en ms-flota
        try {
            ResponseEntity<Map<String, Object>> respuestaFlota = flotaClient.verificarDisponibilidad(reserva.getBusId());
            if (respuestaFlota.getBody() != null && Boolean.TRUE.equals(respuestaFlota.getBody().get("exito"))) {
                Map<String, Object> datosFlota = (Map<String, Object>) respuestaFlota.getBody().get("datos");
                boolean disponible = datosFlota != null && Boolean.TRUE.equals(datosFlota.get("disponible"));
                if (!disponible) {
                    throw new IllegalStateException("No hay asientos disponibles en el bus con ID: " + reserva.getBusId());
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            System.err.println(">>> Advertencia ms-flota: " + e.getMessage());
        }

        // Paso 2: Descontar 1 asiento en ms-flota
        try {
            flotaClient.descontarAsiento(reserva.getBusId());
        } catch (Exception e) {
            throw new RuntimeException("Error al descontar asiento en ms-flota: " + e.getMessage(), e);
        }

        // Paso 3: Asignar número de asiento automático si no vino especificado
        if (reserva.getAsientoNumero() == null) {
            List<Integer> ocupados = obtenerAsientosOcupados(reserva.getBusId(), fecha);
            int proximo = 1;
            while (ocupados.contains(proximo)) {
                proximo++;
            }
            reserva.setAsientoNumero(proximo);
        }

        if (reserva.getPrecio() == null) {
            reserva.setPrecio(45.00);
        }
        reserva.setFechaViaje(fecha);

        // Paso 4: Guardar reserva localmente con compensación si falla
        try {
            reserva.setEstado("CONFIRMADA");
            return reservaRepository.save(reserva);
        } catch (Exception e) {
            try {
                flotaClient.liberarAsiento(reserva.getBusId());
            } catch (Exception ex) {
                System.err.println(">>> ERROR CRITICO DE COMPENSACION: " + ex.getMessage());
            }
            throw new RuntimeException("Fallo al persistir la reserva: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Reserva cancelarReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada con ID: " + id));

        if ("CANCELADA".equals(reserva.getEstado())) {
            throw new IllegalStateException("La reserva ya se encuentra cancelada");
        }

        if ("CONFIRMADA".equals(reserva.getEstado()) && reserva.getBusId() != null) {
            try {
                flotaClient.liberarAsiento(reserva.getBusId());
            } catch (Exception e) {
                System.err.println(">>> Advertencia: no se pudo liberar asiento en ms-flota: " + e.getMessage());
            }
        }

        reserva.setEstado("CANCELADA");
        return reservaRepository.save(reserva);
    }

    @Transactional
    public Reserva actualizarReserva(Long id, Reserva datosActualizados) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada con ID: " + id));

        if (datosActualizados.getNombrePasajero() != null) reserva.setNombrePasajero(datosActualizados.getNombrePasajero());
        if (datosActualizados.getDniPasajero() != null) reserva.setDniPasajero(datosActualizados.getDniPasajero());
        if (datosActualizados.getTelefonoPasajero() != null) reserva.setTelefonoPasajero(datosActualizados.getTelefonoPasajero());
        if (datosActualizados.getEmailPasajero() != null) reserva.setEmailPasajero(datosActualizados.getEmailPasajero());
        if (datosActualizados.getRutaId() != null) reserva.setRutaId(datosActualizados.getRutaId());
        if (datosActualizados.getBusId() != null) reserva.setBusId(datosActualizados.getBusId());
        if (datosActualizados.getAsientoNumero() != null) reserva.setAsientoNumero(datosActualizados.getAsientoNumero());
        if (datosActualizados.getFechaViaje() != null) reserva.setFechaViaje(datosActualizados.getFechaViaje());
        if (datosActualizados.getPrecio() != null) reserva.setPrecio(datosActualizados.getPrecio());
        if (datosActualizados.getEstado() != null) reserva.setEstado(datosActualizados.getEstado());

        return reservaRepository.save(reserva);
    }

    // Reiniciar todas las reservas de un bus para demostración en vivo
    @Transactional
    public void reiniciarReservasBus(Long busId) {
        List<Reserva> reservas = reservaRepository.findByBusId(busId);
        reservaRepository.deleteAll(reservas);
        try {
            flotaClient.reiniciarBus(busId);
        } catch (Exception e) {
            System.err.println(">>> Advertencia al reiniciar bus en ms-flota: " + e.getMessage());
        }
    }

    // Historial por DNI de pasajero
    @Transactional(readOnly = true)
    public List<Reserva> obtenerHistorialPorDni(String dni) {
        return reservaRepository.findByDniPasajeroOrderByFechaViajeDesc(dni);
    }

    // Historial por Email de pasajero
    @Transactional(readOnly = true)
    public List<Reserva> obtenerHistorialPorEmail(String email) {
        return reservaRepository.findByEmailPasajeroOrderByFechaViajeDesc(email);
    }

    // Historial global de ventas para Administrador con cálculo de IGV y filtro por fecha
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerResumenVentas(LocalDate fechaFiltro) {
        List<Reserva> ventasConfirmadas = reservaRepository.findByEstadoOrderByFechaViajeDesc("CONFIRMADA");
        if (fechaFiltro != null) {
            ventasConfirmadas = ventasConfirmadas.stream()
                    .filter(r -> fechaFiltro.equals(r.getFechaViaje()))
                    .collect(Collectors.toList());
        }

        double totalRecaudado = ventasConfirmadas.stream()
                .mapToDouble(r -> r.getPrecio() != null ? r.getPrecio() : 45.00)
                .sum();
        double subtotalGravado = totalRecaudado / 1.18;
        double igvTotal = totalRecaudado - subtotalGravado;

        Map<String, Object> resumen = new HashMap<>();
        resumen.put("totalBoletosVendidos", ventasConfirmadas.size());
        resumen.put("totalRecaudado", Math.round(totalRecaudado * 100.0) / 100.0);
        resumen.put("subtotalGravado", Math.round(subtotalGravado * 100.0) / 100.0);
        resumen.put("igvTotal", Math.round(igvTotal * 100.0) / 100.0);
        resumen.put("fechaFiltro", fechaFiltro != null ? fechaFiltro.toString() : "TODAS");
        resumen.put("moneda", "PEN");
        resumen.put("ventas", ventasConfirmadas);
        return resumen;
    }
}
