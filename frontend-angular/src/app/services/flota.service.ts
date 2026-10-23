import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  createBus(bus: any): Observable<any> {
    return this.http.post(this.apiUrl, bus);
  }

  updateBus(id: number, bus: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, bus);
  }

  deleteBus(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
