package com.transsync.ms_rutas.dto;

import java.util.List;
import java.util.Map;

public class RutaEstadisticasDTO {

    private long totalRutas;
    private long totalOrigenes;
    private long totalDestinos;
    private double precioPromedio;
    private double precioMinimo;
    private double precioMaximo;
    private List<Map<String, Object>> destinosPopulares;
    private Map<String, Long> distribucionTurnos;

    public RutaEstadisticasDTO() {}

    public RutaEstadisticasDTO(long totalRutas, long totalOrigenes, long totalDestinos,
                               double precioPromedio, double precioMinimo, double precioMaximo,
                               List<Map<String, Object>> destinosPopulares,
                               Map<String, Long> distribucionTurnos) {
        this.totalRutas = totalRutas;
        this.totalOrigenes = totalOrigenes;
        this.totalDestinos = totalDestinos;
        this.precioPromedio = precioPromedio;
        this.precioMinimo = precioMinimo;
        this.precioMaximo = precioMaximo;
        this.destinosPopulares = destinosPopulares;
        this.distribucionTurnos = distribucionTurnos;
    }

    public long getTotalRutas() { return totalRutas; }
    public void setTotalRutas(long totalRutas) { this.totalRutas = totalRutas; }

    public long getTotalOrigenes() { return totalOrigenes; }
    public void setTotalOrigenes(long totalOrigenes) { this.totalOrigenes = totalOrigenes; }

    public long getTotalDestinos() { return totalDestinos; }
    public void setTotalDestinos(long totalDestinos) { this.totalDestinos = totalDestinos; }

    public double getPrecioPromedio() { return precioPromedio; }
    public void setPrecioPromedio(double precioPromedio) { this.precioPromedio = precioPromedio; }

    public double getPrecioMinimo() { return precioMinimo; }
    public void setPrecioMinimo(double precioMinimo) { this.precioMinimo = precioMinimo; }

    public double getPrecioMaximo() { return precioMaximo; }
    public void setPrecioMaximo(double precioMaximo) { this.precioMaximo = precioMaximo; }

    public List<Map<String, Object>> getDestinosPopulares() { return destinosPopulares; }
    public void setDestinosPopulares(List<Map<String, Object>> destinosPopulares) { this.destinosPopulares = destinosPopulares; }

    public Map<String, Long> getDistribucionTurnos() { return distribucionTurnos; }
    public void setDistribucionTurnos(Map<String, Long> distribucionTurnos) { this.distribucionTurnos = distribucionTurnos; }
}
