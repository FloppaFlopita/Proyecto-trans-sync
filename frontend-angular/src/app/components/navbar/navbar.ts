import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserSession } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        <!-- Logo e Identidad Corporativa -->
        <div class="flex items-center gap-8">
          <a routerLink="/reservas" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </div>
            <div>
              <span class="text-lg font-black text-slate-900 tracking-tight block leading-tight">TransSync</span>
              <span class="text-[10px] font-semibold text-teal-600 uppercase tracking-wider block">Transporte Interprovincial</span>
            </div>
          </a>

          <!-- Enlaces de Navegacion segun Rol -->
          <div class="hidden md:flex items-center gap-1 text-sm font-medium">

            <!-- Para Pasajero / Cliente o Invitado -->
            <ng-container *ngIf="!usuario || esCliente()">
              <a routerLink="/reservas" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Comprar Pasajes
              </a>
              <a routerLink="/rutas" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Rutas y Horarios
              </a>
              <a routerLink="/promociones" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Promociones
              </a>
            </ng-container>

            <!-- Para Conductor -->
            <ng-container *ngIf="esConductor()">
              <a routerLink="/reservas" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-teal-700 font-bold bg-teal-50 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-teal-600"></span>
                Panel del Conductor (Manifiesto)
              </a>
              <a routerLink="/flota" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Mi Vehículo Asignado
              </a>
            </ng-container>

            <!-- Para Administrador -->
            <ng-container *ngIf="esAdmin()">
              <a routerLink="/dashboard" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Dashboard
              </a>
              <a routerLink="/rutas" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Rutas
              </a>
              <a routerLink="/flota" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Flota
              </a>
              <a routerLink="/reservas" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Reservas y Ventas
              </a>
              <a routerLink="/pagos" routerLinkActive="bg-teal-50 text-teal-700 font-semibold"
                 class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Pagos
              </a>
            </ng-container>

          </div>
        </div>

        <!-- Derecha: Estado de Conexion, Boton Iniciar Sesion o Avatar -->
        <div class="flex items-center gap-3">
          <!-- Indicador de Sistema en Linea -->
          <div class="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Servicio Activo
          </div>

          <!-- Si NO está logueado: Botón Iniciar Sesión -->
          <a *ngIf="!usuario" routerLink="/login"
             class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            <span>Iniciar Sesión</span>
          </a>

          <!-- Si ESTÁ logueado: Botón de Avatar / Perfil -->
          <button *ngIf="usuario" (click)="mostrarModalPerfil = true"
                  class="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                  title="Abrir Mi Perfil y Cuenta">
            <div class="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-inner">
              {{ usuario.nombre.charAt(0) }}
            </div>
            <div class="text-left hidden sm:block">
              <p class="text-xs font-bold text-slate-800 leading-tight">
                {{ usuario.nombre.split(' ')[0] }}
              </p>
              <p class="text-[10px] font-semibold text-teal-600 uppercase">
                {{ usuario.roles[0] || 'Cliente' }}
              </p>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

      </div>
    </nav>

    <!-- ================= MODAL DE PERFIL DE USUARIO (SIN CAMBIADOR DIRECTO) ================= -->
    <div *ngIf="mostrarModalPerfil && usuario" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 animate-in fade-in zoom-in-95 duration-150">

        <!-- Cabecera del modal -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-teal-500/20">
              {{ usuario.nombre.charAt(0) }}
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">
                {{ usuario.nombre }}
              </h3>
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                ROL: {{ usuario.roles.join(', ') }}
              </span>
            </div>
          </div>
          <button (click)="mostrarModalPerfil = false" class="text-slate-400 hover:text-slate-700 text-xl font-bold p-1">✕</button>
        </div>

        <!-- Cuerpo del Perfil -->
        <div class="py-4 space-y-4">

          <!-- Tarjeta de Puntos de Fidelizacion (Para clientes) -->
          <div *ngIf="esCliente()" class="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-100 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-teal-900">Programa TransSync Rewards</p>
              <p class="text-2xl font-black text-teal-700 mt-0.5">{{ authService.obtenerPuntos() }} <span class="text-xs font-bold text-teal-600">Puntos</span></p>
              <p class="text-[11px] text-teal-800/80 mt-0.5">Equivalente a S/ 14.00 de descuento en tu próximo viaje.</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-teal-600/10 flex items-center justify-center text-teal-700 font-bold text-lg">
              ★
            </div>
          </div>

          <!-- Informacion del Usuario -->
          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Correo Electrónico:</span>
              <span class="font-semibold text-slate-800">{{ usuario.email }}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Estado de Cuenta:</span>
              <span class="font-bold text-emerald-600">Activo y Verificado</span>
            </div>
            <div *ngIf="usuario.dni" class="flex justify-between py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Documento de Identidad:</span>
              <span class="font-semibold text-slate-800">{{ usuario.dni }}</span>
            </div>
          </div>

          <!-- Seccion: Cambiar Contraseña -->
          <div class="pt-2">
            <button (click)="mostrarCambioClave = !mostrarCambioClave"
                    class="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              <span>{{ mostrarCambioClave ? '− Cancelar' : '+ Cambiar Contraseña' }}</span>
            </button>

            <div *ngIf="mostrarCambioClave" class="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div>
                <label class="block text-[11px] font-medium text-slate-600 mb-1">Nueva Contraseña</label>
                <input [(ngModel)]="nuevaClave" type="password" placeholder="Mínimo 6 caracteres"
                       class="w-full rounded-lg px-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-800 outline-none focus:border-teal-500"/>
              </div>
              <button (click)="guardarNuevaClave()"
                      class="w-full py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition-colors">
                Actualizar Contraseña
              </button>
              <p *ngIf="mensajeClave" class="text-[11px] text-emerald-600 font-medium text-center">{{ mensajeClave }}</p>
            </div>
          </div>

        </div>

        <!-- Pie del Modal: Cerrar Sesión para Cambiar de Cuenta -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button (click)="cerrarSesion()"
                  class="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors flex items-center gap-1.5 border border-red-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>

          <button (click)="mostrarModalPerfil = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  `
})
export class NavbarComponent implements OnInit {
  usuario: UserSession | null = null;
  mostrarModalPerfil = false;
  mostrarCambioClave = false;
  nuevaClave = '';
  mensajeClave = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.usuario = u);
  }

  esCliente(): boolean {
    return !this.usuario || this.usuario.roles.includes('CLIENTE');
  }

  esConductor(): boolean {
    return !!this.usuario && this.usuario.roles.includes('CONDUCTOR');
  }

  esAdmin(): boolean {
    return !!this.usuario && this.usuario.roles.includes('ADMIN');
  }

  guardarNuevaClave() {
    if (!this.nuevaClave || this.nuevaClave.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.mensajeClave = 'Contraseña actualizada exitosamente.';
    setTimeout(() => {
      this.mostrarCambioClave = false;
      this.mensajeClave = '';
      this.nuevaClave = '';
    }, 1500);
  }

  cerrarSesion() {
    this.authService.logout();
    this.mostrarModalPerfil = false;
    this.router.navigate(['/login']);
  }
}
