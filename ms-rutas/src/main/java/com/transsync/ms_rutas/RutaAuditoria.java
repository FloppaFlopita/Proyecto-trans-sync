package com.transsync.ms_rutas;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rutas_auditoria")
public class RutaAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ruta_id")
    private Long rutaId;

    @Column(name = "tipo_operacion", nullable = false)
    private String tipoOperacion; // CREACION, ACTUALIZACION, ELIMINACION

    @Column(name = "origen")
    private String origen;

    @Column(name = "destino")
    private String destino;

    @Column(name = "horario")
    private String horario;

    @Column(name = "precio")
    private Double precio;

    @Column(name = "detalles_anteriores", length = 1000)
    private String detallesAnteriores;

    @Column(name = "detalles_nuevos", length = 1000)
    private String detallesNuevos;

    @Column(name = "fecha_operacion", nullable = false)
    private LocalDateTime fechaOperacion;

    public RutaAuditoria() {
    }

    public RutaAuditoria(Long rutaId, String tipoOperacion, String origen, String destino, String horario, Double precio, String detallesAnteriores, String detallesNuevos) {
        this.rutaId = rutaId;
        this.tipoOperacion = tipoOperacion;
        this.origen = origen;
        this.destino = destino;
        this.horario = horario;
        this.precio = precio;
        this.detallesAnteriores = detallesAnteriores;
        this.detallesNuevos = detallesNuevos;
        this.fechaOperacion = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRutaId() { return rutaId; }
    public void setRutaId(Long rutaId) { this.rutaId = rutaId; }

    public String getTipoOperacion() { return tipoOperacion; }
    public void setTipoOperacion(String tipoOperacion) { this.tipoOperacion = tipoOperacion; }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }

    public String getDetallesAnteriores() { return detallesAnteriores; }
    public void setDetallesAnteriores(String detallesAnteriores) { this.detallesAnteriores = detallesAnteriores; }

    public String getDetallesNuevos() { return detallesNuevos; }
    public void setDetallesNuevos(String detallesNuevos) { this.detallesNuevos = detallesNuevos; }

    public LocalDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(LocalDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }
}
