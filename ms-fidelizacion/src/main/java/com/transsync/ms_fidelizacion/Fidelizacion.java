package com.transsync.ms_fidelizacion;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "fidelizacion")
public class Fidelizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long pasajeroId;
    private Integer puntos;
    private String nivel; // BRONCE, PLATA, ORO
    private LocalDate fechaUltimaActualizacion;

    // Constructor vacío
    public Fidelizacion() {
    }

    // Constructor con parámetros
    public Fidelizacion(Long pasajeroId, Integer puntos, String nivel, LocalDate fechaUltimaActualizacion) {
        this.pasajeroId = pasajeroId;
        this.puntos = puntos;
        this.nivel = nivel;
        this.fechaUltimaActualizacion = fechaUltimaActualizacion;
    }

    // Getters y Setters manuales
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPasajeroId() { return pasajeroId; }
    public void setPasajeroId(Long pasajeroId) { this.pasajeroId = pasajeroId; }

    public Integer getPuntos() { return puntos; }
    public void setPuntos(Integer puntos) { this.puntos = puntos; }

    public String getNivel() { return nivel; }
    public void setNivel(String nivel) { this.nivel = nivel; }

    public LocalDate getFechaUltimaActualizacion() { return fechaUltimaActualizacion; }
    public void setFechaUltimaActualizacion(LocalDate fechaUltimaActualizacion) { this.fechaUltimaActualizacion = fechaUltimaActualizacion; }
}
