import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RutaItem {
  id: number;
  origen: string;
  destino: string;
  horario: string;
  precio: number;
}

export interface RutaEstadisticas {
  totalRutas: number;
  totalOrigenes: number;
  totalDestinos: number;
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
  destinosPopulares: { destino: string; frecuencia: number }[];
  distribucionTurnos: { [turno: string]: number };
}

export interface RutaAuditoriaItem {
  id: number;
  rutaId: number;
  tipoOperacion: string;
  origen: string;
  destino: string;
  horario: string;
  precio: number;
  detallesAnteriores?: string;
  detallesNuevos?: string;
  fechaOperacion: string;
}

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

  buscarRutas(origen?: string, destino?: string, maxPrecio?: number): Observable<any> {
    let params = new HttpParams();
    if (origen) params = params.set('origen', origen);
    if (destino) params = params.set('destino', destino);
    if (maxPrecio !== undefined && maxPrecio !== null) params = params.set('maxPrecio', maxPrecio.toString());

    return this.http.get(`${this.apiUrl}/buscar`, { params });
  }

  getEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }

  getHistorial(): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial`);
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
