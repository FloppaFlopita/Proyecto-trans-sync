import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../../services/reservas.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-7">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-xs font-medium tracking-widest uppercase mb-1.5" style="color:#f59e0b;">Gestión</p>
          <h1 class="text-2xl font-bold text-white">Reservas</h1>
          <p class="text-sm mt-1" style="color:#71717a;">{{ reservas.length }} reservas en el sistema</p>
        </div>
        <button (click)="mostrarFormulario = !mostrarFormulario"
          class="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all"
          style="background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.35); color:#fbbf24;">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Reserva
        </button>
      </div>

      <!-- Formulario -->
      <div *ngIf="mostrarFormulario"
           class="rounded-xl border p-5"
           style="background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1);">
        <h3 class="text-sm font-semibold text-white mb-4">Nueva reserva</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Nombre Pasajero</label>
            <input [(ngModel)]="nuevaReserva.nombrePasajero" placeholder="Juan Pérez"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">DNI</label>
            <input [(ngModel)]="nuevaReserva.dniPasajero" placeholder="12345678"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">ID Ruta</label>
            <input [(ngModel)]="nuevaReserva.rutaId" type="number" placeholder="1"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">ID Bus</label>
            <input [(ngModel)]="nuevaReserva.busId" type="number" placeholder="1"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Fecha de Viaje</label>
            <input [(ngModel)]="nuevaReserva.fechaViaje" type="date"
              class="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color-scheme:dark;"/>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-4">
          <button (click)="crearReserva()"
            class="text-sm font-medium px-5 py-2 rounded-lg text-white"
            style="background:linear-gradient(135deg,#f59e0b,#f97316);">
            Confirmar
          </button>
          <button (click)="mostrarFormulario=false" class="text-sm font-medium px-4 py-2 rounded-lg" style="color:#71717a;">Cancelar</button>
          <span *ngIf="mensaje" class="text-xs ml-2" [style.color]="mensajeExito ? '#4ade80' : '#f87171'">{{ mensaje }}</span>
        </div>
      </div>

      <!-- Tabla -->
      <div class="rounded-xl border overflow-hidden" style="background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08);">
        <table class="w-full text-sm">
          <thead>
            <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">ID</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Pasajero</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">DNI</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Ruta / Bus</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Fecha</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Estado</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reservas; let odd = odd"
                [style.background]="odd ? 'rgba(255,255,255,0.015)' : 'transparent'"
                class="border-b transition-colors hover:bg-white/5"
                style="border-color:rgba(255,255,255,0.05);">
              <td class="px-5 py-3 font-mono text-xs" style="color:#52525b;">#{{ r.id }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                       style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">{{ r.nombrePasajero?.charAt(0) }}</div>
                  <span class="text-white font-medium text-xs">{{ r.nombrePasajero }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-xs" style="color:#71717a;">{{ r.dniPasajero }}</td>
              <td class="px-5 py-3 text-xs" style="color:#71717a;">
                Ruta <span class="text-white">#{{ r.rutaId }}</span> · Bus <span class="text-white">#{{ r.busId }}</span>
              </td>
              <td class="px-5 py-3 text-xs" style="color:#71717a;">{{ r.fechaViaje }}</td>
              <td class="px-5 py-3"><span [class]="getBadge(r.estado)">{{ r.estado }}</span></td>
              <td class="px-5 py-3 text-right">
                <button *ngIf="r.estado !== 'CANCELADA'" (click)="cancelar(r.id)"
                  class="text-xs transition-colors" style="color:#52525b;"
                  onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#52525b'">
                  Cancelar
                </button>
              </td>
            </tr>
            <tr *ngIf="reservas.length === 0">
              <td colspan="7" class="px-5 py-10 text-center text-xs" style="color:#52525b;">Conectando con ms-reservas...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReservasComponent implements OnInit {
  reservas: any[] = [];
  mostrarFormulario = false;
  mensaje = ''; mensajeExito = false;
  nuevaReserva: any = { nombrePasajero:'', dniPasajero:'', rutaId:null, busId:null, fechaViaje:'' };

  constructor(private reservasService: ReservasService) {}
  ngOnInit() { this.cargar(); }

  cargar() {
    this.reservasService.getReservas().subscribe({ next: (r: any) => this.reservas = r.datos || [], error: () => {} });
  }

  crearReserva() {
    this.reservasService.createReserva(this.nuevaReserva).subscribe({
      next: (r: any) => { this.mensaje = r.mensaje; this.mensajeExito = r.exito; if (r.exito) { this.nuevaReserva = { nombrePasajero:'',dniPasajero:'',rutaId:null,busId:null,fechaViaje:'' }; this.cargar(); } },
      error: (e: any) => { this.mensaje = e.error?.mensaje || 'Error al crear la reserva'; this.mensajeExito = false; }
    });
  }

  cancelar(id: number) {
    this.reservasService.cancelarReserva(id).subscribe({ next: () => this.cargar(), error: () => {} });
  }

  getBadge(estado: string) {
    const b = 'text-xs font-semibold px-2 py-0.5 rounded-full ';
    switch (estado?.toUpperCase()) {
      case 'CONFIRMADA': return b + 'text-emerald-400 bg-emerald-400/10';
      case 'PENDIENTE':  return b + 'text-amber-400 bg-amber-400/10';
      case 'CANCELADA':  return b + 'text-red-400 bg-red-400/10';
      default: return b + 'text-zinc-400 bg-zinc-400/10';
    }
  }
}
