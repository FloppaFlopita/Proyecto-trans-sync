import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private apiUrl = 'http://localhost:8100/api/reservas';

  constructor(private http: HttpClient) {}

  getReservas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getReserva(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createReserva(reserva: any): Observable<any> {
    return this.http.post(this.apiUrl, reserva);
  }

  createReservaMultiple(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/multiple`, datos);
  }

  getAsientosOcupados(busId: number, fechaViaje?: string): Observable<any> {
    const params = fechaViaje ? `?fechaViaje=${fechaViaje}` : '';
    return this.http.get(`${this.apiUrl}/bus/${busId}/asientos-ocupados${params}`);
  }

  getManifiestoConductor(conductorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/conductor/${conductorId}/manifiesto`);
  }

  getHistorialPorDni(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial/cliente/${dni}`);
  }

  getHistorialPorEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial/usuario/${email}`);
  }

  getVentasAdmin(fecha?: string): Observable<any> {
    const params = fecha ? `?fecha=${fecha}` : '';
    return this.http.get(`${this.apiUrl}/ventas${params}`);
  }

  reiniciarBus(busId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bus/${busId}/reiniciar`);
  }

  updateReserva(id: number, reserva: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, reserva);
  }

  cancelarReserva(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
