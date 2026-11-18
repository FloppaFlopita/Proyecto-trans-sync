package com.transsync.ms_facturacion;

public class EmitirComprobanteRequest {

    private String tipo; // BOLETA o FACTURA
    private Long reservaId;
    private Long pagoId;
    private String clienteDocumento;
    private String clienteNombre;
    private Double total;

    public EmitirComprobanteRequest() {}

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

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
}

