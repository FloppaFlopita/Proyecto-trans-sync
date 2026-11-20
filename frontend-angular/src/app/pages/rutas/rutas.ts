import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutasService, RutaItem, RutaEstadisticas, RutaAuditoriaItem } from '../../services/rutas.service';
import { FlotaService } from '../../services/flota.service';
import { AuthService } from '../../services/auth.service';

interface BusFlotaItem {
  id: number;
  placa: string;
  modelo: string;
  capacidad: number;
  asientosDisponibles: number;
  enMantenimiento?: boolean;
}

@Component({
  selector: 'app-rutas',
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

      <!-- ENCABEZADO LIMPIO CON SELECTOR DE PESTAÑAS (RUTAS VS FLOTA) -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              TransSync Interprovincial
            </span>
            <span class="text-xs text-slate-400 font-medium">Viajes Confortables & Seguros</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            {{ pestanaActiva === 'rutas' ? 'Rutas y Salidas Programadas' : 'Nuestra Flota de Autobuses' }}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            {{ pestanaActiva === 'rutas' 
               ? 'Encuentra tu próximo destino con tarifas oficiales garantizadas y salidas puntuales.' 
               : 'Conoce nuestras modernas unidades vehiculares, equipamiento y comodidad a bordo.' }}
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- PESTAÑAS MODERNAS Y LIMPIAS -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl">
            <button (click)="pestanaActiva = 'rutas'"
                    [class]="pestanaActiva === 'rutas' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'"
                    class="px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              Rutas y Salidas
            </button>
            <button (click)="pestanaActiva = 'flota'"
                    [class]="pestanaActiva === 'flota' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'"
                    class="px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Nuestra Flota ({{ busesFlota.length }})
            </button>
          </div>

          <!-- Botón Nueva Ruta (Exclusivo Administrador) -->
          <button *ngIf="modoVista === 'admin' && pestanaActiva === 'rutas'"
                  (click)="abrirModalCrear()"
                  class="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-600/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Ruta
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- PESTAÑA 1: CATÁLOGO DE RUTAS Y HORARIOS -->
      <!-- ========================================== -->
      <ng-container *ngIf="pestanaActiva === 'rutas'">

        <!-- BANNER COMERCIAL ESTÉTICO Y ELEGANTE DE RUTAS (AL ESTILO DE FLOTA) -->
        <div class="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div class="space-y-2 max-w-xl">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
              Salidas Diarias Garantizadas
            </span>
            <h2 class="text-2xl font-black tracking-tight">Conectando los Mejores Destinos del Sur</h2>
            <p class="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Viajes directos con puntualidad garantizada, tarifas oficiales sin comisiones ocultas y equipaje de bodega incluido en tu boleto.
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">🛡️</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">SOAT Activo</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">100% Cobertura</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">⏱️</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">Puntualidad</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">Salidas fijas</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">🎟️</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">Pase Digital</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">Embarque DNI</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">🧳</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">Equipaje</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">20 kg incluido</p>
            </div>
          </div>
        </div>

        <!-- BUSCADOR MINIMALISTA Y LIMPIO -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            
            <!-- Origen -->
            <div class="md:col-span-4">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ciudad de Origen</label>
              <div class="relative">
                <select [(ngModel)]="filtroOrigen"
                        class="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-slate-50/50">
                  <option value="">Todos los Orígenes</option>
                  <option *ngFor="let o of listaOrigenes" [value]="o">{{ o }}</option>
                </select>
              </div>
            </div>

            <!-- Botón Invertir Trayecto (Origen ⇄ Destino) -->
            <div class="md:col-span-1 flex justify-center pt-4 md:pt-5">
              <button (click)="invertirTrayecto()"
                      type="button"
                      title="Invertir origen y destino"
                      class="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-600 hover:text-teal-700 transition-colors shadow-sm flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
              </button>
            </div>

            <!-- Destino -->
            <div class="md:col-span-4">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ciudad de Destino</label>
              <div class="relative">
                <select [(ngModel)]="filtroDestino"
                        class="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-slate-50/50">
                  <option value="">Todos los Destinos</option>
                  <option *ngFor="let d of listaDestinos" [value]="d">{{ d }}</option>
                </select>
              </div>
            </div>

            <!-- Ordenar por -->
            <div class="md:col-span-2">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ordenar</label>
              <select [(ngModel)]="criterioOrden"
                      class="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-slate-50/50">
                <option value="precio_asc">Menor Tarifa</option>
                <option value="precio_desc">Mayor Tarifa</option>
                <option value="origen_asc">Origen (A-Z)</option>
                <option value="destino_asc">Destino (A-Z)</option>
              </select>
            </div>

          </div>

          <!-- Indicador y Limpiar -->
          <div *ngIf="filtroOrigen || filtroDestino || criterioOrden !== 'precio_asc'"
               class="flex items-center justify-between text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100">
            <span>Filtro activo: <strong>{{ rutasFiltradas.length }}</strong> salidas encontradas</span>
            <button (click)="limpiarFiltros()"
                    class="text-xs text-teal-700 hover:text-teal-900 font-bold">
              Restablecer filtros
            </button>
          </div>
        </div>

        <!-- MENSAJE DE ERROR -->
        <div *ngIf="errorMensaje"
             class="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center justify-between">
          <p class="text-xs sm:text-sm font-medium">{{ errorMensaje }}</p>
          <button (click)="cargarRutas()" class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
            Reintentar
          </button>
        </div>

        <!-- ESTADO DE CARGA -->
        <div *ngIf="cargando" class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div class="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm font-bold text-slate-700">Cargando salidas y tarifas oficiales...</p>
        </div>

        <!-- GRILLA DE RUTAS (TARJETAS VISUALMENTE IMPECABLES) -->
        <div *ngIf="!cargando && rutasFiltradas.length > 0"
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let r of rutasFiltradas"
               class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <!-- Recuadro superior estilizado con gradiente (estilo similar a la tarjeta de flota) -->
              <div class="h-28 rounded-xl bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-100 p-4 mb-4 flex items-center justify-between relative overflow-hidden">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Corredor Directo</span>
                    <p class="text-lg font-black text-slate-900 leading-tight">
                      {{ formatearCiudad(r.origen) }} ➔ {{ formatearCiudad(r.destino) }}
                    </p>
                    <p class="text-[11px] text-slate-500 mt-0.5">{{ estimarDuracion(r.origen, r.destino) }} aprox.</p>
                  </div>
                </div>

                <div class="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <span *ngIf="esMejorTarifa(r) && rutasFiltradas.length > 1"
                        class="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    ★ Mejor Tarifa
                  </span>
                  <span class="text-[9px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                    {{ obtenerTipoHorario(r.horario) }}
                  </span>
                </div>
              </div>

              <!-- Amenidades y Confort Incluido -->
              <div class="flex items-center gap-1.5 mb-3.5 flex-wrap">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                  <span>💺</span> Semi-Cama
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                  <span>🧳</span> 20kg Bodega
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-100">
                  <span>🛡️</span> Seguro SOAT
                </span>
              </div>

              <!-- Ficha de Horario y Tarifa -->
              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 mb-4">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500 font-medium">Salida Programada</span>
                  <span class="font-bold text-slate-900 font-mono">{{ r.horario }}</span>
                </div>
                <div class="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span class="text-slate-600 text-xs font-semibold">Tarifa Oficial</span>
                  <div class="text-right">
                    <span class="font-black text-teal-700 text-2xl">S/. {{ (r.precio || 0).toFixed(2) }}</span>
                    <span class="block text-[10px] text-slate-400">por pasajero</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button (click)="comprarEnRuta(r)"
                      class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
                Elegir Asiento
              </button>

              <button (click)="verDetalles(r)"
                      title="Ver detalles del viaje"
                      class="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>

              <!-- Acciones de Administrador -->
              <ng-container *ngIf="modoVista === 'admin'">
                <button (click)="duplicarRuta(r)"
                        title="Duplicar salida"
                        class="p-2.5 rounded-xl text-teal-600 hover:bg-teal-50 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
                <button (click)="abrirModalEditar(r)"
                        title="Editar Ruta"
                        class="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="eliminarRuta(r.id)"
                        title="Eliminar Ruta"
                        class="p-2.5 rounded-xl text-red-500 hover:bg-red-50 border border-slate-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- ESTADO VACÍO -->
        <div *ngIf="!cargando && rutasFiltradas.length > 0 === false"
             class="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-900 max-w-md mx-auto">No encontramos salidas disponibles para el filtro seleccionado.</h3>
          <button (click)="limpiarFiltros()"
                  class="mt-3 px-4 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            Ver todas las salidas disponibles
          </button>
        </div>

        <!-- SECCIÓN DE AUDITORÍA (COMPACTA Y EXCLUSIVA DE ADMIN) -->
        <div *ngIf="modoVista === 'admin'" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Historial de Auditoría Transaccional</h3>
              <p class="text-[11px] text-slate-500">Registro inmutable sincronizado con PostgreSQL.</p>
            </div>
            <button (click)="cargarHistorialAuditoria()" class="text-xs text-teal-700 font-bold hover:underline">
              Actualizar Auditoría
            </button>
          </div>
          <div class="overflow-x-auto max-h-52 overflow-y-auto">
            <table class="w-full text-xs text-left text-slate-600">
              <thead class="text-[10px] uppercase bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  <th class="px-3.5 py-2">Fecha</th>
                  <th class="px-3.5 py-2">Operación</th>
                  <th class="px-3.5 py-2">Ruta</th>
                  <th class="px-3.5 py-2">Tarifa</th>
                  <th class="px-3.5 py-2">Detalles</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let a of historialAuditoria" class="hover:bg-slate-50">
                  <td class="px-3.5 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">{{ formatearFechaAudit(a.fechaOperacion) }}</td>
                  <td class="px-3.5 py-2 font-bold">{{ a.tipoOperacion }}</td>
                  <td class="px-3.5 py-2 font-semibold">{{ formatearCiudad(a.origen) }} ➔ {{ formatearCiudad(a.destino) }} ({{ a.horario }})</td>
                  <td class="px-3.5 py-2 font-bold text-teal-700">S/. {{ (a.precio || 0).toFixed(2) }}</td>
                  <td class="px-3.5 py-2 text-slate-500 truncate max-w-xs">{{ a.detallesNuevos || a.detallesAnteriores || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </ng-container>

      <!-- ========================================== -->
      <!-- PESTAÑA 2: NUESTRA FLOTA (VISUAL, CREATIVO Y BONITO) -->
      <!-- ========================================== -->
      <ng-container *ngIf="pestanaActiva === 'flota'">
        
        <!-- Tarjeta de Presentación Creativa de la Flota -->
        <div class="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div class="space-y-2 max-w-xl">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
              Flota Certificada SUTRAN
            </span>
            <h2 class="text-2xl font-black tracking-tight">Viaja en la Flota Más Moderna del Sur</h2>
            <p class="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Unidades de última generación equipadas con suspensión neumática para máxima suavidad, climatización ecológica y monitoreo satelital GPS 24/7.
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">💺</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">Semi-Cama</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">140° a 160°</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">❄️</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">Clima A/C</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">Purificado</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">🔌</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">Carga USB</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">Individual</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl border border-white/15 text-center min-w-[5.2rem]">
              <span class="text-lg">🛰️</span>
              <p class="text-[11px] font-bold text-white mt-0.5 whitespace-nowrap">GPS SUTRAN</p>
              <p class="text-[10px] text-teal-200 whitespace-nowrap">Monitoreado</p>
            </div>
          </div>
        </div>

        <!-- Grilla Visual de Autobuses Disponibles -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let b of busesFlota"
               class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <!-- Ilustración Vectorial Estilizada del Autobús -->
              <div class="h-28 rounded-xl bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-100 flex items-center justify-center p-4 mb-4 relative overflow-hidden">
                <div class="absolute top-2 right-2">
                  <span [class]="b.enMantenimiento ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'"
                        class="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                    {{ b.enMantenimiento ? 'En Revisión Preventiva' : 'Apto para Viajar' }}
                  </span>
                </div>

                <!-- Icono estilizado grande de Bus -->
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <div>
                    <span class="text-[10px] font-mono font-bold text-slate-400">PLACA OFICIAL</span>
                    <p class="text-xl font-black text-slate-900 font-mono tracking-tight">{{ b.placa }}</p>
                  </div>
                </div>
              </div>

              <!-- Modelo y Confort -->
              <div>
                <h3 class="text-base font-bold text-slate-900">{{ b.modelo }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">Categoría Premium Interprovincial · {{ b.capacidad }} asientos</p>
              </div>

              <!-- Disponibilidad en Tiempo Real -->
              <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 my-3.5 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-600 font-medium">Asientos Disponibles</span>
                  <span class="font-bold text-teal-700">{{ b.asientosDisponibles }} Libres</span>
                </div>
                <div class="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div class="h-full bg-teal-600 rounded-full"
                       [style.width.%]="calcularOcupacion(b)"></div>
                </div>
              </div>
            </div>

            <!-- Botón para ver salidas con este bus -->
            <div class="pt-3 border-t border-slate-100">
              <button (click)="pestanaActiva = 'rutas'"
                      [disabled]="b.enMantenimiento"
                      class="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm shadow-teal-600/20 flex items-center justify-center gap-1.5">
                <span>{{ b.enMantenimiento ? 'Unidad en Taller Preventivo' : 'Ver Salidas y Horarios' }}</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- MODAL DETALLE DE VIAJE -->
      <div *ngIf="rutaDetalle"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-150 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
              Itinerario de Viaje
            </span>
            <button (click)="cerrarDetalles()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="bg-teal-50/60 p-4 rounded-xl border border-teal-100">
            <p class="text-[10px] font-bold text-teal-800 uppercase tracking-wide">Corredor Directo</p>
            <p class="text-xl font-black text-slate-900">{{ formatearCiudad(rutaDetalle.origen) }} ➔ {{ formatearCiudad(rutaDetalle.destino) }}</p>
            <p class="text-xs text-slate-600 mt-1">{{ estimarDuracion(rutaDetalle.origen, rutaDetalle.destino) }} aprox. de viaje</p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p class="text-slate-500 font-medium">Horario de Salida</p>
              <p class="text-sm font-bold text-slate-900 mt-0.5">{{ rutaDetalle.horario }}</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p class="text-slate-500 font-medium">Tarifa Oficial</p>
              <p class="text-sm font-black text-teal-700 mt-0.5">S/. {{ (rutaDetalle.precio || 0).toFixed(2) }}</p>
            </div>
          </div>

          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p class="font-bold text-slate-800 text-[11px] uppercase">Condiciones del Servicio</p>
            <p>● Equipaje de bodega hasta 20 kg incluido sin costo adicional.</p>
            <p>● Presentarse 30 minutos antes con documento de identidad original.</p>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="cerrarDetalles()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cerrar
            </button>
            <button (click)="comprarEnRuta(rutaDetalle); cerrarDetalles()"
                    class="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md shadow-teal-600/20">
              Elegir Asiento
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR RUTA (ADMIN) -->
      <div *ngIf="mostrarModal"
           class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 class="text-base font-black text-slate-900">
              {{ modoEdicion ? 'Modificar Ruta #' + rutaFormulario.id : 'Registrar Nueva Ruta' }}
            </h3>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ciudad de Origen</label>
              <input [(ngModel)]="rutaFormulario.origen"
                     placeholder="Ej. Lima, Arequipa, Cusco..."
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ciudad de Destino</label>
              <input [(ngModel)]="rutaFormulario.destino"
                     placeholder="Ej. Puno, Tacna, Moquegua..."
                     class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Horario de Salida</label>
                <input [(ngModel)]="rutaFormulario.horario"
                       placeholder="Ej. 20:30 hrs"
                       class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Precio Boleto (S/.)</label>
                <input [(ngModel)]="rutaFormulario.precio"
                       type="number"
                       step="0.5"
                       placeholder="Ej. 85.00"
                       class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModal()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button (click)="guardarRuta()"
                    [disabled]="guardando || !formularioValido()"
                    class="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all shadow-md shadow-teal-600/20 disabled:opacity-50">
              {{ guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar Ruta' : 'Registrar Ruta') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class RutasComponent implements OnInit {
  rutas: RutaItem[] = [];
  busesFlota: BusFlotaItem[] = [];
  stats: RutaEstadisticas | null = null;
  historialAuditoria: RutaAuditoriaItem[] = [];
  cargando = false;
  errorMensaje = '';

  // Selector de Pestaña Activa ('rutas' | 'flota')
  pestanaActiva: 'rutas' | 'flota' = 'rutas';

  // Filtros limpios
  filtroOrigen = '';
  filtroDestino = '';
  criterioOrden = 'precio_asc';

  // Detalle de ruta
  rutaDetalle: RutaItem | null = null;

  // Modal Crear / Editar
  mostrarModal = false;
  modoEdicion = false;
  guardando = false;
  rutaFormulario: any = { id: null, origen: '', destino: '', horario: '08:00 hrs', precio: 50.0 };

  // Feedback Toast
  mensajeToast: { texto: string; tipo: 'exito' | 'error' } = { texto: '', tipo: 'exito' };

  // Perspectiva de Usuario (Admin vs Pasajero)
  modoVista: 'admin' | 'pasajero' = 'pasajero';
  esAdmin = false;

  constructor(
    private rutasService: RutasService,
    private flotaService: FlotaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.actualizarRol();
    this.authService.currentUser$.subscribe(() => {
      this.actualizarRol();
      if (this.esAdmin) {
        this.cargarHistorialAuditoria();
      }
      this.cdr.detectChanges();
    });
    this.recargarTodo();
  }

  private actualizarRol() {
    this.esAdmin = this.authService.isAdmin();
    this.modoVista = this.esAdmin ? 'admin' : 'pasajero';
  }

  recargarTodo() {
    this.cargarRutas();
    this.cargarBusesFlota();
    if (this.esAdmin) {
      this.cargarHistorialAuditoria();
    }
  }

  // Capitalización de nombres de ciudades
  formatearCiudad(ciudad: string): string {
    if (!ciudad) return '';
    return ciudad.charAt(0).toUpperCase() + ciudad.slice(1).toLowerCase();
  }

  // Invertir Trayecto (Origen ⇄ Destino)
  invertirTrayecto() {
    const temp = this.filtroOrigen;
    this.filtroOrigen = this.filtroDestino;
    this.filtroDestino = temp;
    this.cdr.detectChanges();
  }

  // Duplicar parámetros de una ruta existente (Admin)
  duplicarRuta(ruta: RutaItem) {
    this.modoEdicion = false;
    this.rutaFormulario = {
      id: null,
      origen: this.formatearCiudad(ruta.origen),
      destino: this.formatearCiudad(ruta.destino),
      horario: '14:00 hrs',
      precio: ruta.precio
    };
    this.mostrarModal = true;
  }

  cargarHistorialAuditoria() {
    this.rutasService.getHistorial().subscribe({
      next: (resp: any) => {
        if (resp && resp.datos) {
          this.historialAuditoria = resp.datos;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  formatearFechaAudit(fechaStr: string): string {
    if (!fechaStr) return '-';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return fechaStr;
    }
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
      error: () => {
        this.cargando = false;
        this.errorMensaje = 'No se pudo conectar con el servicio de rutas. Verifique su conexión.';
        this.cdr.detectChanges();
      }
    });
  }

  cargarBusesFlota() {
    this.flotaService.getBuses().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        this.busesFlota = datos;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  calcularOcupacion(b: BusFlotaItem): number {
    if (!b || !b.capacidad || b.capacidad <= 0) return 0;
    const disp = b.asientosDisponibles ?? 0;
    return Math.round((disp / b.capacidad) * 100);
  }

  get listaOrigenes(): string[] {
    const origenes = new Set(this.rutas.map(r => this.formatearCiudad(r.origen)).filter(Boolean));
    return Array.from(origenes).sort();
  }

  get listaDestinos(): string[] {
    const destinos = new Set(this.rutas.map(r => this.formatearCiudad(r.destino)).filter(Boolean));
    return Array.from(destinos).sort();
  }

  esMejorTarifa(ruta: RutaItem): boolean {
    if (!ruta || !ruta.precio || this.rutas.length === 0) return false;
    const precios = this.rutasFiltradas.map(r => r.precio || 0).filter(p => p > 0);
    if (precios.length === 0) return false;
    const min = Math.min(...precios);
    return Math.abs(ruta.precio - min) < 0.001;
  }

  get rutasFiltradas(): RutaItem[] {
    let resultado = [...this.rutas];

    // Filtro por origen seleccionado
    if (this.filtroOrigen) {
      resultado = resultado.filter(r => this.formatearCiudad(r.origen) === this.filtroOrigen);
    }

    // Filtro por destino seleccionado
    if (this.filtroDestino) {
      resultado = resultado.filter(r => this.formatearCiudad(r.destino) === this.filtroDestino);
    }

    // Criterio de ordenamiento
    switch (this.criterioOrden) {
      case 'precio_asc':
        resultado.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        break;
      case 'precio_desc':
        resultado.sort((a, b) => (b.precio || 0) - (a.precio || 0));
        break;
      case 'origen_asc':
        resultado.sort((a, b) => (a.origen || '').localeCompare(b.origen || ''));
        break;
      case 'destino_asc':
        resultado.sort((a, b) => (a.destino || '').localeCompare(b.destino || ''));
        break;
      default:
        resultado.sort((a, b) => a.id - b.id);
        break;
    }

    return resultado;
  }

  limpiarFiltros() {
    this.filtroOrigen = '';
    this.filtroDestino = '';
    this.criterioOrden = 'precio_asc';
  }

  obtenerTipoHorario(horario: string): string {
    if (!horario) return 'Programado';
    const h = horario.toLowerCase();
    if (h.includes('08:') || h.includes('09:') || h.includes('06:') || h.includes('07:') || h.includes('10:') || h.includes('11:') || h.includes('am')) {
      return 'Turno Mañana';
    }
    if (h.includes('12:') || h.includes('13:') || h.includes('14:') || h.includes('15:') || h.includes('16:') || h.includes('17:')) {
      return 'Turno Tarde';
    }
    return 'Turno Nocturno';
  }

  estimarDuracion(origen: string, destino: string): string {
    const par = `${origen?.toLowerCase()}-${destino?.toLowerCase()}`;
    if (par.includes('arequipa') && par.includes('lima')) return '~14 hrs';
    if (par.includes('cusco') && par.includes('puno')) return '~6.5 hrs';
    if (par.includes('lima') && par.includes('trujillo')) return '~8 hrs';
    if (par.includes('tacna') && par.includes('arequipa')) return '~5 hrs';
    return '~8.5 hrs';
  }

  verDetalles(ruta: RutaItem) {
    this.rutaDetalle = ruta;
  }

  cerrarDetalles() {
    this.rutaDetalle = null;
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
    const o = this.rutaFormulario.origen?.trim();
    const d = this.rutaFormulario.destino?.trim();
    const h = this.rutaFormulario.horario?.trim();
    const p = this.rutaFormulario.precio;
    if (!o || !d || !h || p === null || p === undefined || p <= 0) return false;
    if (o.toLowerCase() === d.toLowerCase()) return false;
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

  guardarRuta() {
    if (!this.formularioValido()) return;
    this.guardando = true;

    if (this.modoEdicion && this.rutaFormulario.id) {
      this.rutasService.updateRuta(this.rutaFormulario.id, this.rutaFormulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.mostrarNotificacion(`Ruta actualizada correctamente.`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.guardando = false;
          const msg = err.error?.mensaje || (err.error?.errores ? Object.values(err.error.errores).join(', ') : err.message);
          this.mostrarNotificacion('Error: ' + msg, 'error');
        }
      });
    } else {
      this.rutasService.createRuta(this.rutaFormulario).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.mostrarNotificacion('Nueva ruta registrada exitosamente.', 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.guardando = false;
          const msg = err.error?.mensaje || (err.error?.errores ? Object.values(err.error.errores).join(', ') : err.message);
          this.mostrarNotificacion('Error: ' + msg, 'error');
        }
      });
    }
  }

  eliminarRuta(id: number) {
    if (confirm(`¿Está seguro de eliminar esta ruta?`)) {
      this.rutasService.deleteRuta(id).subscribe({
        next: () => {
          this.mostrarNotificacion(`Ruta eliminada correctamente.`, 'exito');
          this.recargarTodo();
        },
        error: (err: any) => {
          this.mostrarNotificacion('Error al eliminar ruta: ' + (err.error?.mensaje || err.message), 'error');
        }
      });
    }
  }

  comprarEnRuta(ruta: RutaItem) {
    this.router.navigate(['/reservas'], { queryParams: { rutaId: ruta.id } });
  }
}
