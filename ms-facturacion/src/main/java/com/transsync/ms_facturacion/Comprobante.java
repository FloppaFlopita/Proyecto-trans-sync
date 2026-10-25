package com.transsync.ms_facturacion;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comprobantes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"serie", "numero"}, name = "uk_serie_numero")
})
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String serie; // B001 para boletas, F001 para facturas

    @Column(nullable = false)
    private Long numero; // Correlativo secuencial 1, 2, 3...

    @Column(nullable = false, length = 20)
    private String tipo; // BOLETA, FACTURA

    @Column(nullable = false)
    private Long reservaId;

    @Column(nullable = false)
    private Long pagoId;

    @Column(nullable = false, length = 20)
    private String clienteDocumento; // DNI o RUC

    @Column(nullable = false, length = 150)
    private String clienteNombre;

    @Column(nullable = false)
    private Double subtotal;

    @Column(nullable = false)
    private Double igv; // 18%

    @Column(nullable = false)
    private Double total;

    @Column(nullable = false, length = 20)
    private String estado; // EMITIDO, ANULADO

    private String motivoAnulacion;

    @Column(nullable = false)
    private LocalDateTime fechaEmision;

    private LocalDateTime fechaAnulacion;

    public Comprobante() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSerie() { return serie; }
    public void setSerie(String serie) { this.serie = serie; }

    public Long getNumero() { return numero; }
    public void setNumero(Long numero) { this.numero = numero; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public Long getPagoId() { return pagoId; }
    public void setPagoId(Long pagoId) { this.pagoId = pagoId; }

    public String getClienteDocumento() { return clienteDocumento; }
    public void setClienteDocumento(String clienteDocumento) { this.clienteDocumento = clienteDocumento; }

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getIgv() { return igv; }
    public void setIgv(Double igv) { this.igv = igv; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMotivoAnulacion() { return motivoAnulacion; }
    public void setMotivoAnulacion(String motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }

    public LocalDateTime getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDateTime fechaEmision) { this.fechaEmision = fechaEmision; }

    public LocalDateTime getFechaAnulacion() { return fechaAnulacion; }
    public void setFechaAnulacion(LocalDateTime fechaAnulacion) { this.fechaAnulacion = fechaAnulacion; }

    public String getNumeroCompleto() {
        return String.format("%s-%08d", serie, numero);
    }
}

