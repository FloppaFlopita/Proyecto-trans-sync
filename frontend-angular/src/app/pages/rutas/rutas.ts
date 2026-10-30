import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';

interface RutaItem {
  id: number;
  origen: string;
  destino: string;
  horario: string;
  precio: number;
}

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Red Interprovincial
            </span>
            <span class="text-xs text-slate-500 font-medium">TransSync · Conexión Sur del Perú</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Catálogo de Rutas e Itinerarios
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
            Administre los corredores de transporte, horarios de salida programados y tarifas comerciales.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="cargarRutas()"
                  [disabled]="cargando"
                  class="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <svg class="w-4 h-4" [class.animate-spin]="cargando" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>

          <button (click)="abrirModalCrear()"
                  class="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Ruta
          </button>
        </div>
      </div>

      <!-- MÉTRICAS RÁPIDAS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rutas Operativas</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ rutas.length }}</p>
          <span class="inline-block mt-1 text-[11px] text-indigo-600 font-medium">Corredores activos</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tarifa Promedio</p>
          <p class="text-2xl font-black text-slate-900 mt-1">S/. {{ calcularTarifaPromedio() }}</p>
          <span class="inline-block mt-1 text-[11px] text-emerald-600 font-medium">Precio estándar</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tarifa Mínima</p>
          <p class="text-2xl font-black text-slate-900 mt-1">S/. {{ calcularTarifaMinima() }}</p>
          <span class="inline-block mt-1 text-[11px] text-blue-600 font-medium">Boleto económico</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Destinos Cubiertos</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ calcularTotalDestinos() }}</p>
          <span class="inline-block mt-1 text-[11px] text-purple-600 font-medium">Ciudades del Perú</span>
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
                 placeholder="Filtrar por origen, destino u horario (ej. Arequipa, Lima, Cusco)..."
                 class="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 bg-slate-50/50">
        </div>
        <button *ngIf="filtroTexto"
                (click)="filtroTexto = ''"
                class="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1">
          Limpiar filtro
        </button>
      </div>

      <!-- MENSAJE DE ERROR CON BOTÓN DE REINTENTAR -->
      <div *ngIf="errorMensaje"
           class="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-xs sm:text-sm font-medium">{{ errorMensaje }}</p>
        </div>
        <button (click)="cargarRutas()" class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>

      <!-- ESTADO DE CARGA -->
      <div *ngIf="cargando" class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm font-bold text-slate-700">Cargando catálogo de rutas...</p>
        <p class="text-xs text-slate-500 mt-1">Consultando servicio ms-rutas vía API Gateway</p>
      </div>

      <!-- GRILLA DE RUTAS -->
      <div *ngIf="!cargando && rutasFiltradas.length > 0"
           class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let r of rutasFiltradas"
             class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between">
          <div>
            <!-- Header con ID y Estado -->
            <div class="flex items-center justify-between mb-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Ruta #{{ r.id }}
              </span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operativo
              </span>
            </div>

            <!-- Visualizador Origen -> Destino -->
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-slate-400 font-medium">Origen</span>
                <span class="text-slate-400 font-medium">Destino</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-black text-slate-900 truncate">{{ r.origen }}</p>
                <div class="flex-1 flex items-center justify-center">
                  <div class="w-full h-px bg-slate-300"></div>
                  <svg class="w-4 h-4 text-indigo-500 flex-shrink-0 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                  <div class="w-full h-px bg-slate-300"></div>
                </div>
                <p class="text-sm font-black text-slate-900 truncate text-right">{{ r.destino }}</p>
              </div>
            </div>

            <!-- Info Horario y Tarifa -->
            <div class="grid grid-cols-2 gap-2 text-xs mb-4">
              <div class="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                <p class="text-[10px] text-slate-500 font-semibold uppercase">Horario Salida</p>
                <div class="flex items-center gap-1.5 mt-0.5 font-bold text-slate-800">
                  <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ r.horario }}
                </div>
              </div>
              <div class="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                <p class="text-[10px] text-emerald-700 font-semibold uppercase">Tarifa Pasaje</p>
                <p class="text-sm font-black text-emerald-700 mt-0.5">S/. {{ r.precio?.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Acciones de la Ruta -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button (click)="comprarEnRuta(r)"
                    class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
              Reservar Boletos
            </button>

            <button (click)="abrirModalEditar(r)"
                    title="Editar Ruta"
                    class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>

            <button (click)="eliminarRuta(r.id)"
                    title="Eliminar Ruta"
                    class="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ESTADO VACÍO -->
      <div *ngIf="!cargando && rutasFiltradas.length === 0"
           class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-900">No se encontraron rutas</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {{ filtroTexto ? 'No hay resultados que coincidan con su búsqueda.' : 'Aún no hay rutas registradas en el sistema. Registre la primera con el botón superior.' }}
        </p>
      </div>

      <!-- MODAL CREAR / EDITAR RUTA -->
      <div *ngIf="mostrarModal"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">
                {{ modoEdicion ? 'Modificar Ruta #' + rutaFormulario.id : 'Registrar Nueva Ruta' }}
              </h3>
              <p class="text-xs text-slate-500">Parámetros del corredor interprovincial</p>
            </div>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ciudad de Origen</label>
              <input [(ngModel)]="rutaFormulario.origen"
                     placeholder="Ej. Lima, Arequipa, Cusco..."
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ciudad de Destino</label>
              <input [(ngModel)]="rutaFormulario.destino"
                     placeholder="Ej. Puno, Tacna, Moquegua..."
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Horario de Salida</label>
                <input [(ngModel)]="rutaFormulario.horario"
                       placeholder="Ej. 20:30 hrs"
                       class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Precio Boleto (S/.)</label>
                <input [(ngModel)]="rutaFormulario.precio"
                       type="number"
                       step="0.5"
                       placeholder="Ej. 85.00"
                       class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModal()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="guardarRuta()"
                    [disabled]="guardando || !formularioValido()"
                    class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50">
              {{ guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar Ruta' : 'Crear Ruta') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class RutasComponent implements OnInit {
  rutas: RutaItem[] = [];
  cargando = false;
  errorMensaje = '';
  filtroTexto = '';

  mostrarModal = false;
  modoEdicion = false;
  guardando = false;
  rutaFormulario: any = { id: null, origen: '', destino: '', horario: '', precio: null };

  constructor(
    private rutasService: RutasService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarRutas();
  }

  cargarRutas() {
    this.cargando = true;
    this.errorMensaje = '';
    this.rutasService.getRutas().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.rutas = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.errorMensaje = 'No se pudo conectar con ms-rutas. Verifique que el servicio esté activo.';
        this.cdr.detectChanges();
      }
    });
  }

  get rutasFiltradas(): RutaItem[] {
    if (!this.filtroTexto.trim()) return this.rutas;
    const q = this.filtroTexto.toLowerCase();
    return this.rutas.filter(r =>
      (r.origen && r.origen.toLowerCase().includes(q)) ||
      (r.destino && r.destino.toLowerCase().includes(q)) ||
      (r.horario && r.horario.toLowerCase().includes(q))
    );
  }

  calcularTarifaPromedio(): string {
    if (this.rutas.length === 0) return '0.00';
    const sum = this.rutas.reduce((acc, r) => acc + (r.precio || 0), 0);
    return (sum / this.rutas.length).toFixed(2);
  }

  calcularTarifaMinima(): string {
    if (this.rutas.length === 0) return '0.00';
    const min = Math.min(...this.rutas.map(r => r.precio || 0));
    return min.toFixed(2);
  }

  calcularTotalDestinos(): number {
    const destinos = new Set(this.rutas.map(r => r.destino));
    return destinos.size;
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.rutaFormulario = { id: null, origen: '', destino: '', horario: '08:00 hrs', precio: 50.0 };
    this.mostrarModal = true;
  }

  abrirModalEditar(ruta: RutaItem) {
    this.modoEdicion = true;
    this.rutaFormulario = { ...ruta };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  formularioValido(): boolean {
    return !!(this.rutaFormulario.origen?.trim() &&
              this.rutaFormulario.destino?.trim() &&
              this.rutaFormulario.horario?.trim() &&
              this.rutaFormulario.precio > 0);
  }

  guardarRuta() {
    if (!this.formularioValido()) return;
    this.guardando = true;

    if (this.modoEdicion && this.rutaFormulario.id) {
      this.rutasService.updateRuta(this.rutaFormulario.id, this.rutaFormulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarRutas();
        },
        error: (err: any) => {
          this.guardando = false;
          alert('Error al actualizar ruta: ' + (err.error?.mensaje || err.message));
        }
      });
    } else {
      this.rutasService.createRuta(this.rutaFormulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.cargarRutas();
        },
        error: (err: any) => {
          this.guardando = false;
          alert('Error al crear ruta: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }

  eliminarRuta(id: number) {
    if (confirm(`¿Está seguro de eliminar la ruta #${id}?`)) {
      this.rutasService.deleteRuta(id).subscribe({
        next: () => {
          this.cargarRutas();
        },
        error: (err: any) => {
          alert('Error al eliminar ruta: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }

  comprarEnRuta(ruta: RutaItem) {
    this.router.navigate(['/reservas'], { queryParams: { rutaId: ruta.id } });
  }
}
