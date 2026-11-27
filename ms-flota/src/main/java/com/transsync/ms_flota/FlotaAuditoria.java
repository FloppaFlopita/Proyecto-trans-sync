package com.transsync.ms_flota;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "flota_auditoria")
public class FlotaAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long busId;
    private String placa;
    private String tipoOperacion;
    private Integer asientosAntes;
    private Integer asientosDespues;

    @Column(length = 500)
    private String detalles;

    private LocalDateTime fechaOperacion;

    public FlotaAuditoria() {
        this.fechaOperacion = LocalDateTime.now();
    }

    public FlotaAuditoria(Long busId, String placa, String tipoOperacion,
                          Integer asientosAntes, Integer asientosDespues, String detalles) {
        this.busId = busId;
        this.placa = placa;
        this.tipoOperacion = tipoOperacion;
        this.asientosAntes = asientosAntes;
        this.asientosDespues = asientosDespues;
        this.detalles = detalles;
        this.fechaOperacion = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getBusId() { return busId; }
    public String getPlaca() { return placa; }
    public String getTipoOperacion() { return tipoOperacion; }
    public Integer getAsientosAntes() { return asientosAntes; }
    public Integer getAsientosDespues() { return asientosDespues; }
    public String getDetalles() { return detalles; }
    public LocalDateTime getFechaOperacion() { return fechaOperacion; }
}
