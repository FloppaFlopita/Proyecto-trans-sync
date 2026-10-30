import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlotaService } from '../../services/flota.service';

interface BusItem {
  id: number;
  placa: string;
  modelo: string;
  capacidad: number;
  asientosDisponibles: number;
}

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800">
              Gestión Vehicular
            </span>
            <span class="text-xs text-slate-500 font-medium">TransSync · Monitoreo y Capacidad</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Control de Flota y Autobuses
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
            Supervise la disponibilidad de asientos en tiempo real, registro de unidades y estado operativo.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="cargarBuses()"
                  [disabled]="cargando"
                  class="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <svg class="w-4 h-4" [class.animate-spin]="cargando" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>

          <button (click)="abrirModalCrear()"
                  class="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md shadow-violet-600/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo Autobús
          </button>
        </div>
      </div>

      <!-- MÉTRICAS RÁPIDAS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unidades Activas</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ buses.length }}</p>
          <span class="inline-block mt-1 text-[11px] text-violet-600 font-medium">Buses en servicio</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capacidad Total</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ calcularCapacidadTotal() }}</p>
          <span class="inline-block mt-1 text-[11px] text-blue-600 font-medium">Asientos instalados</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Asientos Libres</p>
          <p class="text-2xl font-black text-emerald-600 mt-1">{{ calcularAsientosLibres() }}</p>
          <span class="inline-block mt-1 text-[11px] text-emerald-700 font-medium">Disponibles para venta</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">% Ocupación Global</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ calcularPorcentajeOcupacion() }}%</p>
          <span class="inline-block mt-1 text-[11px] text-amber-600 font-medium">Boletos vendidos</span>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTROS -->
      <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input [(ngModel)]="filtroTexto"
                 type="text"
                 placeholder="Filtrar por placa o modelo (ej. ABC-123, Scania, Volvo, Irizar)..."
                 class="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-800 placeholder-slate-400 bg-slate-50/50">
        </div>
        <button *ngIf="filtroTexto"
                (click)="filtroTexto = ''"
                class="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1">
          Limpiar filtro
        </button>
      </div>

      <!-- MENSAJE DE ERROR -->
      <div *ngIf="errorMensaje"
           class="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-xs sm:text-sm font-medium">{{ errorMensaje }}</p>
        </div>
        <button (click)="cargarBuses()" class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>

      <!-- ESTADO DE CARGA -->
      <div *ngIf="cargando" class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm font-bold text-slate-700">Cargando unidades vehiculares...</p>
        <p class="text-xs text-slate-500 mt-1">Consultando servicio ms-flota vía API Gateway</p>
      </div>

      <!-- GRILLA DE BUSES -->
      <div *ngIf="!cargando && busesFiltrados.length > 0"
           class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let b of busesFiltrados"
             class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all flex flex-col justify-between">
          <div>
            <!-- Header con Placa y Estado -->
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 mb-1">
                  Bus ID #{{ b.id }}
                </span>
                <p class="text-lg font-black text-slate-900 tracking-tight">{{ b.placa }}</p>
                <p class="text-xs text-slate-500">{{ b.modelo }}</p>
              </div>

              <span [class]="b.asientosDisponibles > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'"
                    class="text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5">
                <span [class]="b.asientosDisponibles > 0 ? 'bg-emerald-500' : 'bg-red-500'" class="w-1.5 h-1.5 rounded-full"></span>
                {{ b.asientosDisponibles > 0 ? 'Disponible (' + b.asientosDisponibles + ')' : 'Lleno (0)' }}
              </span>
            </div>

            <!-- Ocupación visual y barra de progreso -->
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 my-4 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 font-medium">Asientos Disponibles</span>
                <span class="font-bold text-slate-900">{{ b.asientosDisponibles }} / {{ b.capacidad }}</span>
              </div>
              <div class="h-2 rounded-full overflow-hidden bg-slate-200">
                <div class="h-full rounded-full transition-all duration-300"
                     [style.width.%]="(b.asientosDisponibles / b.capacidad) * 100"
                     [class]="(b.asientosDisponibles / b.capacidad) > 0.4 ? 'bg-emerald-500' : (b.asientosDisponibles > 0 ? 'bg-amber-500' : 'bg-red-500')">
                </div>
              </div>
              <div class="flex items-center justify-between text-[11px] text-slate-400">
                <span>{{ ((b.asientosDisponibles / b.capacidad) * 100) | number:'1.0-0' }}% Libre</span>
                <span>{{ (((b.capacidad - b.asientosDisponibles) / b.capacidad) * 100) | number:'1.0-0' }}% Ocupado</span>
              </div>
            </div>
          </div>

          <!-- Acciones del Bus -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button (click)="reiniciarBus(b)"
                    title="Reiniciar asientos al 100% de capacidad para pruebas"
                    class="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-2 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Reiniciar Bus
            </button>

            <button (click)="abrirModalEditar(b)"
                    title="Editar Bus"
                    class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>

            <button (click)="eliminarBus(b.id)"
                    title="Eliminar Bus"
                    class="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ESTADO VACÍO -->
      <div *ngIf="!cargando && busesFiltrados.length === 0"
           class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-900">No se encontraron autobuses</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {{ filtroTexto ? 'No hay vehículos que coincidan con su filtro.' : 'Aún no hay buses registrados en la flota. Agregue uno con el botón superior.' }}
        </p>
      </div>

      <!-- MODAL CREAR / EDITAR BUS -->
      <div *ngIf="mostrarModal"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">
                {{ modoEdicion ? 'Modificar Autobús #' + busFormulario.id : 'Registrar Nuevo Autobús' }}
              </h3>
              <p class="text-xs text-slate-500">Datos técnicos del vehículo interprovincial</p>
            </div>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Placa Oficial</label>
              <input [(ngModel)]="busFormulario.placa"
                     placeholder="Ej. ABC-123"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono uppercase">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Modelo / Fabricante</label>
              <input [(ngModel)]="busFormulario.modelo"
                     placeholder="Ej. Scania Marcopolo G7, Volvo Irizar i8..."
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Capacidad Total de Asientos</label>
              <input [(ngModel)]="busFormulario.capacidad"
                     type="number"
                     placeholder="Ej. 40, 50"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModal()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="guardarBus()"
                    [disabled]="guardando || !formularioValido()"
                    class="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-all shadow-md shadow-violet-600/20 disabled:opacity-50">
              {{ guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar Bus' : 'Registrar Bus') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class FlotaComponent implements OnInit {
  buses: BusItem[] = [];
  cargando = false;
  errorMensaje = '';
  filtroTexto = '';

  mostrarModal = false;
  modoEdicion = false;
  guardando = false;
  busFormulario: any = { id: null, placa: '', modelo: '', capacidad: 40, asientosDisponibles: 40 };

  constructor(
    private flotaService: FlotaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarBuses();
  }

  cargarBuses() {
    this.cargando = true;
    this.errorMensaje = '';
    this.flotaService.getBuses().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.buses = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.errorMensaje = 'No se pudo conectar con ms-flota. Verifique que el servicio esté activo.';
        this.cdr.detectChanges();
      }
    });
  }

  get busesFiltrados(): BusItem[] {
    if (!this.filtroTexto.trim()) return this.buses;
    const q = this.filtroTexto.toLowerCase();
    return this.buses.filter(b =>
      (b.placa && b.placa.toLowerCase().includes(q)) ||
      (b.modelo && b.modelo.toLowerCase().includes(q))
    );
  }

  calcularCapacidadTotal(): number {
    return this.buses.reduce((acc, b) => acc + (b.capacidad || 0), 0);
  }

  calcularAsientosLibres(): number {
    return this.buses.reduce((acc, b) => acc + (b.asientosDisponibles || 0), 0);
  }

  calcularPorcentajeOcupacion(): number {
    const total = this.calcularCapacidadTotal();
    if (total === 0) return 0;
    const libres = this.calcularAsientosLibres();
    const ocupados = total - libres;
    return Math.round((ocupados / total) * 100);
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.busFormulario = { id: null, placa: '', modelo: '', capacidad: 40 };
    this.mostrarModal = true;
  }

  abrirModalEditar(bus: BusItem) {
    this.modoEdicion = true;
    this.busFormulario = { ...bus };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  formularioValido(): boolean {
    return !!(this.busFormulario.placa?.trim() &&
              this.busFormulario.modelo?.trim() &&
              this.busFormulario.capacidad > 0);
  }

  guardarBus() {
    if (!this.formularioValido()) return;
    this.guardando = true;

    if (this.modoEdicion && this.busFormulario.id) {
      this.flotaService.updateBus(this.busFormulario.id, this.busFormulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarBuses();
        },
        error: (err: any) => {
          this.guardando = false;
          alert('Error al actualizar bus: ' + (err.error?.mensaje || err.message));
        }
      });
    } else {
      const nuevo = {
        placa: this.busFormulario.placa.toUpperCase(),
        modelo: this.busFormulario.modelo,
        capacidad: this.busFormulario.capacidad,
        asientosDisponibles: this.busFormulario.capacidad
      };
      this.flotaService.createBus(nuevo).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarBuses();
        },
        error: (err: any) => {
          this.guardando = false;
          alert('Error al registrar bus: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }

  reiniciarBus(bus: BusItem) {
    if (confirm(`¿Desea reiniciar todos los asientos del Bus ${bus.placa} (#${bus.id}) a 0% de ocupación?`)) {
      const datosActualizados = {
        ...bus,
        asientosDisponibles: bus.capacidad
      };
      this.flotaService.updateBus(bus.id, datosActualizados).subscribe({
        next: () => {
          this.cargarBuses();
        },
        error: (err: any) => {
          alert('Error al reiniciar asientos: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }

  eliminarBus(id: number) {
    if (confirm(`¿Está seguro de eliminar el autobús #${id}?`)) {
      this.flotaService.deleteBus(id).subscribe({
        next: () => {
          this.cargarBuses();
        },
        error: (err: any) => {
          alert('Error al eliminar bus: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }
}
