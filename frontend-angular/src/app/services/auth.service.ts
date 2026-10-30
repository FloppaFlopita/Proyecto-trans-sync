import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface UserSession {
  token: string;
  email: string;
  nombre: string;
  roles: string[];
  idCliente?: number;
  idConductor?: number;
  puntosFidelizacion?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8100/api/auth';
  private currentUserSubject = new BehaviorSubject<UserSession | null>(this.obtenerSesionGuardada());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  login(credenciales: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(resp => {
        if (resp && resp.exito && resp.datos) {
          const user: UserSession = {
            token: resp.datos.token,
            email: resp.datos.email,
            nombre: resp.datos.nombre,
            roles: resp.datos.roles || [],
            idCliente: resp.datos.idCliente,
            idConductor: resp.datos.idConductor,
            puntosFidelizacion: 15 // Puntos base iniciales del programa
          };
          localStorage.setItem('transync_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('transync_user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.roles.includes(role);
  }

  isConductor(): boolean {
    return this.hasRole('CONDUCTOR');
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isCliente(): boolean {
    return this.hasRole('CLIENTE');
  }

  sumarPuntos(puntos: number): void {
    const user = this.currentUserSubject.value;
    if (user) {
      user.puntosFidelizacion = (user.puntosFidelizacion || 0) + puntos;
      localStorage.setItem('transync_user', JSON.stringify(user));
      this.currentUserSubject.next({ ...user });
    }
  }

  obtenerPuntos(): number {
    const user = this.currentUserSubject.value;
    return user ? (user.puntosFidelizacion ?? 15) : 0;
  }

  private obtenerSesionGuardada(): UserSession | null {
    try {
      const data = localStorage.getItem('transync_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
