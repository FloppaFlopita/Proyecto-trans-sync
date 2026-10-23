import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RutasService {
  private apiUrl = 'http://localhost:8100/api/rutas';

  constructor(private http: HttpClient) {}

  getRutas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getRuta(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createRuta(ruta: any): Observable<any> {
    return this.http.post(this.apiUrl, ruta);
  }

  updateRuta(id: number, ruta: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, ruta);
  }

  deleteRuta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
