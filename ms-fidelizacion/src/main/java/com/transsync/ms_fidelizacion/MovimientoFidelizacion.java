package com.transsync.ms_fidelizacion;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_fidelizacion")
public class MovimientoFidelizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long pasajeroId;

    @Column(nullable = false)
    private Integer puntos; // Positivo para acumulación, negativo para canje

    @Column(nullable = false)
    private String tipo; // ACUMULACION, CANJE

    private String descripcion;

    @Column(nullable = false)
    private LocalDateTime fecha;

    public MovimientoFidelizacion() {}

    public MovimientoFidelizacion(Long pasajeroId, Integer puntos, String tipo, String descripcion) {
        this.pasajeroId = pasajeroId;
        this.puntos = puntos;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.fecha = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPasajeroId() { return pasajeroId; }
    public void setPasajeroId(Long pasajeroId) { this.pasajeroId = pasajeroId; }

    public Integer getPuntos() { return puntos; }
    public void setPuntos(Integer puntos) { this.puntos = puntos; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}

