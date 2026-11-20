package com.transsync.ms_flota;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public class MantenimientoRequestDTO {

    @NotNull(message = "El ID del bus es obligatorio")
    private Long busId;

    @NotBlank(message = "El tipo de mantenimiento es obligatorio")
    private String tipo;

    @NotBlank(message = "La descripción de la intervención es obligatoria")
    private String descripcion;

    @NotNull(message = "La fecha programada es obligatoria")
    private LocalDate fechaProgramada;

    @Positive(message = "El costo estimado debe ser mayor a cero")
    private Double costo;

    private String taller;

    private String observaciones;

    public MantenimientoRequestDTO() {}

    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDate getFechaProgramada() { return fechaProgramada; }
    public void setFechaProgramada(LocalDate fechaProgramada) { this.fechaProgramada = fechaProgramada; }

    public Double getCosto() { return costo; }
    public void setCosto(Double costo) { this.costo = costo; }

    public String getTaller() { return taller; }
    public void setTaller(String taller) { this.taller = taller; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
