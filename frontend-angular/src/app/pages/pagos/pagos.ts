import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-7">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-xs font-medium tracking-widest uppercase mb-1.5" style="color:#10b981;">Gestión</p>
          <h1 class="text-2xl font-bold text-white">Pagos</h1>
          <p class="text-sm mt-1" style="color:#71717a;">{{ pagos.length }} transacciones registradas</p>
        </div>
        <button (click)="mostrarFormulario = !mostrarFormulario"
          class="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all"
          style="background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.35); color:#34d399;">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Registrar Pago
        </button>
      </div>

      <!-- Formulario -->
      <div *ngIf="mostrarFormulario"
           class="rounded-xl border p-5"
           style="background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1);">
        <h3 class="text-sm font-semibold text-white mb-4">Registrar nuevo pago</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">ID Reserva</label>
            <input [(ngModel)]="nuevoPago.reservaId" type="number" placeholder="1"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Monto (S/.)</label>
            <input [(ngModel)]="nuevoPago.monto" type="number" placeholder="45.50"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Método</label>
            <select [(ngModel)]="nuevoPago.metodoPago"
              class="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color-scheme:dark;">
              <option value="" style="background:#1a1a2e;">Seleccionar...</option>
              <option value="EFECTIVO" style="background:#1a1a2e;">Efectivo</option>
              <option value="TARJETA" style="background:#1a1a2e;">Tarjeta</option>
              <option value="YAPE" style="background:#1a1a2e;">Yape</option>
              <option value="PLIN" style="background:#1a1a2e;">Plin</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-4">
          <button (click)="registrar()"
            class="text-sm font-medium px-5 py-2 rounded-lg text-white"
            style="background:linear-gradient(135deg,#10b981,#059669);">
            Registrar
          </button>
          <button (click)="mostrarFormulario=false" class="text-sm px-4 py-2 rounded-lg" style="color:#71717a;">Cancelar</button>
          <span *ngIf="mensaje" class="text-xs ml-2" [style.color]="mensajeExito ? '#4ade80' : '#f87171'">{{ mensaje }}</span>
        </div>
      </div>

      <!-- Tabla -->
      <div class="rounded-xl border overflow-hidden" style="background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08);">
        <table class="w-full text-sm">
          <thead>
            <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">ID</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Reserva</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Monto</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Método</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Fecha</th>
              <th class="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style="color:#52525b;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pagos; let odd = odd"
                [style.background]="odd ? 'rgba(255,255,255,0.015)' : 'transparent'"
                class="border-b transition-colors hover:bg-white/5"
                style="border-color:rgba(255,255,255,0.05);">
              <td class="px-5 py-3 font-mono text-xs" style="color:#52525b;">#{{ p.id }}</td>
              <td class="px-5 py-3 text-xs" style="color:#71717a;">Reserva <span class="text-white">#{{ p.reservaId }}</span></td>
              <td class="px-5 py-3">
                <span class="text-white font-bold text-sm">S/. {{ p.monto?.toFixed(2) }}</span>
              </td>
              <td class="px-5 py-3">
                <span class="text-xs font-medium px-2.5 py-1 rounded-lg"
                      style="background:rgba(255,255,255,0.07); color:#a1a1aa;">{{ p.metodoPago }}</span>
              </td>
              <td class="px-5 py-3 text-xs" style="color:#71717a;">{{ p.fechaPago | date:'dd/MM/yy HH:mm' }}</td>
              <td class="px-5 py-3"><span [class]="getBadge(p.estado)">{{ p.estado }}</span></td>
            </tr>
            <tr *ngIf="pagos.length === 0">
              <td colspan="6" class="px-5 py-10 text-center text-xs" style="color:#52525b;">Conectando con ms-pagos...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PagosComponent implements OnInit {
  pagos: any[] = [];
  mostrarFormulario = false;
  mensaje = ''; mensajeExito = false;
  nuevoPago: any = { reservaId: null, monto: null, metodoPago: '' };

  constructor(private pagosService: PagosService) {}
  ngOnInit() { this.cargar(); }

  cargar() {
    this.pagosService.getPagos().subscribe({ next: (r: any) => this.pagos = r.datos || [], error: () => {} });
  }

  registrar() {
    this.pagosService.createPago(this.nuevoPago).subscribe({
      next: (r: any) => { this.mensaje = r.mensaje; this.mensajeExito = r.exito; if (r.exito) { this.nuevoPago = { reservaId:null,monto:null,metodoPago:'' }; this.cargar(); } },
      error: (e: any) => { this.mensaje = e.error?.mensaje || 'Error'; this.mensajeExito = false; }
    });
  }

  getBadge(estado: string) {
    const b = 'text-xs font-semibold px-2 py-0.5 rounded-full ';
    switch (estado?.toUpperCase()) {
      case 'COMPLETADO': return b + 'text-emerald-400 bg-emerald-400/10';
      case 'PENDIENTE':  return b + 'text-amber-400 bg-amber-400/10';
      case 'RECHAZADO':  return b + 'text-red-400 bg-red-400/10';
      default: return b + 'text-zinc-400 bg-zinc-400/10';
    }
  }
}
