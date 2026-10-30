import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../services/pagos.service';

interface PagoItem {
  id: number;
  reservaId: number;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaPago: string;
}

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Pasarela y Recaudación
            </span>
            <span class="text-xs text-slate-500 font-medium">TransSync · Conciliación Bancaria</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Pagos y Transacciones
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
            Registro de cobros electrónicos por pasajes, billeteras digitales y efectivo en ventanilla.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="cargarPagos()"
                  [disabled]="cargando"
                  class="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <svg class="w-4 h-4" [class.animate-spin]="cargando" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>

          <button (click)="abrirModalCrear()"
                  class="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Registrar Pago
          </button>
        </div>
      </div>

      <!-- MÉTRICAS RÁPIDAS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Recaudado</p>
          <p class="text-2xl font-black text-emerald-600 mt-1">S/. {{ calcularTotalRecaudado() }}</p>
          <span class="inline-block mt-1 text-[11px] text-emerald-700 font-medium">Ingresos totales</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transacciones</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ pagos.length }}</p>
          <span class="inline-block mt-1 text-[11px] text-blue-600 font-medium">Operaciones registradas</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cobros Exitosos</p>
          <p class="text-2xl font-black text-indigo-600 mt-1">{{ contarCompletados() }}</p>
          <span class="inline-block mt-1 text-[11px] text-indigo-700 font-medium">Estado completado</span>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
          <p class="text-2xl font-black text-slate-900 mt-1">S/. {{ calcularTicketPromedio() }}</p>
          <span class="inline-block mt-1 text-[11px] text-amber-600 font-medium">Por boleto emitido</span>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTROS -->
      <div class="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <div class="relative flex-1 w-full">
            <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input [(ngModel)]="filtroTexto"
                   type="text"
                   placeholder="Buscar por ID de pago o # de reserva (ej. 1, 2, 3)..."
                   class="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 bg-slate-50/50">
          </div>

          <div class="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button (click)="filtroMetodo = 'TODOS'"
                    [class]="filtroMetodo === 'TODOS' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap">
              Todos
            </button>
            <button (click)="filtroMetodo = 'YAPE'"
                    [class]="filtroMetodo === 'YAPE' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap">
              Yape
            </button>
            <button (click)="filtroMetodo = 'PLIN'"
                    [class]="filtroMetodo === 'PLIN' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap">
              Plin
            </button>
            <button (click)="filtroMetodo = 'TARJETA'"
                    [class]="filtroMetodo === 'TARJETA' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap">
              Tarjeta
            </button>
            <button (click)="filtroMetodo = 'EFECTIVO'"
                    [class]="filtroMetodo === 'EFECTIVO' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap">
              Efectivo
            </button>
          </div>
        </div>
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
        <button (click)="cargarPagos()" class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>

      <!-- ESTADO DE CARGA -->
      <div *ngIf="cargando" class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm font-bold text-slate-700">Cargando registros de pagos...</p>
        <p class="text-xs text-slate-500 mt-1">Consultando servicio ms-pagos vía API Gateway</p>
      </div>

      <!-- TABLA DE PAGOS -->
      <div *ngIf="!cargando && pagosFiltrados.length > 0"
           class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th class="px-5 py-3.5">ID Transacción</th>
                <th class="px-5 py-3.5">Reserva Vinculada</th>
                <th class="px-5 py-3.5">Monto Pagado</th>
                <th class="px-5 py-3.5">Método de Cobro</th>
                <th class="px-5 py-3.5">Fecha y Hora</th>
                <th class="px-5 py-3.5">Estado Operación</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let p of pagosFiltrados" class="hover:bg-slate-50/70 transition-colors">
                <td class="px-5 py-3.5 font-mono font-bold text-slate-900">
                  #TRX-{{ p.id }}
                </td>
                <td class="px-5 py-3.5 font-medium text-slate-700">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-100">
                    Reserva #{{ p.reservaId }}
                  </span>
                </td>
                <td class="px-5 py-3.5 font-black text-slate-900 text-sm">
                  S/. {{ p.monto?.toFixed(2) }}
                </td>
                <td class="px-5 py-3.5">
                  <span [class]="getMetodoBadge(p.metodoPago)" class="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase inline-flex items-center gap-1">
                    {{ p.metodoPago }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-500 font-medium">
                  {{ p.fechaPago ? (p.fechaPago | date:'dd/MM/yyyy HH:mm') : 'Reciente' }}
                </td>
                <td class="px-5 py-3.5">
                  <span [class]="getEstadoBadge(p.estado)" class="px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5">
                    <span [class]="p.estado === 'COMPLETADO' ? 'bg-emerald-500' : 'bg-amber-500'" class="w-1.5 h-1.5 rounded-full"></span>
                    {{ p.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ESTADO VACÍO -->
      <div *ngIf="!cargando && pagosFiltrados.length === 0"
           class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-900">No se registraron transacciones</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {{ filtroTexto || filtroMetodo !== 'TODOS' ? 'No hay pagos que coincidan con sus filtros.' : 'Aún no se han procesado cobros en la plataforma.' }}
        </p>
      </div>

      <!-- MODAL REGISTRAR PAGO -->
      <div *ngIf="mostrarModal"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">Registrar Cobro Manual</h3>
              <p class="text-xs text-slate-500">Conciliación de boleto en ventanilla o caja</p>
            </div>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">ID de Reserva Asociada</label>
              <input [(ngModel)]="pagoFormulario.reservaId"
                     type="number"
                     placeholder="Ej. 1"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Monto a Cobrar (S/.)</label>
              <input [(ngModel)]="pagoFormulario.monto"
                     type="number"
                     step="0.5"
                     placeholder="Ej. 45.00"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Método de Pago</label>
              <select [(ngModel)]="pagoFormulario.metodoPago"
                      class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="EFECTIVO">Efectivo (Ventanilla)</option>
                <option value="YAPE">Yape (Billetera BCP)</option>
                <option value="PLIN">Plin (Interbank / BBVA / Scotiabank)</option>
                <option value="TARJETA">Tarjeta Débito / Crédito (POS)</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModal()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="guardarPago()"
                    [disabled]="guardando || !formularioValido()"
                    class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50">
              {{ guardando ? 'Procesando...' : 'Registrar Pago' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class PagosComponent implements OnInit {
  pagos: PagoItem[] = [];
  cargando = false;
  errorMensaje = '';
  filtroTexto = '';
  filtroMetodo = 'TODOS';

  mostrarModal = false;
  guardando = false;
  pagoFormulario: any = { reservaId: null, monto: null, metodoPago: 'EFECTIVO' };

  constructor(
    private pagosService: PagosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPagos();
  }

  cargarPagos() {
    this.cargando = true;
    this.errorMensaje = '';
    this.pagosService.getPagos().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.pagos = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.errorMensaje = 'No se pudo conectar con ms-pagos. Verifique que el servicio esté activo.';
        this.cdr.detectChanges();
      }
    });
  }

  get pagosFiltrados(): PagoItem[] {
    let list = [...this.pagos].sort((a, b) => (b.id || 0) - (a.id || 0));

    if (this.filtroMetodo !== 'TODOS') {
      list = list.filter(p => (p.metodoPago || '').toUpperCase() === this.filtroMetodo);
    }

    if (this.filtroTexto.trim()) {
      const q = this.filtroTexto.trim().toLowerCase();
      list = list.filter(p =>
        String(p.id).includes(q) ||
        String(p.reservaId).includes(q) ||
        (p.metodoPago && p.metodoPago.toLowerCase().includes(q))
      );
    }

    return list;
  }

  calcularTotalRecaudado(): string {
    const total = this.pagos.reduce((acc, p) => acc + (p.monto || 0), 0);
    return total.toFixed(2);
  }

  contarCompletados(): number {
    return this.pagos.filter(p => (p.estado || '').toUpperCase() === 'COMPLETADO').length;
  }

  calcularTicketPromedio(): string {
    if (this.pagos.length === 0) return '0.00';
    const sum = this.pagos.reduce((acc, p) => acc + (p.monto || 0), 0);
    return (sum / this.pagos.length).toFixed(2);
  }

  getMetodoBadge(metodo: string): string {
    switch ((metodo || '').toUpperCase()) {
      case 'YAPE': return 'bg-purple-100 text-purple-800';
      case 'PLIN': return 'bg-cyan-100 text-cyan-800';
      case 'TARJETA': return 'bg-blue-100 text-blue-800';
      case 'EFECTIVO': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getEstadoBadge(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDIENTE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RECHAZADO': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  abrirModalCrear() {
    this.pagoFormulario = { reservaId: null, monto: null, metodoPago: 'EFECTIVO' };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  formularioValido(): boolean {
    return !!(this.pagoFormulario.reservaId > 0 &&
              this.pagoFormulario.monto > 0 &&
              this.pagoFormulario.metodoPago);
  }

  guardarPago() {
    if (!this.formularioValido()) return;
    this.guardando = true;
    this.pagosService.createPago(this.pagoFormulario).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.cargarPagos();
      },
      error: (err: any) => {
        this.guardando = false;
        alert('Error al registrar pago: ' + (err.error?.mensaje || err.message));
      }
    });
  }
}
