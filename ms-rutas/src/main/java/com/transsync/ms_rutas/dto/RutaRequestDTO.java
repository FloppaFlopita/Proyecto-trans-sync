package com.transsync.ms_rutas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RutaRequestDTO {

    @NotBlank(message = "La ciudad de origen es obligatoria")
    @Size(min = 2, max = 100, message = "El origen debe tener entre 2 y 100 caracteres")
    private String origen;

    @NotBlank(message = "La ciudad de destino es obligatoria")
    @Size(min = 2, max = 100, message = "El destino debe tener entre 2 y 100 caracteres")
    private String destino;

    @NotBlank(message = "El horario de salida es obligatorio")
    private String horario;

    @NotNull(message = "La tarifa de pasaje es obligatoria")
    @DecimalMin(value = "0.01", message = "La tarifa debe ser mayor a S/. 0.00")
    private Double precio;

    public RutaRequestDTO() {}

    public RutaRequestDTO(String origen, String destino, String horario, Double precio) {
        this.origen = origen;
        this.destino = destino;
        this.horario = horario;
        this.precio = precio;
    }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }
}
