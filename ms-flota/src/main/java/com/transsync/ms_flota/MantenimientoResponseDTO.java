package com.transsync.ms_flota;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MantenimientoResponseDTO {
    private Long id;
    private Long busId;
    private String busPlaca;
    private String busModelo;
    private String tipo;
    private String descripcion;
    private LocalDate fechaProgramada;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Double costo;
    private String taller;
    private EstadoMantenimiento estado;
    private String observaciones;

    public MantenimientoResponseDTO() {}

    public static MantenimientoResponseDTO fromEntity(Mantenimiento m) {
        MantenimientoResponseDTO dto = new MantenimientoResponseDTO();
        dto.setId(m.getId());
        if (m.getBus() != null) {
            dto.setBusId(m.getBus().getId());
            dto.setBusPlaca(m.getBus().getPlaca());
            dto.setBusModelo(m.getBus().getModelo());
        }
        dto.setTipo(m.getTipo());
        dto.setDescripcion(m.getDescripcion());
        dto.setFechaProgramada(m.getFechaProgramada());
        dto.setFechaInicio(m.getFechaInicio());
        dto.setFechaFin(m.getFechaFin());
        dto.setCosto(m.getCosto());
        dto.setTaller(m.getTaller());
        dto.setEstado(m.getEstado());
        dto.setObservaciones(m.getObservaciones());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }

    public String getBusPlaca() { return busPlaca; }
    public void setBusPlaca(String busPlaca) { this.busPlaca = busPlaca; }

    public String getBusModelo() { return busModelo; }
    public void setBusModelo(String busModelo) { this.busModelo = busModelo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDate getFechaProgramada() { return fechaProgramada; }
    public void setFechaProgramada(LocalDate fechaProgramada) { this.fechaProgramada = fechaProgramada; }

    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }

    public Double getCosto() { return costo; }
    public void setCosto(Double costo) { this.costo = costo; }

    public String getTaller() { return taller; }
    public void setTaller(String taller) { this.taller = taller; }

    public EstadoMantenimiento getEstado() { return estado; }
    public void setEstado(EstadoMantenimiento estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
