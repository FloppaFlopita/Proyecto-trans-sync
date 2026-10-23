import { Component, OnInit } from '@angular/core';
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
    <div class="space-y-8">

      <!-- Hero header -->
      <div class="pt-2">
        <p class="text-xs font-medium tracking-widest uppercase mb-2" style="color:#6366f1;">Sistema de Transportes</p>
        <h1 class="text-3xl font-bold text-white">Bienvenido, Christian <span class="wave">👋</span></h1>
        <p class="mt-1.5 text-sm" style="color:#71717a;">Vista general del sistema — región Juliaca · Puno · Arequipa · Cusco</p>
      </div>

      <!-- KPI grid -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <div class="kpi-card group" style="--accent:#6366f1;">
          <div class="flex items-start justify-between mb-6">
            <div class="icon-box" style="background:rgba(99,102,241,0.15);">
              <svg class="w-4 h-4" style="color:#6366f1;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4"/>
              </svg>
            </div>
            <span class="badge-up">Activas</span>
          </div>
          <p class="text-4xl font-bold text-white tabular-nums">{{ totalRutas }}</p>
          <p class="text-xs mt-1.5" style="color:#71717a;">Rutas operativas</p>
          <div class="accent-line" style="background:#6366f1;"></div>
        </div>

        <div class="kpi-card group" style="--accent:#8b5cf6;">
          <div class="flex items-start justify-between mb-6">
            <div class="icon-box" style="background:rgba(139,92,246,0.15);">
              <svg class="w-4 h-4" style="color:#8b5cf6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 16h2l3-5h1a1 1 0 011 1v4h-2"/>
              </svg>
            </div>
            <span class="badge-up">Flota</span>
          </div>
          <p class="text-4xl font-bold text-white tabular-nums">{{ totalBuses }}</p>
          <p class="text-xs mt-1.5" style="color:#71717a;">Buses en operación</p>
          <div class="accent-line" style="background:#8b5cf6;"></div>
        </div>

        <div class="kpi-card group" style="--accent:#f59e0b;">
          <div class="flex items-start justify-between mb-6">
            <div class="icon-box" style="background:rgba(245,158,11,0.15);">
              <svg class="w-4 h-4" style="color:#f59e0b;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
              </svg>
            </div>
            <span class="badge-up">Total</span>
          </div>
          <p class="text-4xl font-bold text-white tabular-nums">{{ totalReservas }}</p>
          <p class="text-xs mt-1.5" style="color:#71717a;">Reservas registradas</p>
          <div class="accent-line" style="background:#f59e0b;"></div>
        </div>

        <div class="kpi-card group" style="--accent:#10b981;">
          <div class="flex items-start justify-between mb-6">
            <div class="icon-box" style="background:rgba(16,185,129,0.15);">
              <svg class="w-4 h-4" style="color:#10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <span class="badge-up">Pagos</span>
          </div>
          <p class="text-4xl font-bold text-white tabular-nums">{{ totalPagos }}</p>
          <p class="text-xs mt-1.5" style="color:#71717a;">Transacciones</p>
          <div class="accent-line" style="background:#10b981;"></div>
        </div>
      </div>

      <!-- Bottom grid: reservas + pagos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Últimas reservas -->
        <div class="dark-card">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-semibold text-white">Últimas Reservas</h3>
              <p class="text-xs mt-0.5" style="color:#52525b;">Actividad reciente</p>
            </div>
            <a routerLink="/reservas" class="text-xs font-medium transition-colors hover:text-white" style="color:#6366f1;">Ver todas →</a>
          </div>
          <div class="space-y-3">
            <div *ngFor="let r of ultimasReservas"
                 class="flex items-center justify-between p-3 rounded-lg" style="background:rgba(255,255,255,0.04);">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                     style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                  {{ r.nombrePasajero?.charAt(0) }}
                </div>
                <div>
                  <p class="text-xs font-medium text-white">{{ r.nombrePasajero }}</p>
                  <p class="text-xs" style="color:#52525b;">{{ r.fechaViaje }}</p>
                </div>
              </div>
              <span [class]="getBadge(r.estado)">{{ r.estado }}</span>
            </div>
            <div *ngIf="ultimasReservas.length === 0"
                 class="text-center py-6 text-xs" style="color:#52525b;">Cargando...</div>
          </div>
        </div>

        <!-- Últimos pagos -->
        <div class="dark-card">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-semibold text-white">Últimos Pagos</h3>
              <p class="text-xs mt-0.5" style="color:#52525b;">Transacciones recientes</p>
            </div>
            <a routerLink="/pagos" class="text-xs font-medium transition-colors hover:text-white" style="color:#6366f1;">Ver todos →</a>
          </div>
          <div class="space-y-3">
            <div *ngFor="let p of ultimosPagos"
                 class="flex items-center justify-between p-3 rounded-lg" style="background:rgba(255,255,255,0.04);">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                     style="background:rgba(16,185,129,0.15);">
                  <svg class="w-3.5 h-3.5" style="color:#10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white">S/. {{ p.monto?.toFixed(2) }}</p>
                  <p class="text-xs" style="color:#52525b;">{{ p.metodoPago }} · Reserva #{{ p.reservaId }}</p>
                </div>
              </div>
              <span [class]="getBadge(p.estado)">{{ p.estado }}</span>
            </div>
            <div *ngIf="ultimosPagos.length === 0"
                 class="text-center py-6 text-xs" style="color:#52525b;">Cargando...</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      position: relative;
      overflow: hidden;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      transition: border-color 0.2s, transform 0.2s;
    }
    .kpi-card:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
    .icon-box { width:2.25rem; height:2.25rem; border-radius:0.625rem; display:flex; align-items:center; justify-content:center; }
    .badge-up { font-size:0.65rem; font-weight:600; padding:0.2rem 0.6rem; border-radius:999px;
                color:#4ade80; background:rgba(74,222,128,0.12); border:1px solid rgba(74,222,128,0.2); }
    .accent-line { position:absolute; bottom:0; left:0; right:0; height:2px; opacity:0.6; }
    .dark-card { padding:1.25rem; border-radius:1rem; border:1px solid rgba(255,255,255,0.08);
                 background:rgba(255,255,255,0.04); }
    .wave { display:inline-block; animation: wave 2s ease-in-out infinite; }
    @keyframes wave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(20deg)} 75%{transform:rotate(-10deg)} }
  `]
})
export class DashboardComponent implements OnInit {
  totalRutas = 0; totalBuses = 0; totalReservas = 0; totalPagos = 0;
  ultimasReservas: any[] = []; ultimosPagos: any[] = [];

  constructor(
    private flotaService: FlotaService, private reservasService: ReservasService,
    private pagosService: PagosService, private rutasService: RutasService
  ) {}

  ngOnInit() {
    this.rutasService.getRutas().subscribe({ next: (r: any) => this.totalRutas = r.datos?.length || 0, error: () => {} });
    this.flotaService.getBuses().subscribe({ next: (r: any) => this.totalBuses = r.datos?.length || 0, error: () => {} });
    this.reservasService.getReservas().subscribe({
      next: (r: any) => { const d = r.datos || []; this.totalReservas = d.length; this.ultimasReservas = d.slice(0,5); }, error: () => {}
    });
    this.pagosService.getPagos().subscribe({
      next: (r: any) => { const d = r.datos || []; this.totalPagos = d.length; this.ultimosPagos = d.slice(0,5); }, error: () => {}
    });
  }

  getBadge(estado: string) {
    const b = 'text-xs font-semibold px-2 py-0.5 rounded-full ';
    switch (estado?.toUpperCase()) {
      case 'CONFIRMADA': case 'COMPLETADO': return b + 'text-emerald-400 bg-emerald-400/10';
      case 'PENDIENTE':  return b + 'text-amber-400 bg-amber-400/10';
      case 'CANCELADA':  case 'RECHAZADO': return b + 'text-red-400 bg-red-400/10';
      default: return b + 'text-zinc-400 bg-zinc-400/10';
    }
  }
}
