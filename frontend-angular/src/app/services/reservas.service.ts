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

  updateReserva(id: number, reserva: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, reserva);
  }

  cancelarReserva(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
