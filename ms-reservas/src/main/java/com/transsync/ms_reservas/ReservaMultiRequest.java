package com.transsync.ms_reservas;

import java.time.LocalDate;
import java.util.List;

public class ReservaMultiRequest {
    private String nombrePasajero;
    private String dniPasajero;
    private String telefonoPasajero;
    private String emailPasajero;
    private Long rutaId;
    private String rutaNombre;      // Ej: Juliaca - Cusco
    private Long busId;
    private LocalDate fechaViaje;
    private List<Integer> asientos; // Lista de números de asientos seleccionados [1, 2, ...]
    private Double precioUnitario;  // Precio por asiento
    private String metodoPago;      // YAPE, PLIN, TARJETA, TRANSFERENCIA
    private Long idCliente;         // Opcional: ID de cliente fidelizado

    public ReservaMultiRequest() {}

    public String getNombrePasajero() { return nombrePasajero; }
    public void setNombrePasajero(String nombrePasajero) { this.nombrePasajero = nombrePasajero; }

    public String getDniPasajero() { return dniPasajero; }
    public void setDniPasajero(String dniPasajero) { this.dniPasajero = dniPasajero; }

    public String getTelefonoPasajero() { return telefonoPasajero; }
    public void setTelefonoPasajero(String telefonoPasajero) { this.telefonoPasajero = telefonoPasajero; }

    public String getEmailPasajero() { return emailPasajero; }
    public void setEmailPasajero(String emailPasajero) { this.emailPasajero = emailPasajero; }

    public Long getRutaId() { return rutaId; }
    public void setRutaId(Long rutaId) { this.rutaId = rutaId; }

    public String getRutaNombre() { return rutaNombre; }
    public void setRutaNombre(String rutaNombre) { this.rutaNombre = rutaNombre; }

    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }

    public LocalDate getFechaViaje() { return fechaViaje; }
    public void setFechaViaje(LocalDate fechaViaje) { this.fechaViaje = fechaViaje; }

    public List<Integer> getAsientos() { return asientos; }
    public void setAsientos(List<Integer> asientos) { this.asientos = asientos; }

    public Double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(Double precioUnitario) { this.precioUnitario = precioUnitario; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long idCliente) { this.idCliente = idCliente; }
}
