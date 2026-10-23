import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-7">
      <div>
        <p class="text-xs font-medium tracking-widest uppercase mb-1.5" style="color:#6366f1;">Gestión</p>
        <h1 class="text-2xl font-bold text-white">Rutas</h1>
        <p class="text-sm mt-1" style="color:#71717a;">{{ rutas.length }} rutas operativas · Región sur del Perú</p>
      </div>

      <!-- Cards de rutas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let r of rutas; let i = index"
             class="rounded-xl border p-5 transition-all hover:-translate-y-0.5 cursor-default"
             style="background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.08);">
          <!-- Header ruta -->
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs font-mono px-2 py-0.5 rounded" style="background:rgba(99,102,241,0.15); color:#a5b4fc;">#{{ r.id }}</span>
          </div>
          <!-- Origen → Destino -->
          <div class="flex items-center gap-3 mb-4">
            <div class="text-center">
              <div class="w-2.5 h-2.5 rounded-full mx-auto mb-1" style="background:#6366f1;"></div>
              <p class="text-xs font-semibold text-white">{{ r.origen }}</p>
            </div>
            <div class="flex-1 flex items-center gap-1">
              <div class="flex-1 h-px" style="background:rgba(255,255,255,0.1);"></div>
              <svg class="w-3 h-3 flex-shrink-0" style="color:#52525b;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              <div class="flex-1 h-px" style="background:rgba(255,255,255,0.1);"></div>
            </div>
            <div class="text-center">
              <div class="w-2.5 h-2.5 rounded-full mx-auto mb-1" style="background:#10b981;"></div>
              <p class="text-xs font-semibold text-white">{{ r.destino }}</p>
            </div>
          </div>
          <!-- Info -->
          <div class="flex items-center justify-between pt-3" style="border-top:1px solid rgba(255,255,255,0.06);">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" style="color:#52525b;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-xs" style="color:#71717a;">{{ r.horario }}</span>
            </div>
            <span class="text-sm font-bold" style="color:#4ade80;">S/. {{ r.precio?.toFixed(2) }}</span>
          </div>
        </div>

        <div *ngIf="rutas.length === 0"
             class="col-span-3 rounded-xl border p-12 text-center"
             style="background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.06);">
          <p class="text-sm" style="color:#52525b;">Conectando con ms-rutas...</p>
        </div>
      </div>
    </div>
  `
})
export class RutasComponent implements OnInit {
  rutas: any[] = [];

  constructor(private rutasService: RutasService) {}

  ngOnInit() {
    this.rutasService.getRutas().subscribe({ next: (r: any) => this.rutas = r.datos || [], error: () => {} });
  }
}
