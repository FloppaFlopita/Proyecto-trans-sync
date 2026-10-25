package com.transsync.ms_reservas;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombrePasajero;
    private String dniPasajero;
    private String telefonoPasajero;
    private String emailPasajero;
    private Long rutaId;
    private String rutaNombre;    // Ej: Juliaca - Cusco
    private Long busId;          // ID del bus asignado (consultado a ms-flota)
    private Integer asientoNumero; // Asiento específico (1, 2, 3...)
    private LocalDate fechaViaje;
    private Double precio;        // Precio del boleto (ej: 45.00 con IGV)
    private String metodoPago;    // YAPE, PLIN, TARJETA, TRANSFERENCIA
    private String numeroBoleta;  // B001-000012
    private LocalDateTime fechaHoraVenta; // Registro exacto de fecha y hora
    private String estado;       // PENDIENTE, CONFIRMADA, CANCELADA

    public Reserva() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Integer getAsientoNumero() { return asientoNumero; }
    public void setAsientoNumero(Integer asientoNumero) { this.asientoNumero = asientoNumero; }

    public LocalDate getFechaViaje() { return fechaViaje; }
    public void setFechaViaje(LocalDate fechaViaje) { this.fechaViaje = fechaViaje; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getNumeroBoleta() { return numeroBoleta; }
    public void setNumeroBoleta(String numeroBoleta) { this.numeroBoleta = numeroBoleta; }

    public LocalDateTime getFechaHoraVenta() { return fechaHoraVenta; }
    public void setFechaHoraVenta(LocalDateTime fechaHoraVenta) { this.fechaHoraVenta = fechaHoraVenta; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
