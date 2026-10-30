import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface PromocionItem {
  id: number;
  titulo: string;
  descripcion: string;
  descuento: number;
  codigo?: string;
  rutaAplica?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
}

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO PRINCIPAL -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              Beneficios Comerciales
            </span>
            <span class="text-xs text-slate-500 font-medium">TransSync · Tarifas Especiales</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Promociones y Descuentos Exclusivos
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
            Aproveche tarifas preferenciales en corredores interprovinciales y bonificaciones del programa de fidelización.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="cargarPromociones()"
                  [disabled]="cargando"
                  class="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <svg class="w-4 h-4" [class.animate-spin]="cargando" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>

          <button (click)="irAReservas()"
                  class="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-600/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Comprar con Promoción
          </button>
        </div>
      </div>

      <!-- TARJETAS DE INDICADORES -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Promociones Activas</span>
          <span class="text-2xl font-black text-slate-900 mt-1 block">{{ promociones.length }}</span>
          <span class="text-[11px] text-teal-600 font-medium">Vigentes para viajes 2026</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Descuento Máximo</span>
          <span class="text-2xl font-black text-teal-700 mt-1 block">Hasta 20%</span>
          <span class="text-[11px] text-slate-500">En rutas seleccionadas</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Bonificación Grupal</span>
          <span class="text-2xl font-black text-indigo-700 mt-1 block">+5 Puntos</span>
          <span class="text-[11px] text-slate-500">Al comprar 3 o más asientos</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Puntos por Pasaje</span>
          <span class="text-2xl font-black text-emerald-700 mt-1 block">1 a 2 Pts</span>
          <span class="text-[11px] text-emerald-600 font-medium">Para usuarios registrados</span>
        </div>
      </div>

      <!-- LISTADO DE TARJETAS DE PROMOCIÓN -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let promo of promociones"
             class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div class="p-6 space-y-4">
            <!-- Badge de descuento y estado -->
            <div class="flex items-center justify-between">
              <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                {{ promo.descuento }}% DSCTO
              </span>
              <span class="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Vigente
              </span>
            </div>

            <!-- Título y Descripción -->
            <div>
              <h3 class="text-lg font-bold text-slate-900 leading-tight">
                {{ promo.titulo }}
              </h3>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed">
                {{ promo.descripcion }}
              </p>
            </div>

            <!-- Información Complementaria -->
            <div class="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div *ngIf="promo.rutaAplica" class="flex justify-between">
                <span class="text-slate-500">Ruta aplicable:</span>
                <span class="font-semibold text-slate-800">{{ promo.rutaAplica }}</span>
              </div>
              <div *ngIf="promo.codigo" class="flex justify-between items-center">
                <span class="text-slate-500">Código promocional:</span>
                <span class="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {{ promo.codigo }}
                </span>
              </div>
              <div *ngIf="promo.fechaFin" class="flex justify-between">
                <span class="text-slate-500">Válido hasta:</span>
                <span class="font-medium text-slate-700">{{ promo.fechaFin }}</span>
              </div>
            </div>
          </div>

          <!-- Pie con Botón de Acción -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] text-slate-500">Aplique al reservar</span>
            <button (click)="aplicarPromocion(promo)"
                    class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm">
              Usar Promoción
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class PromocionesComponent implements OnInit {
  promociones: PromocionItem[] = [];
  cargando = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPromociones();
  }

  cargarPromociones(): void {
    this.cargando = true;
    this.http.get<any>('http://localhost:8100/api/promociones').subscribe({
      next: (resp) => {
        if (resp && resp.datos && Array.isArray(resp.datos) && resp.datos.length > 0) {
          this.promociones = resp.datos.map((p: any) => ({
            id: p.id,
            titulo: p.titulo,
            descripcion: p.descripcion,
            descuento: p.descuento || 15,
            codigo: 'PROMO-' + p.id,
            rutaAplica: 'Todas las rutas',
            fechaFin: p.fechaFin || '31/12/2026',
            activo: p.activo ?? true
          }));
        } else {
          this.usarPromocionesPorDefecto();
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usarPromocionesPorDefecto();
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private usarPromocionesPorDefecto(): void {
    this.promociones = [
      {
        id: 1,
        titulo: 'Tarifa Especial: Juliaca - Cusco',
        descripcion: 'Ahorre en sus traslados interprovinciales nocturnos con asientos reclinables estándar.',
        descuento: 20,
        codigo: 'CUSCO20',
        rutaAplica: 'Juliaca - Cusco',
        fechaFin: '30/11/2026',
        activo: true
      },
      {
        id: 2,
        titulo: 'Viaje Grupal / Familiar',
        descripcion: 'Compre 3 o más asientos y reciba 5 puntos de fidelización directos más 10% de descuento.',
        descuento: 10,
        codigo: 'FAMILIA3',
        rutaAplica: 'Todas las rutas',
        fechaFin: '31/12/2026',
        activo: true
      },
      {
        id: 3,
        titulo: 'Corredor Cusco - Arequipa',
        descripcion: 'Tarifa corporativa y turística con seguro de viaje incluido y servicio directo.',
        descuento: 15,
        codigo: 'AQP15',
        rutaAplica: 'Cusco - Arequipa',
        fechaFin: '31/12/2026',
        activo: true
      },
      {
        id: 4,
        titulo: 'Bienvenida Pasajero Nuevo',
        descripcion: 'Regístrese con su correo electrónico y acumule puntos desde su primer viaje.',
        descuento: 10,
        codigo: 'BIENVENIDO10',
        rutaAplica: 'Todas las rutas',
        fechaFin: '31/12/2026',
        activo: true
      }
    ];
  }

  aplicarPromocion(promo: PromocionItem): void {
    localStorage.setItem('transync_promo_activa', JSON.stringify(promo));
    this.router.navigate(['/reservas']);
  }

  irAReservas(): void {
    this.router.navigate(['/reservas']);
  }
}

