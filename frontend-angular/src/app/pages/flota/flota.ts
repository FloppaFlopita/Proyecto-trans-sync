import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FlotaService, MantenimientoItem } from '../../services/flota.service';
import { AuthService } from '../../services/auth.service';

interface BusItem {
  id: number;
  placa: string;
  modelo: string;
  capacidad: number;
  asientosDisponibles: number;
  enMantenimiento?: boolean;
}

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- MENSAJE TOAST / ALERTA DE ACCIÓN -->
      <div *ngIf="mensajeToast.texto"
           [class]="mensajeToast.tipo === 'exito' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'"
           class="p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200">
        <div class="flex items-center gap-2.5">
          <svg *ngIf="mensajeToast.tipo === 'exito'" class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <svg *ngIf="mensajeToast.tipo === 'error'" class="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-xs sm:text-sm font-semibold">{{ mensajeToast.texto }}</p>
        </div>
        <button (click)="mensajeToast.texto = ''" class="text-slate-400 hover:text-slate-600 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- ENCABEZADO LIMPIO CON SELECTOR DE PESTAÑAS (PARQUE DE BUSES VS MANTENIMIENTO) -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              TransSync Interprovincial
            </span>
            <span class="text-xs text-slate-400 font-medium">{{ modoVista === 'admin' ? 'Gestión y Capacidad Vehicular' : 'Flota Oficial Certificada' }}</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            {{ pestanaActiva === 'buses' ? 'Control de Flota y Autobuses' : 'Centro de Mantenimiento Preventivo' }}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            {{ pestanaActiva === 'buses' 
               ? 'Supervise la disponibilidad de asientos en tiempo real, registro de unidades y capacidad operativa.' 
               : 'Gestión de revisiones mecánicas, estados de taller oficial y protección contra sobreventa.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- PESTAÑAS MODERNAS Y LIMPIAS -->
          <div *ngIf="modoVista === 'admin'" class="flex items-center bg-slate-100 p-1 rounded-xl">
            <button (click)="pestanaActiva = 'buses'"
                    [class]="pestanaActiva === 'buses' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'"
                    class="px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Parque de Autobuses ({{ buses.length }})
            </button>
            <button (click)="pestanaActiva = 'mantenimiento'"
                    [class]="pestanaActiva === 'mantenimiento' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'"
                    class="px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Mantenimiento ({{ mantenimientos.length }})
            </button>
          </div>

          <!-- Botones de Acción Admin -->
          <ng-container *ngIf="modoVista === 'admin'">
            <button *ngIf="pestanaActiva === 'buses'"
                    (click)="abrirModalCrear()"
                    class="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-600/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo Autobús
            </button>

            <button *ngIf="pestanaActiva === 'mantenimiento'"
                    (click)="abrirModalProgramarMantenimiento()"
                    class="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Programar Taller
            </button>
          </ng-container>

          <!-- Botón Imprimir -->
          <button (click)="imprimirFlota()"
                  title="Imprimir reporte oficial de flota"
                  class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- PESTAÑA 1: PARQUE DE AUTOBUSES -->
      <!-- ========================================== -->
      <ng-container *ngIf="pestanaActiva === 'buses'">

        <!-- PANEL: ANÁLISIS OPERATIVO DE LA FLOTA (CAPA DE NEGOCIO MS-FLOTA) -->
        <div *ngIf="modoVista === 'admin'" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-black text-slate-900 tracking-tight">Análisis Operativo de la Flota (Capa de Negocio ms-flota)</h2>
                </div>
                <p class="text-xs text-slate-500">Distribución de unidades, disponibilidad de asientos y estado del parque automotor.</p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Reglas de Negocio Activas
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <!-- Box 1: Distribución Operativa del Parque -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <p class="text-xs font-bold text-slate-700 mb-2.5">Distribución Operativa del Parque</p>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">🚍</span>
                  <p class="text-xl font-black text-slate-900 mt-0.5">{{ stats?.totalBuses ?? buses.length }}</p>
                  <p class="text-[10px] text-slate-400 font-medium">Flota Total</p>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">🟢</span>
                  <p class="text-xl font-black text-emerald-600 mt-0.5">{{ stats?.busesOperativos ?? contarOperativos() }}</p>
                  <p class="text-[10px] text-emerald-700 font-medium">Operativos</p>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">🔧</span>
                  <p class="text-xl font-black text-amber-600 mt-0.5">{{ stats?.busesEnMantenimiento ?? contarEnMantenimiento() }}</p>
                  <p class="text-[10px] text-amber-700 font-medium">En Taller</p>
                </div>
              </div>
            </div>

            <!-- Box 2: Capacidad y Ocupación en Tiempo Real -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <p class="text-xs font-bold text-slate-700 mb-2.5">Capacidad y Asientos Disponibles</p>
              <div class="grid grid-cols-2 gap-2 text-center">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">💺</span>
                  <p class="text-xl font-black text-teal-700 mt-0.5">{{ stats?.asientosLibres ?? calcularAsientosLibres() }}</p>
                  <p class="text-[10px] text-slate-400 font-medium">Libres de {{ stats?.capacidadTotal ?? calcularCapacidadTotal() }}</p>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">📊</span>
                  <p class="text-xl font-black text-indigo-600 mt-0.5">{{ stats?.porcentajeOcupacion ?? calcularPorcentajeOcupacion() }}%</p>
                  <p class="text-[10px] text-indigo-700 font-medium">Tasa Ocupación</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BUSCADOR Y FILTROS ESTILO ADMIN/RUTAS -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <!-- Cabecera del buscador -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-black text-slate-900 tracking-tight">Buscar y Supervisar Flota</h2>
                <p class="text-xs text-slate-500">Seleccione una placa, modelo o estado operativo para supervisar la disponibilidad en tiempo real.</p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Monitoreo satelital GPS SUTRAN activo
            </span>
          </div>

          <!-- Controles de filtrado -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <!-- Input texto -->
            <div class="md:col-span-5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Buscar por Placa o Modelo</label>
              <div class="relative">
                <input [(ngModel)]="filtroTexto"
                       type="text"
                       placeholder="Ej. ABC-123, Scania, Volvo, Irizar..."
                       class="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-slate-50/50">
              </div>
            </div>

            <!-- Estado Operativo -->
            <div class="md:col-span-4">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado de Disponibilidad</label>
              <select [(ngModel)]="filtroDisponibilidad"
                      class="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-slate-50/50">
                <option value="todos">Todos los Estados ({{ buses.length }})</option>
                <option value="disponibles">🟢 Operativos / Disponibles</option>
                <option value="en_taller">🔧 En Taller ({{ contarEnMantenimiento() }})</option>
                <option value="llenos">🔴 Capacidad Completa (Llenos)</option>
              </select>
            </div>

            <!-- Ordenamiento -->
            <div class="md:col-span-3">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ordenar por</label>
              <select [(ngModel)]="criterioOrden"
                      class="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-slate-50/50">
                <option value="id_asc">Orden Oficial (ID)</option>
                <option value="placa_asc">Placa (A-Z)</option>
                <option value="capacidad_desc">Mayor Capacidad</option>
                <option value="ocupacion_desc">Mayor Ocupación</option>
                <option value="libres_desc">Más Asientos Libres</option>
              </select>
            </div>
          </div>

          <!-- Píldoras de Filtros Rápidos -->
          <div class="flex items-center gap-2 flex-wrap pt-1">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filtros Rápidos:</span>
            <button (click)="filtroDisponibilidad = 'todos'; filtroTexto = ''"
                    [class]="filtroDisponibilidad === 'todos' && !filtroTexto ? 'bg-teal-100 text-teal-800 border-teal-300 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors">
              Todos ({{ buses.length }})
            </button>
            <button (click)="filtroDisponibilidad = 'disponibles'; filtroTexto = ''"
                    [class]="filtroDisponibilidad === 'disponibles' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors">
              🟢 Operativos ({{ contarOperativos() }})
            </button>
            <button (click)="filtroDisponibilidad = 'en_taller'; filtroTexto = ''"
                    [class]="filtroDisponibilidad === 'en_taller' ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors">
              🔧 En Taller ({{ contarEnMantenimiento() }})
            </button>
            <button (click)="filtroTexto = 'Scania'"
                    [class]="filtroTexto === 'Scania' ? 'bg-teal-100 text-teal-800 border-teal-300 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors">
              Scania
            </button>
            <button (click)="filtroTexto = 'Volvo'"
                    [class]="filtroTexto === 'Volvo' ? 'bg-teal-100 text-teal-800 border-teal-300 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
                    class="px-2.5 py-1 text-xs rounded-lg border transition-colors">
              Volvo
            </button>
          </div>

          <!-- Contador y reset -->
          <div class="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Mostrando <strong>{{ busesFiltrados.length }}</strong> de <strong>{{ buses.length }}</strong> unidades disponibles</span>
            <button *ngIf="filtroTexto || filtroDisponibilidad !== 'todos' || criterioOrden !== 'id_asc'"
                    (click)="limpiarFiltros()"
                    class="text-xs text-teal-700 hover:text-teal-900 font-bold">
              Restablecer filtros
            </button>
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
          <button (click)="cargarBuses()" class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
            Reintentar
          </button>
        </div>

        <!-- ESTADO DE CARGA -->
        <div *ngIf="cargando" class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm font-bold text-slate-700">Cargando unidades vehiculares y disponibilidad...</p>
        </div>

        <!-- GRILLA DE BUSES (DISEÑO IDÉNTICO A RUTAS) -->
        <div *ngIf="!cargando && busesFiltrados.length > 0"
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let b of busesFiltrados"
               class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
               [class.border-amber-300]="b.enMantenimiento">
            <div>
              <!-- Recuadro superior estilizado con gradiente -->
              <div class="h-28 rounded-xl bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-100 p-4 mb-4 flex items-center justify-between relative overflow-hidden">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <div>
                    <span class="text-[10px] font-mono font-bold text-slate-400">PLACA OFICIAL</span>
                    <p class="text-xl font-black text-slate-900 font-mono tracking-tight">{{ b.placa }}</p>
                    <p class="text-xs text-slate-600 font-semibold truncate max-w-[150px]">{{ b.modelo }}</p>
                  </div>
                </div>

                <div class="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <span *ngIf="b.capacidad >= 50"
                        class="text-[9px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                    ★ Alta Capacidad
                  </span>
                  <span [class]="obtenerClaseBadge(b)"
                        class="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1">
                    <span [class]="obtenerPuntoEstado(b)" class="w-1.5 h-1.5 rounded-full"></span>
                    {{ obtenerTextoEstado(b) }}
                  </span>
                </div>
              </div>

              <!-- Amenidades y Confort Incluido -->
              <div class="flex items-center gap-1.5 mb-3.5 flex-wrap">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                  <span>💺</span> {{ b.capacidad }} Asientos
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                  <span>❄️</span> Clima Purificado
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-100">
                  <span>🛰️</span> GPS SUTRAN
                </span>
              </div>

              <!-- Alerta si está en mantenimiento -->
              <div *ngIf="b.enMantenimiento" class="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 mb-3 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span *ngIf="modoVista === 'pasajero'">Este autobús no está disponible temporalmente. Consulta otras opciones.</span>
                <span *ngIf="modoVista === 'admin'"><strong>En Taller:</strong> No apto para reservas (bloqueado por regla de negocio).</span>
              </div>

              <!-- Disponibilidad en Tiempo Real -->
              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 mb-4">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-600 font-medium">Asientos Disponibles</span>
                  <span class="font-black text-slate-900 text-sm">{{ b.asientosDisponibles ?? 0 }} / {{ b.capacidad ?? 0 }}</span>
                </div>
                <div class="h-2 rounded-full overflow-hidden bg-slate-200">
                  <div class="h-full rounded-full transition-all duration-300"
                       [style.width.%]="calcularOcupacionPorBus(b)"
                       [class]="obtenerClaseBarra(b)">
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">{{ calcularOcupacionPorBus(b) }}% Ocupado</span>
                  <span class="font-bold text-slate-800">{{ (b.asientosDisponibles ?? 0) }} Asientos Libres</span>
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-3 border-t border-slate-100">
              <!-- Vista Pasajero -->
              <div *ngIf="modoVista === 'pasajero'" class="flex items-center gap-2">
                <button (click)="verDetalles(b)"
                        title="Ver características y confort"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-sm">
                  <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Ficha de Confort
                </button>

                <button (click)="irARutas()"
                        [disabled]="b.enMantenimiento || (b.asientosDisponibles ?? 0) <= 0"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                  {{ b.enMantenimiento ? 'En Taller' : ((b.asientosDisponibles ?? 0) <= 0 ? 'Sin Asientos' : 'Ver Salidas') }}
                </button>
              </div>

              <!-- Vista Administrador -->
              <div *ngIf="modoVista === 'admin'" class="flex items-center gap-1.5">
                <button *ngIf="!b.enMantenimiento"
                        (click)="abrirModalProgramarParaBus(b)"
                        title="Programar mantenimiento técnico para este bus"
                        class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Taller
                </button>

                <button *ngIf="b.enMantenimiento"
                        (click)="liberarBusDeMantenimiento(b)"
                        title="Liberar bus de taller y devolverlo al servicio operativo"
                        class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Liberar a Ruta
                </button>

                <!-- Iconos secundarios de admin -->
                <button (click)="abrirModalIncidencia(b)"
                        title="Reportar novedad u observación mecánica"
                        class="p-2.5 rounded-xl text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </button>

                <button (click)="reiniciarBus(b)"
                        title="Reiniciar asientos al 100% de capacidad para pruebas"
                        class="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>

                <button (click)="verDetalles(b)"
                        title="Ver ficha técnica"
                        class="p-2.5 rounded-xl text-teal-600 hover:bg-teal-50 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>

                <button (click)="abrirModalEditar(b)"
                        title="Editar Autobús"
                        class="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>

                <button (click)="eliminarBus(b.id)"
                        title="Eliminar Autobús"
                        class="p-2.5 rounded-xl text-red-500 hover:bg-red-50 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ESTADO VACÍO -->
        <div *ngIf="!cargando && busesFiltrados.length === 0"
             class="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-900 max-w-md mx-auto">No encontramos autobuses disponibles para el filtro seleccionado.</h3>
          <button (click)="limpiarFiltros()"
                  class="mt-3 px-4 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            Ver todas las unidades disponibles
          </button>
        </div>

        <!-- RESUMEN DE MANTENIMIENTO TÉCNICO (PIE DE PÁGINA COMPACTO PARA ADMIN) -->
        <div *ngIf="modoVista === 'admin'" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Centro de Mantenimiento Preventivo (ms-flota)</h3>
              <p class="text-[11px] text-slate-500">Supervisión técnica de unidades en taller y control de reservas protegidas.</p>
            </div>
            <button (click)="pestanaActiva = 'mantenimiento'" class="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1">
              <span>Ver Gestión Completa de Taller ({{ mantenimientos.length }})</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-xs">
            <div class="flex items-center gap-6 flex-wrap">
              <div>
                <span class="text-slate-400 font-medium">En Taller Activo:</span>
                <span class="font-bold text-amber-700 ml-1.5">{{ contarMantenimientosPorEstado('EN_MANTENIMIENTO') }} unidades</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium">Programados Próximos:</span>
                <span class="font-bold text-blue-700 ml-1.5">{{ contarMantenimientosPorEstado('PROGRAMADO') }} visitas</span>
              </div>
              <div>
                <span class="text-slate-400 font-medium">Finalizados:</span>
                <span class="font-bold text-emerald-700 ml-1.5">{{ contarMantenimientosPorEstado('FINALIZADO') }} inspecciones</span>
              </div>
            </div>
            <button (click)="abrirModalProgramarMantenimiento()" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
              + Programar Taller
            </button>
          </div>
        </div>

      </ng-container>

      <!-- ========================================== -->
      <!-- PESTAÑA 2: CENTRO DE MANTENIMIENTO TÉCNICO -->
      <!-- ========================================== -->
      <ng-container *ngIf="pestanaActiva === 'mantenimiento'">

        <!-- PANEL: ANÁLISIS OPERATIVO DE MANTENIMIENTO -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-sm">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-black text-slate-900 tracking-tight">Centro de Mantenimiento y Taller Oficial (ms-flota)</h2>
                </div>
                <p class="text-xs text-slate-500">Gestión de órdenes preventivas y correctivas con bloqueo de sobreventa garantizado.</p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              HTTP 409 Conflict Activo
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <!-- Box 1: Estado de Intervenciones Técnicas -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <p class="text-xs font-bold text-slate-700 mb-2.5">Estado de Intervenciones Técnicas</p>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">📋</span>
                  <p class="text-xl font-black text-blue-600 mt-0.5">{{ contarMantenimientosPorEstado('PROGRAMADO') }}</p>
                  <p class="text-[10px] text-slate-400 font-medium">Programados</p>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">🔧</span>
                  <p class="text-xl font-black text-amber-600 mt-0.5">{{ contarMantenimientosPorEstado('EN_MANTENIMIENTO') }}</p>
                  <p class="text-[10px] text-amber-700 font-medium">En Taller</p>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">✅</span>
                  <p class="text-xl font-black text-emerald-600 mt-0.5">{{ contarMantenimientosPorEstado('FINALIZADO') }}</p>
                  <p class="text-[10px] text-emerald-700 font-medium">Finalizados</p>
                </div>
              </div>
            </div>

            <!-- Box 2: Taller y Protección de Reservas -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <p class="text-xs font-bold text-slate-700 mb-2.5">Protocolo de Operatividad y Seguridad</p>
              <div class="grid grid-cols-2 gap-2 text-center">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">🛡️</span>
                  <p class="text-xl font-black text-teal-700 mt-0.5">SUTRAN</p>
                  <p class="text-[10px] text-slate-400 font-medium">Normativa MTC</p>
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span class="text-base">🚫</span>
                  <p class="text-xl font-black text-rose-600 mt-0.5">Bloqueo</p>
                  <p class="text-[10px] text-rose-700 font-medium">Cero Sobreventas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BUSCADOR Y FILTROS DE MANTENIMIENTO -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-sm">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-black text-slate-900 tracking-tight">Buscar en Órdenes de Mantenimiento</h2>
                <p class="text-xs text-slate-500">Filtre intervenciones mecánicas por placa, taller o estado del servicio técnico.</p>
              </div>
            </div>
            <button (click)="abrirModalProgramarMantenimiento()"
                    class="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Programar Taller
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div class="md:col-span-6">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Buscar por Taller, Placa o Tarea</label>
              <input [(ngModel)]="filtroMantenimientoTexto"
                     type="text"
                     placeholder="Buscar en taller, placa o descripción..."
                     class="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 bg-slate-50/50">
            </div>

            <div class="md:col-span-6">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtro por Estado</label>
              <div class="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
                <button (click)="filtroMantenimiento = 'todos'"
                        [class]="filtroMantenimiento === 'todos' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap">
                  Todos ({{ mantenimientos.length }})
                </button>
                <button (click)="filtroMantenimiento = 'EN_MANTENIMIENTO'"
                        [class]="filtroMantenimiento === 'EN_MANTENIMIENTO' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-amber-700'"
                        class="px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap">
                  En Taller ({{ contarMantenimientosPorEstado('EN_MANTENIMIENTO') }})
                </button>
                <button (click)="filtroMantenimiento = 'PROGRAMADO'"
                        [class]="filtroMantenimiento === 'PROGRAMADO' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-blue-700'"
                        class="px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap">
                  Programados ({{ contarMantenimientosPorEstado('PROGRAMADO') }})
                </button>
                <button (click)="filtroMantenimiento = 'FINALIZADO'"
                        [class]="filtroMantenimiento === 'FINALIZADO' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-700'"
                        class="px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap">
                  Finalizados ({{ contarMantenimientosPorEstado('FINALIZADO') }})
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TABLA DE MANTENIMIENTO (ESTILO MODERNO DE AUDITORÍA) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Historial de Órdenes Mecánicas</h3>
              <p class="text-[11px] text-slate-500">Supervise cada intervención preventiva o correctiva.</p>
            </div>
            <button (click)="cargarMantenimientos()" class="text-xs text-amber-700 font-bold hover:underline">
              Actualizar Lista
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700">
              <thead class="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Bus Asignado</th>
                  <th class="py-3 px-4">Tipo & Tarea</th>
                  <th class="py-3 px-4">Taller Autorizado</th>
                  <th class="py-3 px-4">Programación</th>
                  <th class="py-3 px-4">Costo Estimado / Real</th>
                  <th class="py-3 px-4">Estado Operativo</th>
                  <th class="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let m of mantenimientosFiltrados" class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900 font-mono text-xs">{{ m.busPlaca || 'Bus #' + m.busId }}</div>
                    <div class="text-[11px] text-slate-500">{{ m.busModelo || 'Unidad de flota' }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                          [class]="(m.tipo === 'CORRECTIVO' || m.tipoMantenimiento === 'CORRECTIVO') ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'">
                      {{ m.tipo || m.tipoMantenimiento }}
                    </span>
                    <p class="text-xs text-slate-700 mt-0.5 line-clamp-1" [title]="m.descripcion">{{ m.descripcion }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-medium text-slate-800">{{ m.taller || m.tallerAsignado || 'Taller Central TransSync' }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="text-slate-800 font-medium">{{ m.fechaProgramada | date:'shortDate' }}</div>
                    <div *ngIf="m.fechaInicio" class="text-[10px] text-amber-700">Iniciado: {{ m.fechaInicio | date:'short' }}</div>
                    <div *ngIf="m.fechaFin" class="text-[10px] text-emerald-700">Finalizado: {{ m.fechaFin | date:'short' }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-slate-900">
                      {{ m.costo ? 'S/. ' + m.costo.toFixed(2) : (m.costoReal ? 'S/. ' + m.costoReal.toFixed(2) : (m.costoEstimado ? 'Est: S/. ' + m.costoEstimado.toFixed(2) : 'S/. 0.00')) }}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span [class]="obtenerClaseBadgeMantenimiento(m.estado)"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border">
                      <span [class]="obtenerPuntoMantenimiento(m.estado)" class="w-1.5 h-1.5 rounded-full"></span>
                      {{ formatearEstadoMantenimiento(m.estado) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Si está PROGRAMADO: Iniciar o Cancelar -->
                      <button *ngIf="m.estado === 'PROGRAMADO'"
                              (click)="iniciarMantenimiento(m)"
                              title="Ingresar bus a taller (cambia a EN_MANTENIMIENTO e inhabilita reservas con 409)"
                              class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                        Ingresar a Taller
                      </button>
                      <button *ngIf="m.estado === 'PROGRAMADO'"
                              (click)="cancelarMantenimiento(m)"
                              title="Cancelar intervención programada"
                              class="px-2.5 py-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors">
                        Cancelar
                      </button>

                      <!-- Si está EN_MANTENIMIENTO: Finalizar -->
                      <button *ngIf="m.estado === 'EN_MANTENIMIENTO'"
                              (click)="abrirModalFinalizarMantenimiento(m)"
                              title="Finalizar mantenimiento y rehabilitar autobús para reservas"
                              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                        Liberar a Operativo
                      </button>

                      <!-- Si está FINALIZADO -->
                      <span *ngIf="m.estado === 'FINALIZADO'" class="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Operativo
                      </span>
                      <span *ngIf="m.estado === 'CANCELADO'" class="text-xs text-slate-400 italic">
                        Cancelado
                      </span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="mantenimientosFiltrados.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-500 text-xs">
                    No se registran intervenciones para el filtro seleccionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </ng-container>

      <!-- MODAL DETALLES DEL BUS (DIFERENCIADO POR ROL: CONFORT PASAJERO VS FICHA TÉCNICA ADMIN) -->
      <div *ngIf="busDetalle"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-violet-100 text-violet-800">
                {{ modoVista === 'admin' ? 'Ficha Técnica: Bus #' + busDetalle.id : 'Nuestra Flota: ' + busDetalle.modelo }}
              </span>
              <span [class]="obtenerClaseBadge(busDetalle)" class="text-xs font-bold px-2 py-0.5 rounded-full border">
                {{ obtenerTextoEstado(busDetalle) }}
              </span>
            </div>
            <button (click)="cerrarDetalles()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Cabecera de la ficha -->
          <div class="bg-violet-50/60 p-4 rounded-xl border border-violet-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] font-bold text-violet-800 uppercase tracking-wide">Placa de Rodaje</p>
                <p class="text-2xl font-black text-slate-900 font-mono tracking-tight">{{ busDetalle.placa }}</p>
                <p class="text-xs text-slate-600 mt-0.5 font-medium">{{ busDetalle.modelo }}</p>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-500 font-medium">Capacidad</span>
                <p class="text-2xl font-black text-slate-900">{{ busDetalle.capacidad }}</p>
                <span class="text-[10px] text-slate-500">asientos totales</span>
              </div>
            </div>
          </div>

          <!-- VISTA PASAJERO: COMODIDADES Y CONFORT A BORDO -->
          <div *ngIf="modoVista === 'pasajero'" class="space-y-3">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <p class="font-bold text-slate-800 uppercase text-[11px] tracking-wide">Confort y Seguridad en Viaje</p>
              <div class="grid grid-cols-2 gap-2 text-slate-700">
                <div class="flex items-center gap-2">
                  <span class="text-violet-600 font-bold">✔</span> Asientos reclinables ergonómicos
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-violet-600 font-bold">✔</span> Climatización y aire purificado
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-violet-600 font-bold">✔</span> Monitoreo GPS satelital 24/7
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-violet-600 font-bold">✔</span> Maletero amplio para equipaje
                </div>
              </div>
            </div>

            <!-- Alerta informativa si está en taller -->
            <div *ngIf="busDetalle.enMantenimiento" class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <p class="font-bold">Unidad en revisión periódica preventiva</p>
              <p class="text-[11px] text-amber-800 mt-0.5">Esta unidad se encuentra temporalmente en servicio técnico programado para garantizar su seguridad vial.</p>
            </div>
          </div>

          <!-- VISTA ADMINISTRADOR: HISTORIAL TÉCNICO Y CONTROL DE ASIENTOS -->
          <div *ngIf="modoVista === 'admin'" class="space-y-3">
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <p class="text-slate-500 font-medium">Capacidad</p>
                <p class="text-base font-bold text-slate-900 mt-0.5">{{ busDetalle.capacidad }}</p>
                <p class="text-[10px] text-slate-400">Asientos</p>
              </div>
              <div class="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 text-center">
                <p class="text-emerald-700 font-medium">Disponibles</p>
                <p class="text-base font-bold text-emerald-800 mt-0.5">{{ busDetalle.asientosDisponibles }}</p>
                <p class="text-[10px] text-emerald-600">Para venta</p>
              </div>
              <div class="bg-amber-50/70 p-3 rounded-lg border border-amber-100 text-center">
                <p class="text-amber-700 font-medium">Ocupados</p>
                <p class="text-base font-bold text-amber-800 mt-0.5">{{ (busDetalle.capacidad - busDetalle.asientosDisponibles) }}</p>
                <p class="text-[10px] text-amber-600">Emitidos</p>
              </div>
            </div>

            <!-- Historial de Mantenimiento para este Bus -->
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p class="text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Historial Técnico</span>
                <button (click)="abrirModalProgramarParaBus(busDetalle); cerrarDetalles()" class="text-[10px] text-amber-700 font-bold hover:underline">
                  + Programar Visita
                </button>
              </p>
              <div *ngIf="historialBusDetalle.length > 0" class="space-y-1.5 max-h-32 overflow-y-auto">
                <div *ngFor="let h of historialBusDetalle" class="flex items-center justify-between bg-white p-2 rounded border border-slate-100 text-[11px]">
                  <div>
                    <span class="font-bold text-slate-800">{{ h.tipoMantenimiento }}</span>
                    <span class="text-slate-500 ml-1">· {{ h.fechaProgramada | date:'shortDate' }}</span>
                  </div>
                  <span [class]="obtenerClaseBadgeMantenimiento(h.estado)" class="px-2 py-0.5 rounded text-[10px] font-bold">
                    {{ h.estado }}
                  </span>
                </div>
              </div>
              <p *ngIf="historialBusDetalle.length === 0" class="text-[11px] text-slate-400 italic">
                No tiene intervenciones de mantenimiento registradas.
              </p>
            </div>
          </div>

          <!-- Pie del Modal -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="cerrarDetalles()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cerrar
            </button>

            <!-- Acción Pasajero: Ver Salidas y Horarios -->
            <button *ngIf="modoVista === 'pasajero'"
                    (click)="irARutas(); cerrarDetalles()"
                    [disabled]="busDetalle.enMantenimiento || (busDetalle.asientosDisponibles ?? 0) <= 0"
                    class="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all shadow-md shadow-violet-600/20">
              Consultar Salidas y Horarios
            </button>

            <!-- Acción Admin: Reiniciar asientos -->
            <button *ngIf="modoVista === 'admin'"
                    (click)="reiniciarBus(busDetalle); cerrarDetalles()"
                    class="px-4 py-2 text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg transition-all">
              Reiniciar Asientos Libres
            </button>
          </div>
        </div>
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
              <label class="block text-xs font-bold text-slate-700 mb-1">Placa Oficial <span class="text-red-500">*</span></label>
              <input [(ngModel)]="busFormulario.placa"
                     (input)="validarFormularioEnTiempoReal()"
                     placeholder="Ej. ABC-123"
                     [class.border-red-400]="erroresFormulario.placa"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono uppercase">
              <p *ngIf="erroresFormulario.placa" class="text-[11px] text-red-600 mt-1 font-medium">{{ erroresFormulario.placa }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Modelo / Fabricante <span class="text-red-500">*</span></label>
              <input [(ngModel)]="busFormulario.modelo"
                     (input)="validarFormularioEnTiempoReal()"
                     placeholder="Ej. Scania Marcopolo G7, Volvo Irizar i8..."
                     [class.border-red-400]="erroresFormulario.modelo"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
              <p *ngIf="erroresFormulario.modelo" class="text-[11px] text-red-600 mt-1 font-medium">{{ erroresFormulario.modelo }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Capacidad Total de Asientos <span class="text-red-500">*</span></label>
              <input [(ngModel)]="busFormulario.capacidad"
                     (input)="validarFormularioEnTiempoReal()"
                     type="number"
                     placeholder="Ej. 40, 50"
                     [class.border-red-400]="erroresFormulario.capacidad"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
              <p *ngIf="erroresFormulario.capacidad" class="text-[11px] text-red-600 mt-1 font-medium">{{ erroresFormulario.capacidad }}</p>
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

      <!-- MODAL REPORTAR INCIDENCIA OPERATIVA / MECÁNICA (PENSADO PARA CONDUCTOR / SUPERVISOR) -->
      <div *ngIf="busIncidencia"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">Reporte de Novedad Operativa</h3>
              <p class="text-xs text-slate-500">Notificar requerimiento mecánico para el Bus {{ busIncidencia.placa }}</p>
            </div>
            <button (click)="busIncidencia = null" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Incidencia</label>
              <select [(ngModel)]="incidenciaForm.tipo"
                      class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="PREVENTIVO">Inspección de Rutina (Pastillas, filtros, fluidos)</option>
                <option value="CORRECTIVO">Falla Mecánica / Eléctrica (Urgente)</option>
                <option value="SISTEMA_FRENOS">Neumáticos y Sistema de Frenado</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Detalle de la Observación <span class="text-red-500">*</span></label>
              <textarea [(ngModel)]="incidenciaForm.descripcion"
                        rows="3"
                        placeholder="Describa el comportamiento anómalo detectado por el conductor o inspector..."
                        class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Taller de Destino</label>
              <input [(ngModel)]="incidenciaForm.taller"
                     placeholder="Taller Central TransSync"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="busIncidencia = null"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="confirmarIncidencia()"
                    [disabled]="!incidenciaForm.descripcion.trim()"
                    class="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all shadow-md shadow-amber-500/20 disabled:opacity-50">
              Registrar Incidencia
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL PROGRAMAR MANTENIMIENTO -->
      <div *ngIf="mostrarModalMantenimiento"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">Programar Mantenimiento</h3>
              <p class="text-xs text-slate-500">Revisión técnica vehicular preventiva o correctiva</p>
            </div>
            <button (click)="cerrarModalMantenimiento()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-3.5">
            <!-- Selección de Bus -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Autobús de la Flota <span class="text-red-500">*</span></label>
              <select [(ngModel)]="mantenimientoForm.busId"
                      class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                <option [ngValue]="null" disabled>Seleccionar un autobús...</option>
                <option *ngFor="let b of buses" [ngValue]="b.id">
                  {{ b.placa }} - {{ b.modelo }} (#{{ b.id }})
                </option>
              </select>
            </div>

            <!-- Tipo de Mantenimiento -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Intervención <span class="text-red-500">*</span></label>
              <select [(ngModel)]="mantenimientoForm.tipoMantenimiento"
                      class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                <option value="PREVENTIVO">PREVENTIVO (Inspección periódica, afinamiento)</option>
                <option value="CORRECTIVO">CORRECTIVO (Falla mecánica o reparación)</option>
                <option value="REVISION_TECNICA">REVISIÓN TÉCNICA (Certificación anual)</option>
                <option value="SISTEMA_FRENOS">SISTEMA DE FRENOS Y NEUMÁTICOS</option>
                <option value="MANTENIMIENTO_MOTOR">MOTOR Y TRANSMISIÓN</option>
              </select>
            </div>

            <!-- Fecha Programada -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha Programada <span class="text-red-500">*</span></label>
              <input [(ngModel)]="mantenimientoForm.fechaProgramada"
                     type="datetime-local"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
            </div>

            <!-- Taller Asignado y Costo Estimado -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Taller Autorizado</label>
                <input [(ngModel)]="mantenimientoForm.tallerAsignado"
                       placeholder="Ej. Taller Central Lima"
                       class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Costo Estimado (S/.)</label>
                <input [(ngModel)]="mantenimientoForm.costoEstimado"
                       type="number"
                       placeholder="Ej. 450.00"
                       class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
              </div>
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Descripción de la Tarea <span class="text-red-500">*</span></label>
              <textarea [(ngModel)]="mantenimientoForm.descripcion"
                        rows="2"
                        placeholder="Detalle los trabajos a ejecutar (ej. cambio de aceite sintético, pastillas de freno, filtros)..."
                        class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"></textarea>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModalMantenimiento()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="guardarMantenimiento()"
                    [disabled]="guardandoMantenimiento || !mantenimientoValido()"
                    class="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all shadow-md shadow-amber-500/20 disabled:opacity-50">
              {{ guardandoMantenimiento ? 'Programando...' : 'Confirmar Programación' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL FINALIZAR MANTENIMIENTO -->
      <div *ngIf="mantenimientoAFinalizar"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 class="text-lg font-black text-slate-900">Liberar Autobús de Taller</h3>
              <p class="text-xs text-slate-500">Concluir mantenimiento y habilitar venta de asientos</p>
            </div>
            <button (click)="mantenimientoAFinalizar = null" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mb-4">
            <p><strong>Unidad:</strong> {{ mantenimientoAFinalizar.busPlaca || 'Bus #' + mantenimientoAFinalizar.busId }}</p>
            <p class="text-[11px] text-amber-800 mt-0.5">Al finalizar, el autobús pasará al estado <strong>OPERATIVO</strong> y estará disponible nuevamente para emitir reservas.</p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Costo Real Facturado (S/.)</label>
              <input [(ngModel)]="formFinalizar.costoReal"
                     type="number"
                     placeholder="Ej. 420.00"
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones Finales del Mecánico</label>
              <textarea [(ngModel)]="formFinalizar.observacionesFinales"
                        rows="3"
                        placeholder="Detalle los repuestos reemplazados y la conformidad técnica..."
                        class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mantenimientoAFinalizar = null"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="confirmarFinalizarMantenimiento()"
                    class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-md shadow-emerald-600/20">
              Finalizar y Habilitar Unidad
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class FlotaComponent implements OnInit {
  buses: BusItem[] = [];
  mantenimientos: MantenimientoItem[] = [];
  stats: any = null;
  cargando = false;
  errorMensaje = '';

  // Selector de Pestaña Activa ('buses' | 'mantenimiento')
  pestanaActiva: 'buses' | 'mantenimiento' = 'buses';

  // Filtros de Buses
  filtroTexto = '';
  filtroDisponibilidad = 'todos';
  criterioOrden = 'id_asc';

  // Filtros de Mantenimientos
  filtroMantenimiento: 'todos' | 'PROGRAMADO' | 'EN_MANTENIMIENTO' | 'FINALIZADO' = 'todos';
  filtroMantenimientoTexto = '';

  // Detalle de bus
  busDetalle: BusItem | null = null;
  historialBusDetalle: MantenimientoItem[] = [];

  // Incidencia Rápida (para chofer / supervisor)
  busIncidencia: BusItem | null = null;
  incidenciaForm = { tipo: 'PREVENTIVO', descripcion: '', taller: 'Taller Central TransSync' };

  // Modales y formularios de Bus
  mostrarModal = false;
  modoEdicion = false;
  guardando = false;
  busFormulario: any = { id: null, placa: '', modelo: '', capacidad: 40, asientosDisponibles: 40 };
  erroresFormulario: { placa?: string; modelo?: string; capacidad?: string } = {};

  // Modal Programar Mantenimiento
  mostrarModalMantenimiento = false;
  guardandoMantenimiento = false;
  mantenimientoForm: any = {
    busId: null,
    tipoMantenimiento: 'PREVENTIVO',
    descripcion: '',
    tallerAsignado: 'Taller Central TransSync',
    costoEstimado: 350,
    fechaProgramada: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  };

  // Modal Finalizar Mantenimiento
  mantenimientoAFinalizar: MantenimientoItem | null = null;
  formFinalizar = { costoReal: 0, observacionesFinales: 'Mantenimiento preventivo completado con éxito. Inspección de seguridad aprobada.' };

  // Feedback Toast
  mensajeToast: { texto: string; tipo: 'exito' | 'error' } = { texto: '', tipo: 'exito' };

  // Perspectiva de Usuario (Determinada estrictamente por el rol del usuario autenticado)
  esAdmin: boolean = false;
  modoVista: 'admin' | 'pasajero' = 'pasajero';

  constructor(
    private flotaService: FlotaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.actualizarRol();
    this.authService.currentUser$.subscribe(() => {
      this.actualizarRol();
      this.cdr.detectChanges();
    });
    this.recargarTodo();
  }

  private actualizarRol() {
    this.esAdmin = this.authService.isAdmin();
    this.modoVista = this.esAdmin ? 'admin' : 'pasajero';
  }

  irARutas() {
    this.router.navigate(['/rutas']);
  }

  imprimirFlota() {
    window.print();
  }

  recargarTodo() {
    this.cargarBuses();
    this.cargarMantenimientos();
    this.cargarEstadisticas();
  }

  cargarBuses() {
    this.cargando = true;
    this.errorMensaje = '';
    this.flotaService.getBuses().subscribe({
      next: (resp: any) => {
        const datos: BusItem[] = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.buses = datos;
        this.actualizarEstadoMantenimientoEnBuses();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.errorMensaje = 'No se pudo conectar con el servicio de flota. Verifique su conexión.';
        this.cdr.detectChanges();
      }
    });
  }

  cargarMantenimientos() {
    this.flotaService.getMantenimientos().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.mantenimientos = datos;
        this.actualizarEstadoMantenimientoEnBuses();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  cargarEstadisticas() {
    this.flotaService.getEstadisticasFlota().subscribe({
      next: (resp: any) => {
        if (resp && resp.datos) {
          this.stats = resp.datos;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  actualizarEstadoMantenimientoEnBuses() {
    if (!this.buses || !this.mantenimientos) return;
    const busesEnTallerIds = new Set(
      this.mantenimientos
        .filter(m => m.estado === 'EN_MANTENIMIENTO')
        .map(m => m.busId)
    );
    this.buses.forEach(b => {
      b.enMantenimiento = busesEnTallerIds.has(b.id);
    });
  }

  contarOperativos(): number {
    return this.buses.filter(b => !b.enMantenimiento).length;
  }

  contarEnMantenimiento(): number {
    return this.buses.filter(b => b.enMantenimiento).length;
  }

  contarMantenimientosPorEstado(estado: string): number {
    return this.mantenimientos.filter(m => m.estado === estado).length;
  }

  get mantenimientosFiltrados(): MantenimientoItem[] {
    let resultado = this.mantenimientos;
    if (this.filtroMantenimiento !== 'todos') {
      resultado = resultado.filter(m => m.estado === this.filtroMantenimiento);
    }
    if (this.filtroMantenimientoTexto.trim()) {
      const q = this.filtroMantenimientoTexto.toLowerCase();
      resultado = resultado.filter(m =>
        (m.busPlaca && m.busPlaca.toLowerCase().includes(q)) ||
        ((m.taller && m.taller.toLowerCase().includes(q)) || (m.tallerAsignado && m.tallerAsignado.toLowerCase().includes(q))) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(q))
      );
    }
    return resultado;
  }

  get busesFiltrados(): BusItem[] {
    let resultado = [...this.buses];

    // Filtro por texto (placa o modelo)
    if (this.filtroTexto.trim()) {
      const q = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(b =>
        (b.placa && b.placa.toLowerCase().includes(q)) ||
        (b.modelo && b.modelo.toLowerCase().includes(q))
      );
    }

    // Filtro por disponibilidad
    if (this.filtroDisponibilidad === 'disponibles') {
      resultado = resultado.filter(b => !b.enMantenimiento && (b.asientosDisponibles || 0) > 0);
    } else if (this.filtroDisponibilidad === 'llenos') {
      resultado = resultado.filter(b => (b.asientosDisponibles || 0) <= 0);
    } else if (this.filtroDisponibilidad === 'en_taller') {
      resultado = resultado.filter(b => b.enMantenimiento);
    }

    // Criterio de ordenamiento
    switch (this.criterioOrden) {
      case 'placa_asc':
        resultado.sort((a, b) => (a.placa || '').localeCompare(b.placa || ''));
        break;
      case 'capacidad_desc':
        resultado.sort((a, b) => (b.capacidad || 0) - (a.capacidad || 0));
        break;
      case 'ocupacion_desc':
        resultado.sort((a, b) => this.calcularOcupacionPorBus(b) - this.calcularOcupacionPorBus(a));
        break;
      case 'libres_desc':
        resultado.sort((a, b) => (b.asientosDisponibles || 0) - (a.asientosDisponibles || 0));
        break;
      default:
        resultado.sort((a, b) => a.id - b.id);
        break;
    }

    return resultado;
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroDisponibilidad = 'todos';
    this.criterioOrden = 'id_asc';
  }

  calcularCapacidadTotal(): number {
    return this.buses.reduce((acc, b) => acc + (b.capacidad || 0), 0);
  }

  calcularAsientosLibres(): number {
    return this.buses.reduce((acc, b) => acc + (b.asientosDisponibles || 0), 0);
  }

  calcularPorcentajeOcupacion(): number {
    const total = this.calcularCapacidadTotal();
    if (total <= 0) return 0;
    const libres = this.calcularAsientosLibres();
    const ocupados = Math.max(0, total - libres);
    return Math.round((ocupados / total) * 100);
  }

  calcularOcupacionPorBus(bus: BusItem): number {
    if (!bus || !bus.capacidad || bus.capacidad <= 0) return 0;
    const disponibles = bus.asientosDisponibles ?? 0;
    const ocupados = Math.max(0, bus.capacidad - disponibles);
    const porcentaje = Math.round((ocupados / bus.capacidad) * 100);
    return Math.max(0, Math.min(100, porcentaje));
  }

  obtenerClaseBadge(bus: BusItem): string {
    if (bus.enMantenimiento) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    const libres = bus.asientosDisponibles ?? 0;
    const cap = bus.capacidad || 1;
    const porcentajeLibre = (libres / cap) * 100;

    if (libres <= 0) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (porcentajeLibre <= 40) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  obtenerPuntoEstado(bus: BusItem): string {
    if (bus.enMantenimiento) return 'bg-amber-600 animate-pulse';
    const libres = bus.asientosDisponibles ?? 0;
    const cap = bus.capacidad || 1;
    const porcentajeLibre = (libres / cap) * 100;

    if (libres <= 0) return 'bg-red-500';
    if (porcentajeLibre <= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  obtenerTextoEstado(bus: BusItem): string {
    if (bus.enMantenimiento) {
      return this.modoVista === 'admin' ? 'En Taller' : 'No disponible';
    }
    const libres = bus.asientosDisponibles ?? 0;
    const cap = bus.capacidad || 1;
    const porcentajeLibre = (libres / cap) * 100;

    if (libres <= 0) return 'Lleno (0)';
    if (porcentajeLibre <= 40) return `Poco Espacio (${libres})`;
    return `Disponible (${libres})`;
  }

  obtenerClaseBarra(bus: BusItem): string {
    if (bus.enMantenimiento) return 'bg-amber-500';
    const ocupacion = this.calcularOcupacionPorBus(bus);
    if (ocupacion >= 85) return 'bg-red-500';
    if (ocupacion >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  obtenerClaseBadgeMantenimiento(estado: string): string {
    switch (estado) {
      case 'EN_MANTENIMIENTO': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'PROGRAMADO': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'FINALIZADO': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELADO': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  obtenerPuntoMantenimiento(estado: string): string {
    switch (estado) {
      case 'EN_MANTENIMIENTO': return 'bg-amber-500 animate-pulse';
      case 'PROGRAMADO': return 'bg-blue-500';
      case 'FINALIZADO': return 'bg-emerald-500';
      case 'CANCELADO': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  }

  formatearEstadoMantenimiento(estado: string): string {
    switch (estado) {
      case 'EN_MANTENIMIENTO': return 'En Taller';
      case 'PROGRAMADO': return 'Programado';
      case 'FINALIZADO': return 'Finalizado';
      case 'CANCELADO': return 'Cancelado';
      default: return estado;
    }
  }

  verDetalles(bus: BusItem) {
    this.busDetalle = bus;
    this.historialBusDetalle = this.mantenimientos.filter(m => m.busId === bus.id);
  }

  cerrarDetalles() {
    this.busDetalle = null;
    this.historialBusDetalle = [];
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.busFormulario = { id: null, placa: '', modelo: '', capacidad: 40 };
    this.erroresFormulario = {};
    this.mostrarModal = true;
  }

  abrirModalEditar(bus: BusItem) {
    this.modoEdicion = true;
    this.busFormulario = { ...bus };
    this.erroresFormulario = {};
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  validarFormularioEnTiempoReal() {
    this.erroresFormulario = {};
    if (!this.busFormulario.placa?.trim()) {
      this.erroresFormulario.placa = 'La placa oficial es requerida (ej. ABC-123).';
    } else if (this.busFormulario.placa.trim().length < 6) {
      this.erroresFormulario.placa = 'La placa debe tener al menos 6 caracteres.';
    }

    if (!this.busFormulario.modelo?.trim()) {
      this.erroresFormulario.modelo = 'El modelo o fabricante es obligatorio.';
    }

    if (
      this.busFormulario.capacidad === null ||
      this.busFormulario.capacidad === undefined ||
      this.busFormulario.capacidad < 10 ||
      this.busFormulario.capacidad > 80
    ) {
      this.erroresFormulario.capacidad = 'La capacidad debe situarse entre 10 y 80 asientos.';
    }
  }

  formularioValido(): boolean {
    const p = this.busFormulario.placa?.trim();
    const m = this.busFormulario.modelo?.trim();
    const c = this.busFormulario.capacidad;
    if (!p || p.length < 6 || !m || c === null || c === undefined || c < 10 || c > 80) return false;
    return true;
  }

  mostrarNotificacion(texto: string, tipo: 'exito' | 'error') {
    this.mensajeToast = { texto, tipo };
    setTimeout(() => {
      if (this.mensajeToast.texto === texto) {
        this.mensajeToast.texto = '';
        this.cdr.detectChanges();
      }
    }, 4500);
  }

  guardarBus() {
    if (!this.formularioValido()) return;
    this.guardando = true;

    if (this.modoEdicion && this.busFormulario.id) {
      this.flotaService.updateBus(this.busFormulario.id, this.busFormulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.mostrarNotificacion(`Autobús #${this.busFormulario.id} (${this.busFormulario.placa}) actualizado correctamente.`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.guardando = false;
          this.mostrarNotificacion('Error al actualizar bus: ' + (err.error?.mensaje || err.message), 'error');
        }
      });
    } else {
      const nuevo = {
        placa: this.busFormulario.placa.toUpperCase().trim(),
        modelo: this.busFormulario.modelo.trim(),
        capacidad: this.busFormulario.capacidad,
        asientosDisponibles: this.busFormulario.capacidad
      };
      this.flotaService.createBus(nuevo).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.mostrarNotificacion(`Autobús ${nuevo.placa} registrado exitosamente.`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.guardando = false;
          this.mostrarNotificacion('Error al registrar bus: ' + (err.error?.mensaje || err.message), 'error');
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
          this.mostrarNotificacion(`Bus ${bus.placa} reiniciado a ${bus.capacidad} asientos libres.`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.mostrarNotificacion('Error al reiniciar asientos: ' + (err.error?.mensaje || err.message), 'error');
        }
      });
    }
  }

  eliminarBus(id: number) {
    if (confirm(`¿Está seguro de eliminar el autobús #${id}?`)) {
      this.flotaService.deleteBus(id).subscribe({
        next: () => {
          this.mostrarNotificacion(`Autobús #${id} eliminado correctamente.`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.mostrarNotificacion('Error al eliminar bus: ' + (err.error?.mensaje || err.message), 'error');
        }
      });
    }
  }

  // --- Novedades Operativas / Incidencias para Chofer o Supervisor ---
  abrirModalIncidencia(bus: BusItem) {
    this.busIncidencia = bus;
    this.incidenciaForm = {
      tipo: 'PREVENTIVO',
      descripcion: `Inspección solicitada para Bus ${bus.placa}`,
      taller: 'Taller Central TransSync'
    };
  }

  confirmarIncidencia() {
    if (!this.busIncidencia || !this.incidenciaForm.descripcion.trim()) return;

    const hoy = new Date().toISOString().slice(0, 10);
    const payload = {
      busId: this.busIncidencia.id,
      tipo: this.incidenciaForm.tipo,
      descripcion: this.incidenciaForm.descripcion,
      fechaProgramada: hoy,
      costo: 250,
      taller: this.incidenciaForm.taller || 'Taller Central TransSync'
    };

    this.flotaService.programarMantenimiento(payload).subscribe({
      next: () => {
        this.busIncidencia = null;
        this.mostrarNotificacion('Novedad mecánica registrada para taller preventivo.', 'exito');
        this.recargarTodo();
      },
      error: (err: any) => {
        this.mostrarNotificacion('Error al registrar novedad: ' + (err.error?.mensaje || err.message), 'error');
      }
    });
  }

  // --- Métodos de Mantenimiento ---
  abrirModalProgramarMantenimiento() {
    this.mantenimientoForm = {
      busId: this.buses.length > 0 ? this.buses[0].id : null,
      tipoMantenimiento: 'PREVENTIVO',
      descripcion: '',
      tallerAsignado: 'Taller Central TransSync',
      costoEstimado: 350,
      fechaProgramada: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    };
    this.mostrarModalMantenimiento = true;
  }

  abrirModalProgramarParaBus(bus: BusItem) {
    this.mantenimientoForm = {
      busId: bus.id,
      tipoMantenimiento: 'PREVENTIVO',
      descripcion: `Mantenimiento preventivo programado para unidad ${bus.placa}`,
      tallerAsignado: 'Taller Central TransSync',
      costoEstimado: 350,
      fechaProgramada: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    };
    this.mostrarModalMantenimiento = true;
  }

  cerrarModalMantenimiento() {
    this.mostrarModalMantenimiento = false;
  }

  mantenimientoValido(): boolean {
    return !!(this.mantenimientoForm.busId && this.mantenimientoForm.descripcion?.trim() && this.mantenimientoForm.fechaProgramada);
  }

  guardarMantenimiento() {
    if (!this.mantenimientoValido()) return;
    this.guardandoMantenimiento = true;

    // Formato YYYY-MM-DD para LocalDate de Spring Boot
    let fecha = this.mantenimientoForm.fechaProgramada;
    if (fecha.includes('T')) {
      fecha = fecha.split('T')[0];
    } else if (fecha.length > 10) {
      fecha = fecha.slice(0, 10);
    }

    const payload = {
      busId: this.mantenimientoForm.busId,
      tipo: this.mantenimientoForm.tipoMantenimiento,
      descripcion: this.mantenimientoForm.descripcion,
      fechaProgramada: fecha,
      costo: Number(this.mantenimientoForm.costoEstimado || 350),
      taller: this.mantenimientoForm.tallerAsignado || 'Taller Central TransSync'
    };

    this.flotaService.programarMantenimiento(payload).subscribe({
      next: (resp: any) => {
        this.guardandoMantenimiento = false;
        this.cerrarModalMantenimiento();
        this.mostrarNotificacion('Mantenimiento programado correctamente.', 'exito');
        this.recargarTodo();
      },
      error: (err: any) => {
        this.guardandoMantenimiento = false;
        this.mostrarNotificacion('Error al programar mantenimiento: ' + (err.error?.mensaje || err.message), 'error');
      }
    });
  }

  iniciarMantenimiento(m: MantenimientoItem) {
    if (!m.id) return;
    if (confirm(`¿Ingresar el bus ${m.busPlaca || '#' + m.busId} al taller? El bus quedará INHABILITADO para reservas hasta su liberación.`)) {
      this.flotaService.iniciarMantenimiento(m.id).subscribe({
        next: () => {
          this.mostrarNotificacion(`Bus ${m.busPlaca || '#' + m.busId} ingresó a taller. Reservas bloqueadas (409 Conflict).`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.mostrarNotificacion('Error al iniciar mantenimiento: ' + (err.error?.mensaje || err.message), 'error');
        }
      });
    }
  }

  abrirModalFinalizarMantenimiento(m: MantenimientoItem) {
    this.mantenimientoAFinalizar = m;
    this.formFinalizar = {
      costoReal: m.costoEstimado || 350,
      observacionesFinales: 'Mantenimiento preventivo completado con éxito. Inspección vehicular y frenos aprobados.'
    };
  }

  confirmarFinalizarMantenimiento() {
    if (!this.mantenimientoAFinalizar?.id) return;
    const mId = this.mantenimientoAFinalizar.id;
    const payload = {
      costo: Number(this.formFinalizar.costoReal || 350),
      observaciones: this.formFinalizar.observacionesFinales
    };
    this.flotaService.finalizarMantenimiento(mId, payload).subscribe({
      next: () => {
        this.mantenimientoAFinalizar = null;
        this.mostrarNotificacion('Mantenimiento finalizado con éxito. Unidad devuelta a servicio operativo.', 'exito');
        this.recargarTodo();
      },
      error: (err: any) => {
        this.mostrarNotificacion('Error al finalizar mantenimiento: ' + (err.error?.mensaje || err.message), 'error');
      }
    });
  }

  liberarBusDeMantenimiento(bus: BusItem) {
    const mant = this.mantenimientos.find(m => m.busId === bus.id && m.estado === 'EN_MANTENIMIENTO');
    if (mant) {
      this.abrirModalFinalizarMantenimiento(mant);
    } else {
      this.mostrarNotificacion('No se encontró registro activo en taller para este autobús.', 'error');
    }
  }

  cancelarMantenimiento(m: MantenimientoItem) {
    if (!m.id) return;
    const motivo = prompt('Ingrese el motivo de la cancelación:', 'Reprogramación de itinerario de flota');
    if (motivo !== null) {
      this.flotaService.cancelarMantenimiento(m.id, motivo).subscribe({
        next: () => {
          this.mostrarNotificacion('Intervención cancelada.', 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.mostrarNotificacion('Error al cancelar: ' + (err.error?.mensaje || err.message), 'error');
        }
      });
    }
  }
}
