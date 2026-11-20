import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MantenimientoItem {
  id?: number;
  busId: number;
  busPlaca?: string;
  busModelo?: string;
  tipoMantenimiento: string;
  estado: 'PROGRAMADO' | 'EN_MANTENIMIENTO' | 'FINALIZADO' | 'CANCELADO';
  descripcion: string;
  tallerAsignado?: string;
  taller?: string;
  costoEstimado?: number;
  costoReal?: number;
  costo?: number;
  fechaProgramada: string;
  fechaInicio?: string;
  fechaFin?: string;
  observacionesFinales?: string;
  bloqueaOperacion?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FlotaService {
  private apiUrl = 'http://localhost:8100/api/buses';

  constructor(private http: HttpClient) {}

  getBuses(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getBusDisponibilidad(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/disponibilidad`);
  }

  getEstadisticasFlota(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }

  createBus(bus: any): Observable<any> {
    return this.http.post(this.apiUrl, bus);
  }

  updateBus(id: number, bus: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, bus);
  }

  deleteBus(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- Mantenimiento Preventivo / Correctivo ---
  getMantenimientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mantenimientos`);
  }

  getResumenMantenimiento(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mantenimientos/resumen`);
  }

  getProximosMantenimientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mantenimientos/proximos`);
  }

  getMantenimientosPorBus(busId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mantenimientos/bus/${busId}`);
  }

  programarMantenimiento(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mantenimientos`, dto);
  }

  iniciarMantenimiento(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/mantenimientos/${id}/iniciar`, {});
  }

  finalizarMantenimiento(id: number, datos: { costo?: number; observaciones?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/mantenimientos/${id}/finalizar`, datos);
  }

  cancelarMantenimiento(id: number, motivo: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/mantenimientos/${id}/cancelar`, { motivo });
  }
}
