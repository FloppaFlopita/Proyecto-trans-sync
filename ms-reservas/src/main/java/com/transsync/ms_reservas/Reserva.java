package com.transsync.ms_reservas;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombrePasajero;
    private String dniPasajero;
    private Long rutaId;
    private LocalDate fechaViaje;
    private String estado; // PENDIENTE, CONFIRMADA, CANCELADA

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombrePasajero() { return nombrePasajero; }
    public void setNombrePasajero(String nombrePasajero) { this.nombrePasajero = nombrePasajero; }

    public String getDniPasajero() { return dniPasajero; }
    public void setDniPasajero(String dniPasajero) { this.dniPasajero = dniPasajero; }

    public Long getRutaId() { return rutaId; }
    public void setRutaId(Long rutaId) { this.rutaId = rutaId; }

    public LocalDate getFechaViaje() { return fechaViaje; }
    public void setFechaViaje(LocalDate fechaViaje) { this.fechaViaje = fechaViaje; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
