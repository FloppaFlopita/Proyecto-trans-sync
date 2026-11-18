import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Fondo decorativo abstracto -->
      <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <!-- Logo e Identidad Corporativa -->
        <div class="w-14 h-14 mx-auto rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/30 mb-3">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight">TransSync Enterprise</h2>
        <p class="text-xs font-semibold text-teal-400 uppercase tracking-widest mt-0.5">Control de Acceso e Identidades (IAM / MS-Auth)</p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div class="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200/80 sm:px-10">

          <!-- Mensaje de bloqueo por guard o sesión requerida -->
          <div *ngIf="mensajeBloqueo" class="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <span class="text-amber-600 font-bold text-sm leading-none mt-0.5">⚠</span>
            <p class="leading-relaxed">{{ mensajeBloqueo }}</p>
          </div>

          <!-- Mensaje de error al autenticar -->
          <div *ngIf="mensajeError" class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <span class="text-red-600 font-bold text-sm leading-none mt-0.5">✕</span>
            <p class="leading-relaxed">{{ mensajeError }}</p>
          </div>

          <!-- Formulario de Login -->
          <form (ngSubmit)="iniciarSesion()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Corporativo</label>
              <input [(ngModel)]="email" name="email" type="email" required placeholder="ejemplo@transsync.com"
                     class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"/>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <input [(ngModel)]="password" name="password" type="password" required placeholder="••••••••"
                     class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"/>
            </div>

            <button type="submit" [disabled]="cargando"
                    class="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2">
              <span *ngIf="!cargando">Iniciar Sesión</span>
              <span *ngIf="cargando" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Autenticando en MS-Auth...
              </span>
            </button>
          </form>

          <!-- Relleno rápido para demostración académica -->
          <div class="mt-6 pt-5 border-t border-slate-100">
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">Acceso Rápido por Rol (Demostración):</p>
            <div class="grid grid-cols-3 gap-2">
              <button (click)="cargarCredenciales('admin@transsync.com', 'admin123')" type="button"
                      class="py-2 px-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-xs font-bold text-slate-700 transition-colors text-center">
                Admin
              </button>
              <button (click)="cargarCredenciales('conductor@transsync.com', 'chofer123')" type="button"
                      class="py-2 px-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-xs font-bold text-slate-700 transition-colors text-center">
                Conductor
              </button>
              <button (click)="cargarCredenciales('cliente@transsync.com', 'cliente123')" type="button"
                      class="py-2 px-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-xs font-bold text-slate-700 transition-colors text-center">
                Cliente
              </button>
            </div>
          </div>

          <!-- Separador -->
          <div class="mt-6 pt-5 border-t border-slate-200">
            <button (click)="continuarComoInvitado()" type="button"
                    class="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/50 bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2">
              <span>Continuar sin iniciar sesión (Modo Pasajero / Invitado)</span>
              <span>➔</span>
            </button>
            <p class="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
              Permite buscar rutas, ver horarios y comprar boletos directamente sin registrar cuenta.
            </p>
          </div>

        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  cargando = false;
  mensajeBloqueo = '';
  mensajeError = '';
  returnUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
      const authReq = params['auth_required'];
      if (authReq === 'ADMIN') {
        this.mensajeBloqueo = 'Acceso restringido: Se requiere iniciar sesión con perfil de Administrador.';
      } else if (authReq === 'CONDUCTOR') {
        this.mensajeBloqueo = 'Acceso restringido: Se requiere iniciar sesión como Conductor.';
      } else if (params['mensaje']) {
        this.mensajeBloqueo = params['mensaje'];
      }
    });
  }

  cargarCredenciales(correo: string, clave: string) {
    this.email = correo;
    this.password = clave;
    this.mensajeError = '';
  }

  iniciarSesion() {
    if (!this.email || !this.password) {
      this.mensajeError = 'Por favor complete su correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (resp: any) => {
        this.cargando = false;
        const roles = resp?.datos?.roles || [];
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (roles.includes('ADMIN')) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/reservas']);
        }
      },
      error: (err: any) => {
        this.cargando = false;
        this.mensajeError = err.error?.mensaje || 'Credenciales no válidas. Verifique correo y contraseña.';
      }
    });
  }

  continuarComoInvitado() {
    this.authService.continuarComoInvitado();
    this.router.navigate(['/reservas']);
  }
}
