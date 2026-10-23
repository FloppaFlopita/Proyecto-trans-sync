import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private apiUrl = 'http://localhost:8100/api/pagos';

  constructor(private http: HttpClient) {}

  getPagos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getPago(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createPago(pago: any): Observable<any> {
    return this.http.post(this.apiUrl, pago);
  }

  updatePago(id: number, pago: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, pago);
  }
}
