import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlotaService } from '../../services/flota.service';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-7">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-xs font-medium tracking-widest uppercase mb-1.5" style="color:#8b5cf6;">Gestión</p>
          <h1 class="text-2xl font-bold text-white">Flota de Buses</h1>
          <p class="text-sm mt-1" style="color:#71717a;">{{ buses.length }} unidades registradas en el sistema</p>
        </div>
        <button (click)="mostrarFormulario = !mostrarFormulario"
          class="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all"
          style="background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); color:#a5b4fc;"
          onmouseover="this.style.background='rgba(99,102,241,0.25)'" onmouseout="this.style.background='rgba(99,102,241,0.15)'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Bus
        </button>
      </div>

      <!-- Formulario -->
      <div *ngIf="mostrarFormulario"
           class="rounded-xl border p-5"
           style="background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1);">
        <h3 class="text-sm font-semibold text-white mb-4">Registrar nuevo bus</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Placa</label>
            <input [(ngModel)]="nuevoBus.placa" placeholder="ABC-123"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); focus:ring-color:#6366f1;"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Modelo</label>
            <input [(ngModel)]="nuevoBus.modelo" placeholder="Scania Marcopolo"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color:#71717a;">Capacidad</label>
            <input [(ngModel)]="nuevoBus.capacidad" type="number" placeholder="50"
              class="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
              style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);"/>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-4">
          <button (click)="guardarBus()"
            class="text-sm font-medium px-5 py-2 rounded-lg text-white transition-all"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
            Guardar
          </button>
          <button (click)="mostrarFormulario=false"
            class="text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style="color:#71717a;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#71717a'">
            Cancelar
          </button>
          <span *ngIf="mensaje" class="text-xs ml-2" [style.color]="mensajeExito ? '#4ade80' : '#f87171'">{{ mensaje }}</span>
        </div>
      </div>

      <!-- Cards de buses -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let bus of buses"
             class="rounded-xl border p-5 transition-all hover:-translate-y-0.5"
             style="background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.08);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-base font-bold text-white">{{ bus.placa }}</p>
              <p class="text-xs mt-0.5" style="color:#71717a;">{{ bus.modelo }}</p>
            </div>
            <span [style.background]="bus.asientosDisponibles > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'"
                  [style.color]="bus.asientosDisponibles > 0 ? '#4ade80' : '#f87171'"
                  class="text-xs font-semibold px-2.5 py-1 rounded-full border"
                  [style.border-color]="bus.asientosDisponibles > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'">
              {{ bus.asientosDisponibles > 0 ? 'Disponible' : 'Lleno' }}
            </span>
          </div>
          <!-- Barra de asientos -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs" style="color:#52525b;">
              <span>Asientos disponibles</span>
              <span class="text-white font-medium">{{ bus.asientosDisponibles }}/{{ bus.capacidad }}</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" style="background:rgba(255,255,255,0.08);">
              <div class="h-full rounded-full transition-all"
                   [style.width.%]="(bus.asientosDisponibles / bus.capacidad) * 100"
                   [style.background]="bus.asientosDisponibles > bus.capacidad * 0.5
                     ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                     : bus.asientosDisponibles > 0
                       ? 'linear-gradient(90deg,#f59e0b,#f97316)'
                       : '#ef4444'">
              </div>
            </div>
          </div>
          <p class="text-xs mt-3" style="color:#52525b;">ID <span class="font-mono text-white">#{{ bus.id }}</span></p>
        </div>

        <div *ngIf="buses.length === 0"
             class="col-span-3 rounded-xl border p-12 text-center"
             style="background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.06);">
          <p class="text-sm" style="color:#52525b;">Conectando con ms-flota...</p>
        </div>
      </div>
    </div>
  `
})
export class FlotaComponent implements OnInit {
  buses: any[] = [];
  mostrarFormulario = false;
  mensaje = ''; mensajeExito = false;
  nuevoBus: any = { placa: '', modelo: '', capacidad: null };

  constructor(private flotaService: FlotaService) {}
  ngOnInit() { this.cargarBuses(); }

  cargarBuses() {
    this.flotaService.getBuses().subscribe({ next: (r: any) => this.buses = r.datos || [], error: () => {} });
  }

  guardarBus() {
    this.flotaService.createBus(this.nuevoBus).subscribe({
      next: (r: any) => { this.mensaje = r.mensaje; this.mensajeExito = r.exito; if (r.exito) { this.nuevoBus = { placa:'',modelo:'',capacidad:null }; this.cargarBuses(); } },
      error: (e: any) => { this.mensaje = e.error?.mensaje || 'Error al guardar'; this.mensajeExito = false; }
    });
  }
}
