package com.transsync.ms_fidelizacion;

import java.io.Serializable;
import java.util.List;

public class ReservaCreadaEvento implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long reservaId;
    private String numeroBoleta;
    private String nombrePasajero;
    private String dniPasajero;
    private String telefonoPasajero;
    private String emailPasajero;
    private Long rutaId;
    private String rutaNombre;
    private Long busId;
    private List<Integer> asientos;
    private Double totalPagar;
    private String metodoPago;
    private Long idCliente;
    private String fechaHora;
    private String correlationId;

    public ReservaCreadaEvento() {}

    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public String getNumeroBoleta() { return numeroBoleta; }
    public void setNumeroBoleta(String numeroBoleta) { this.numeroBoleta = numeroBoleta; }

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

    public List<Integer> getAsientos() { return asientos; }
    public void setAsientos(List<Integer> asientos) { this.asientos = asientos; }

    public Double getTotalPagar() { return totalPagar; }
    public void setTotalPagar(Double totalPagar) { this.totalPagar = totalPagar; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long idCliente) { this.idCliente = idCliente; }

    public String getFechaHora() { return fechaHora; }
    public void setFechaHora(String fechaHora) { this.fechaHora = fechaHora; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
}
