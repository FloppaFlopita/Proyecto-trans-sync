package com.transsync.ms_rutas.dto;

public class RutaResponseDTO {

    private Long id;
    private String origen;
    private String destino;
    private String horario;
    private Double precio;

    public RutaResponseDTO() {}

    public RutaResponseDTO(Long id, String origen, String destino, String horario, Double precio) {
        this.id = id;
        this.origen = origen;
        this.destino = destino;
        this.horario = horario;
        this.precio = precio;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }
}
