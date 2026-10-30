import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FlotaService } from '../../services/flota.service';
import { ReservasService } from '../../services/reservas.service';
import { PagosService } from '../../services/pagos.service';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO EJECUTIVO -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Panel de Control Principal
            </span>
            <span class="text-xs text-slate-500 font-medium">TransSync · Sistema Integrado 2026</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Resumen General de Operaciones
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
            Métricas clave de transporte interprovincial: rutas activas, capacidad vehicular y volumen de ingresos.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a routerLink="/reservas"
             class="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
            Venta de Boletos
          </a>
        </div>
      </div>

      <!-- GRILLA DE KPIS PRINCIPALES -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Rutas Activas -->
        <a routerLink="/rutas" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group block">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4"/>
              </svg>
            </div>
            <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Corredores</span>
          </div>
          <p class="text-3xl font-black text-slate-900">{{ totalRutas }}</p>
          <p class="text-xs text-slate-500 font-medium mt-1">Rutas operativas →</p>
        </a>

        <!-- Flota Activa -->
        <a routerLink="/flota" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all group block">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </div>
            <span class="text-[11px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">Flota</span>
          </div>
          <p class="text-3xl font-black text-slate-900">{{ totalBuses }}</p>
          <p class="text-xs text-slate-500 font-medium mt-1">Autobuses registrados →</p>
        </a>

        <!-- Reservas -->
        <a routerLink="/reservas" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group block">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
              </svg>
            </div>
            <span class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Boletos</span>
          </div>
          <p class="text-3xl font-black text-slate-900">{{ totalReservas }}</p>
          <p class="text-xs text-slate-500 font-medium mt-1">Reservas emitidas →</p>
        </a>

        <!-- Pagos / Recaudación -->
        <a routerLink="/pagos" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group block">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Ingresos</span>
          </div>
          <p class="text-3xl font-black text-slate-900">{{ totalPagos }}</p>
          <p class="text-xs text-slate-500 font-medium mt-1">S/. {{ totalRecaudado.toFixed(2) }} recaudado →</p>
        </a>

      </div>

      <!-- TABLAS DE ACTIVIDAD RECIENTE -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Últimas Reservas -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-sm font-black text-slate-900">Últimas Reservas de Boletos</h3>
              <p class="text-xs text-slate-500">Pasajeros registrados en el sistema</p>
            </div>
            <a routerLink="/reservas" class="text-xs font-bold text-blue-600 hover:text-blue-800">
              Ver todas →
            </a>
          </div>

          <div class="space-y-2.5">
            <div *ngFor="let r of ultimasReservas"
                 class="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-slate-100/80 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                  {{ r.nombrePasajero?.charAt(0) || 'P' }}
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-900">{{ r.nombrePasajero }}</p>
                  <p class="text-[11px] text-slate-500">
                    {{ r.rutaNombre ? (r.rutaNombre + ' · ') : '' }}Asiento #{{ r.asientoNumero || r.numeroAsiento || '-' }} · Viaje: {{ r.fechaViaje }}
                  </p>
                </div>
              </div>
              <span [class]="getBadgeReserva(r.estado)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                {{ r.estado }}
              </span>
            </div>

            <div *ngIf="ultimasReservas.length === 0" class="text-center py-8 text-xs text-slate-400">
              No hay reservas recientes registradas.
            </div>
          </div>
        </div>

        <!-- Últimos Pagos -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-sm font-black text-slate-900">Últimas Transacciones Financieras</h3>
              <p class="text-xs text-slate-500">Cobros procesados vía API Gateway</p>
            </div>
            <a routerLink="/pagos" class="text-xs font-bold text-emerald-600 hover:text-emerald-800">
              Ver todos →
            </a>
          </div>

          <div class="space-y-2.5">
            <div *ngFor="let p of ultimosPagos"
                 class="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-slate-100/80 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  S/.
                </div>
                <div>
                  <p class="text-xs font-black text-slate-900">S/. {{ p.monto?.toFixed(2) }}</p>
                  <p class="text-[11px] text-slate-500">
                    {{ p.metodoPago }} · Reserva #{{ p.reservaId }}
                  </p>
                </div>
              </div>
              <span [class]="getBadgePago(p.estado)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                {{ p.estado }}
              </span>
            </div>

            <div *ngIf="ultimosPagos.length === 0" class="text-center py-8 text-xs text-slate-400">
              No hay transacciones registradas.
            </div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  totalRutas = 0;
  totalBuses = 0;
  totalReservas = 0;
  totalPagos = 0;
  totalRecaudado = 0;

  ultimasReservas: any[] = [];
  ultimosPagos: any[] = [];

  constructor(
    private flotaService: FlotaService,
    private reservasService: ReservasService,
    private pagosService: PagosService,
    private rutasService: RutasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.rutasService.getRutas().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.totalRutas = datos.length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.flotaService.getBuses().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.totalBuses = datos.length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.reservasService.getReservas().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.totalReservas = datos.length;
        this.ultimasReservas = [...datos].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)).slice(0, 5);
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.pagosService.getPagos().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.totalPagos = datos.length;
        this.totalRecaudado = datos.reduce((acc: number, p: any) => acc + (p.monto || 0), 0);
        this.ultimosPagos = [...datos].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)).slice(0, 5);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  getBadgeReserva(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'CONFIRMADA': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDIENTE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELADA': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getBadgePago(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDIENTE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RECHAZADO': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}
