import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ReservasService } from '../../services/reservas.service';
import { RutasService } from '../../services/rutas.service';
import { PagosService } from '../../services/pagos.service';
import { AuthService, UserSession } from '../../services/auth.service';

interface RutaOpcion {
  id: number;
  nombre: string;
  origen: string;
  destino: string;
  busId: number;
  precio: number;
  horario: string;
}

interface FilaAsiento {
  numeroFila: number;
  izqVentana: number;
  izqPasillo: number;
  derPasillo: number;
  derVentana: number;
}

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO CON SELECTOR DE ROL Y ESTADO -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              Terminal de Venta y Embarque
            </span>
            <span class="text-xs text-slate-500 font-medium">Sistema Integrado de Microservicios · TransSync</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Embarque y Boletos Interprovinciales
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
            Consulte rutas, seleccione asientos en tiempo real y emita su comprobante de pago electrónico.
          </p>
        </div>

        <!-- Selector de Perfil para la demostración -->
        <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span class="text-[11px] font-bold text-slate-500 px-2 uppercase">Perfil:</span>
          <button (click)="cambiarRol('cliente@transsync.com', 'cliente123')"
                  [class]="esCliente() ? 'bg-teal-600 text-white font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200">
            Pasajero / Cliente
          </button>
          <button (click)="cambiarRol('conductor@transsync.com', 'chofer123')"
                  [class]="esConductor() ? 'bg-teal-600 text-white font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200">
            Conductor
          </button>
          <button (click)="cambiarRol('admin@transsync.com', 'admin123')"
                  [class]="esAdmin() ? 'bg-teal-600 text-white font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200">
            Administrador
          </button>
        </div>
      </div>

      <!-- PESTAÑAS DE NAVEGACIÓN -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-1 text-sm font-medium">
        <button *ngIf="esCliente() || esAdmin()"
                (click)="tabActiva = 'reserva'"
                [class]="tabActiva === 'reserva' ? 'text-teal-700 border-b-2 border-teal-600 font-bold bg-teal-50/50' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2.5 rounded-t-xl transition-all">
          Comprar Boletos
        </button>

        <button *ngIf="esConductor() || esAdmin()"
                (click)="tabActiva = 'conductor'; cargarManifiesto()"
                [class]="tabActiva === 'conductor' ? 'text-teal-700 border-b-2 border-teal-600 font-bold bg-teal-50/50' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2.5 rounded-t-xl transition-all">
          Vista del Conductor (Plano y Pasajeros)
        </button>

        <button *ngIf="esAdmin()"
                (click)="tabActiva = 'ventas'; cargarVentas()"
                [class]="tabActiva === 'ventas' ? 'text-teal-700 border-b-2 border-teal-600 font-bold bg-teal-50/50' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2.5 rounded-t-xl transition-all">
          Auditoría de Ventas por Fecha
        </button>
      </div>

      <!-- ================= PESTAÑA 1: VENTA DE BOLETOS PARA EL PASAJERO ================= -->
      <div *ngIf="tabActiva === 'reserva'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- PLANO DEL BUS (7 Columnas) -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

          <!-- Selector de Rutas y Fechas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Seleccionar Ruta y Horario:</label>
              <select [(ngModel)]="rutaSeleccionadaId" (change)="alCambiarRuta()"
                      class="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-teal-500">
                <option *ngFor="let r of rutasDisponibles" [value]="r.id">
                  {{ r.nombre }} · S/ {{ r.precio.toFixed(2) }} ({{ r.horario }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha de Salida:</label>
              <input [(ngModel)]="fechaSeleccionada" (change)="cargarAsientosOcupados()" type="date"
                     class="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-teal-500"/>
            </div>
          </div>

          <!-- Información del Servicio Seleccionado -->
          <div class="flex items-center justify-between text-xs mb-4 px-3 py-2 bg-teal-50/60 rounded-xl border border-teal-100">
            <span class="font-bold text-teal-900">Unidad Asignada: Bus #{{ rutaActual.busId }}</span>
            <span class="text-slate-600">Tarifa por Pasaje: <strong class="text-slate-900 font-bold">S/ {{ rutaActual.precio.toFixed(2) }}</strong></span>
            <span class="text-slate-600">Salida: <strong class="text-slate-900 font-bold">{{ rutaActual.horario }}</strong></span>
          </div>

          <!-- ALERTA DE TIEMPO EXPIRADO -->
          <div *ngIf="alertaExpirada" class="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start justify-between animate-in fade-in">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">⚠️</span>
              <div>
                <p class="text-xs font-bold text-rose-900">¡Tiempo de reserva agotado!</p>
                <p class="text-[11px] text-rose-700">Los 5 minutos han transcurrido y sus asientos han sido liberados automáticamente para otros pasajeros.</p>
              </div>
            </div>
            <button (click)="alertaExpirada = false" class="text-xs font-bold text-rose-600 hover:text-rose-900 p-1">✕</button>
          </div>

          <!-- BANNER DE RESERVA TEMPORAL CON CRONÓMETRO EN NÚMEROS CLAROS -->
          <div *ngIf="reservaTemporalIniciada && tiempoRestanteSegundos > 0 && asientosSeleccionados.length > 0"
               class="mb-5 p-4 rounded-2xl border transition-all shadow-sm"
               [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-50/95 border-rose-300 text-rose-950' : 'bg-amber-50/90 border-amber-300 text-amber-950'">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Información de los asientos -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs"
                     [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-500 text-white'">
                  ⏱️
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black tracking-tight uppercase"
                          [ngClass]="tiempoRestanteSegundos < 60 ? 'text-rose-700' : 'text-amber-800'">
                      Reserva Temporal Activa
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-200 text-rose-900 animate-pulse' : 'bg-amber-200 text-amber-900'">
                      {{ tiempoRestanteSegundos < 60 ? '¡Por expirar!' : 'En espera' }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-700 mt-0.5">
                    Asiento(s) bloqueado(s): <strong class="text-slate-900 font-black text-sm">{{ asientosSeleccionados.join(', ') }}</strong>
                  </p>
                </div>
              </div>

              <!-- CRONÓMETRO EN NÚMEROS DIGITALES CLAROS -->
              <div class="flex items-center gap-2 self-start sm:self-center">
                <!-- Caja de Minutos -->
                <div class="flex flex-col items-center">
                  <div class="w-12 h-11 rounded-xl flex items-center justify-center font-mono font-black text-xl shadow-inner border"
                       [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-600 text-white border-rose-700 animate-pulse' : 'bg-slate-900 text-amber-300 border-slate-800'">
                    {{ minutosRestantesFormateados }}
                  </div>
                  <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">MIN</span>
                </div>

                <span class="font-mono text-xl font-black text-slate-700 pb-3">:</span>

                <!-- Caja de Segundos -->
                <div class="flex flex-col items-center">
                  <div class="w-12 h-11 rounded-xl flex items-center justify-center font-mono font-black text-xl shadow-inner border"
                       [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-600 text-white border-rose-700 animate-pulse' : 'bg-slate-900 text-amber-300 border-slate-800'">
                    {{ segundosRestantesFormateados }}
                  </div>
                  <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">SEG</span>
                </div>

                <!-- Botón Cancelar/Liberar -->
                <button (click)="cancelarReservaTemporal()"
                        class="ml-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
                        title="Liberar asientos ahora mismo">
                  Liberar
                </button>
              </div>
            </div>

            <!-- Barra de Progreso del Tiempo -->
            <div class="w-full bg-slate-200/90 h-2 rounded-full overflow-hidden mt-3 shadow-inner">
              <div class="h-full transition-all duration-1000 ease-linear rounded-full"
                   [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'"
                   [style.width.%]="porcentajeTiempoRestante">
              </div>
            </div>

            <!-- Texto descriptivo numérico abajo de la barra -->
            <div class="flex justify-between items-center text-[11px] font-semibold mt-1.5 px-0.5"
                 [ngClass]="tiempoRestanteSegundos < 60 ? 'text-rose-700' : 'text-amber-800'">
              <span>Quedan exactamente <strong>{{ tiempoRestanteSegundos }} segundos</strong> ({{ minutosRestantesFormateados }} min {{ segundosRestantesFormateados }} seg)</span>
              <span>Tiempo total: 05:00 min</span>
            </div>

          </div>

          <!-- LEYENDA CLARA DE ASIENTOS -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-md bg-white border-2 border-emerald-500 shadow-xs"></span>
              <span class="font-medium text-slate-700">Disponible</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-md bg-teal-600 border-2 border-teal-700 shadow-xs"></span>
              <span class="font-medium text-slate-700">Seleccionado</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-md bg-amber-100 border-2 border-amber-500 shadow-xs"></span>
              <span class="font-medium text-slate-700">En Reserva</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-md bg-rose-100 border-2 border-rose-500 shadow-xs"></span>
              <span class="font-medium text-slate-700">Ocupado</span>
            </div>
          </div>

          <!-- PLANO DEL BUS INTERPROVINCIAL -->
          <div class="max-w-[460px] mx-auto rounded-[36px] border-2 border-slate-300 bg-slate-100 p-4 shadow-inner relative">

            <!-- CABINA DELANTERA -->
            <div class="mb-4 pb-3 border-b border-slate-300">
              <div class="h-9 rounded-t-[28px] bg-gradient-to-b from-sky-200 to-sky-100 border-t-2 border-x-2 border-sky-400 flex items-center justify-center mb-3">
                <span class="text-[10px] font-bold tracking-widest text-sky-800 uppercase">Parabrisas Frontal</span>
              </div>
              <div class="flex items-center justify-between px-2 text-xs">
                <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span class="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">C</span>
                  <span class="text-xs font-bold text-slate-800">Puesto Chofer</span>
                </div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Pasillo Central ↓</span>
                <div class="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                  <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">P</span>
                  <span class="text-xs font-bold text-emerald-800">Puerta Entrada</span>
                </div>
              </div>
            </div>

            <!-- DISTRIBUCIÓN DE ASIENTOS CON PASILLO CENTRAL -->
            <div class="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              <div *ngFor="let fila of filasBus"
                   class="flex items-center justify-between p-1 bg-white rounded-xl border border-slate-200 shadow-xs">

                <!-- Asientos Izquierda (Ventana / Pasillo) -->
                <div class="flex items-center gap-2">
                  <button (click)="toggleSeleccionAsiento(fila.izqVentana)"
                          [disabled]="esAsientoOcupado(fila.izqVentana) || esAsientoEnReserva(fila.izqVentana)"
                          [class]="obtenerClaseBotonAsiento(fila.izqVentana)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="{{ obtenerTooltipAsientoCliente(fila.izqVentana) }}">
                    <span>{{ fila.izqVentana }}</span>
                    <span class="text-[8px] font-semibold tracking-tighter opacity-75">
                      {{ obtenerTextoEstadoAsiento(fila.izqVentana) }}
                    </span>
                  </button>

                  <button (click)="toggleSeleccionAsiento(fila.izqPasillo)"
                          [disabled]="esAsientoOcupado(fila.izqPasillo) || esAsientoEnReserva(fila.izqPasillo)"
                          [class]="obtenerClaseBotonAsiento(fila.izqPasillo)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="{{ obtenerTooltipAsientoCliente(fila.izqPasillo) }}">
                    <span>{{ fila.izqPasillo }}</span>
                    <span class="text-[8px] font-semibold tracking-tighter opacity-75">
                      {{ obtenerTextoEstadoAsiento(fila.izqPasillo) }}
                    </span>
                  </button>
                </div>

                <!-- Pasillo central -->
                <div class="w-8 flex flex-col items-center justify-center">
                  <span class="text-[9px] font-bold text-slate-400">F{{ fila.numeroFila }}</span>
                </div>

                <!-- Asientos Derecha (Pasillo / Ventana) -->
                <div class="flex items-center gap-2">
                  <button (click)="toggleSeleccionAsiento(fila.derPasillo)"
                          [disabled]="esAsientoOcupado(fila.derPasillo) || esAsientoEnReserva(fila.derPasillo)"
                          [class]="obtenerClaseBotonAsiento(fila.derPasillo)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="{{ obtenerTooltipAsientoCliente(fila.izqPasillo) }}">
                    <span>{{ fila.derPasillo }}</span>
                    <span class="text-[8px] font-semibold tracking-tighter opacity-75">
                      {{ obtenerTextoEstadoAsiento(fila.derPasillo) }}
                    </span>
                  </button>

                  <button (click)="toggleSeleccionAsiento(fila.derVentana)"
                          [disabled]="esAsientoOcupado(fila.derVentana) || esAsientoEnReserva(fila.derVentana)"
                          [class]="obtenerClaseBotonAsiento(fila.derVentana)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="{{ obtenerTooltipAsientoCliente(fila.izqVentana) }}">
                    <span>{{ fila.derVentana }}</span>
                    <span class="text-[8px] font-semibold tracking-tighter opacity-75">
                      {{ obtenerTextoEstadoAsiento(fila.derVentana) }}
                    </span>
                  </button>
                </div>

              </div>
            </div>

            <!-- PARTE TRASERA DEL BUS -->
            <div class="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between px-2 text-xs">
              <span class="text-[10px] font-bold text-slate-600">Servicios Higiénicos</span>
              <span class="text-[10px] font-semibold text-slate-400 uppercase">Zona Posterior</span>
              <span class="text-[10px] font-bold text-rose-700">Salida de Emergencia</span>
            </div>

          </div>
        </div>

        <!-- FORMULARIO LIMPIO DEL PASAJERO (5 Columnas) -->
        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 class="text-base font-bold text-slate-900">Datos del Pasajero</h2>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Paso 1 de 2</span>
            </div>

            <p class="text-xs text-slate-600 mb-4">
              Ingrese los datos del pasajero titular para la emisión del boleto de viaje.
            </p>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Nombre y Apellidos Completos <span class="text-red-500">*</span>
                </label>
                <input [(ngModel)]="formulario.nombrePasajero" placeholder="Ingrese nombre y apellido"
                       class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-teal-600 transition-all"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    DNI / Documento <span class="text-red-500">*</span>
                  </label>
                  <input [(ngModel)]="formulario.dniPasajero" placeholder="8 dígitos" maxlength="10"
                         class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-teal-600 transition-all font-mono"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular <span class="text-red-500">*</span>
                  </label>
                  <input [(ngModel)]="formulario.telefonoPasajero" placeholder="Ej: 987654321"
                         class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-teal-600 transition-all"/>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico <span class="text-slate-400 font-normal">(Opcional para recibir comprobante)</span>
                </label>
                <input [(ngModel)]="formulario.emailPasajero" placeholder="ejemplo@correo.com"
                       class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-teal-600 transition-all"/>
              </div>
            </div>

            <!-- Resumen de Compra -->
            <div class="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div class="flex justify-between text-xs text-slate-600">
                <span>Ruta seleccionada:</span>
                <span class="font-bold text-slate-900">{{ rutaActual.nombre }}</span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span>Asientos seleccionados:</span>
                <span class="font-bold text-teal-700 text-sm">
                  {{ asientosSeleccionados.length > 0 ? asientosSeleccionados.join(', ') : 'Ninguno' }}
                </span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span>Tarifa unitaria:</span>
                <span class="font-semibold text-slate-800">S/ {{ rutaActual.precio.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span *ngIf="sesionActual">Puntos a recibir (Sesión activa):</span>
                <span *ngIf="sesionActual" class="font-bold text-teal-700">+{{ calcularPuntosFidelizacion() }} {{ calcularPuntosFidelizacion() === 1 ? 'Punto' : 'Puntos' }}</span>
              </div>
              <div class="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-800">Total a Pagar (inc. IGV):</span>
                <span class="text-2xl font-black text-slate-900">
                  S/ {{ (asientosSeleccionados.length * rutaActual.precio).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Mensaje discreto de beneficios para pasajeros no autenticados -->
            <div *ngIf="!sesionActual" class="mt-4 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between gap-3 shadow-sm">
              <div class="space-y-0.5">
                <p class="font-bold text-teal-900 text-xs">Recibe puntos al iniciar sesión</p>
                <p class="text-[11px] text-teal-700">1 pasaje = 1 pto · 2 pasajes = 2 ptos · 3 a más = 5 ptos</p>
              </div>
              <button (click)="abrirModalPerfil()" type="button" class="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs whitespace-nowrap transition-colors shadow-sm">
                Iniciar sesión
              </button>
            </div>

            <!-- Botón de Continuar -->
          <div class="mt-6 space-y-2">
            <button (click)="abrirPasarelaPago()"
                    [disabled]="asientosSeleccionados.length === 0"
                    class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2"
                    [class]="asientosSeleccionados.length > 0
                      ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'">
              <span>Continuar al Pago (S/ {{ (asientosSeleccionados.length * rutaActual.precio).toFixed(2) }})</span>
            </button>

            <p *ngIf="mensajeErrorForm" class="text-xs text-rose-700 font-medium text-center p-2 rounded-lg bg-rose-50 border border-rose-200">
              {{ mensajeErrorForm }}
            </p>
          </div>
        </div>

      </div>

      <!-- ================= MODAL: PASARELA DE PAGO LIMPIA (DATOS PROPIOS DEL CLIENTE) ================= -->
      <div *ngIf="mostrarPasarela" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 animate-in fade-in zoom-in-95 duration-150">

          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-lg font-black text-slate-900">Pasarela de Pago Seguro</h3>
              <p class="text-xs text-slate-500">TransSync Servicios Transaccionales S.A.C.</p>
            </div>
            <button (click)="mostrarPasarela = false" class="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
          </div>

          <!-- Temporizador en Pasarela con Números Digitales -->
          <div *ngIf="tiempoRestanteSegundos > 0"
               class="mt-3 p-3 rounded-xl border flex items-center justify-between text-xs shadow-xs"
               [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse' : 'bg-amber-50/90 border-amber-300 text-amber-950'">
            <div>
              <p class="font-bold flex items-center gap-1.5">
                <span>⏱️</span> Tiempo para confirmar su pago:
              </p>
              <p class="text-[11px] opacity-80">
                Quedan {{ minutosRestantesFormateados }} min con {{ segundosRestantesFormateados }} seg antes de liberar
              </p>
            </div>
            <div class="flex items-center gap-1 font-mono font-black text-base px-3 py-1.5 rounded-xl shadow-inner border"
                 [ngClass]="tiempoRestanteSegundos < 60 ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-900 text-amber-300 border-slate-800'">
              <span>{{ minutosRestantesFormateados }}</span>
              <span class="animate-pulse">:</span>
              <span>{{ segundosRestantesFormateados }}</span>
            </div>
          </div>

          <!-- Resumen de Boletos -->
          <div class="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <p class="text-slate-500 font-medium">Titular: <strong class="text-slate-900">{{ formulario.nombrePasajero }}</strong></p>
              <p class="text-slate-500 font-medium">Ruta: <strong class="text-slate-900">{{ rutaActual.nombre }}</strong></p>
              <p class="text-slate-500 font-medium">Asiento(s): <strong class="text-teal-700">{{ asientosSeleccionados.join(', ') }}</strong></p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-slate-400 uppercase font-bold">Total a Pagar</p>
              <p class="text-xl font-black text-slate-900">S/ {{ totalAPagar.toFixed(2) }}</p>
            </div>
          </div>

          <!-- Medio de Pago -->
          <p class="text-xs font-bold text-slate-700 mb-2">Seleccione medio de pago:</p>
          <div class="grid grid-cols-3 gap-2 mb-4">
            <button (click)="metodoPagoElegido = 'YAPE'"
                    [class]="metodoPagoElegido === 'YAPE' ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold' : 'border-slate-200 bg-white text-slate-600'"
                    class="py-2.5 px-2 rounded-xl border text-xs transition-all text-center">
              Yape / Plin
            </button>
            <button (click)="metodoPagoElegido = 'TARJETA'"
                    [class]="metodoPagoElegido === 'TARJETA' ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold' : 'border-slate-200 bg-white text-slate-600'"
                    class="py-2.5 px-2 rounded-xl border text-xs transition-all text-center">
              Tarjeta Déb/Créd
            </button>
            <button (click)="metodoPagoElegido = 'TRANSFERENCIA'"
                    [class]="metodoPagoElegido === 'TRANSFERENCIA' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200 bg-white text-slate-600'"
                    class="py-2.5 px-2 rounded-xl border text-xs transition-all text-center">
              Transferencia
            </button>
          </div>

          <!-- Formularios Limpios sin Datos Predeterminados -->
          <div class="mb-5">

            <!-- YAPE / PLIN -->
            <div *ngIf="metodoPagoElegido === 'YAPE'" class="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
              <div class="text-center">
                <p class="text-xs font-bold text-purple-900">Yapear al número de TransSync:</p>
                <p class="text-xl font-black font-mono text-purple-700 tracking-wider">987 654 321</p>
                <p class="text-[11px] text-purple-800">TransSync Transportes S.A.C.</p>
              </div>
              <div class="space-y-2 pt-2 border-t border-purple-200/60">
                <div>
                  <label class="block text-[11px] font-bold text-purple-900 mb-1">Su Número de Celular Yape:</label>
                  <input [(ngModel)]="datosPago.telefonoYape" placeholder="Ingrese su celular (ej: 912345678)" maxlength="9"
                         class="w-full rounded-lg px-3 py-2 text-sm bg-white border border-purple-300 font-mono text-slate-900 outline-none"/>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-purple-900 mb-1">Código de Aprobación de la App Yape (6 dígitos):</label>
                  <input [(ngModel)]="datosPago.codigoYape" placeholder="Ingrese código de operación (ej: 849201)" maxlength="8"
                         class="w-full rounded-lg px-3 py-2 text-sm bg-white border border-purple-300 font-mono text-slate-900 outline-none"/>
                </div>
              </div>
            </div>

            <!-- TARJETA DÉBITO / CRÉDITO -->
            <div *ngIf="metodoPagoElegido === 'TARJETA'" class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Número de Tarjeta</label>
                <input [(ngModel)]="datosPago.numeroTarjeta" placeholder="•••• •••• •••• ••••" maxlength="19"
                       class="w-full rounded-lg px-3 py-2 text-sm bg-slate-50 border border-slate-300 font-mono text-slate-900 outline-none focus:bg-white"/>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Vencimiento (MM/AA)</label>
                  <input [(ngModel)]="datosPago.vencimiento" placeholder="MM/AA" maxlength="5"
                         class="w-full rounded-lg px-3 py-2 text-sm bg-slate-50 border border-slate-300 font-mono text-slate-900 outline-none focus:bg-white"/>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">Código CVV</label>
                  <input [(ngModel)]="datosPago.cvv" placeholder="•••" maxlength="4" type="password"
                         class="w-full rounded-lg px-3 py-2 text-sm bg-slate-50 border border-slate-300 font-mono text-slate-900 outline-none focus:bg-white"/>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Nombre en la Tarjeta</label>
                <input [(ngModel)]="datosPago.titular" placeholder="COMO APARECE EN LA TARJETA"
                       class="w-full rounded-lg px-3 py-2 text-sm bg-slate-50 border border-slate-300 text-slate-900 uppercase outline-none focus:bg-white"/>
              </div>
            </div>

            <!-- TRANSFERENCIA -->
            <div *ngIf="metodoPagoElegido === 'TRANSFERENCIA'" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
              <p class="font-bold text-emerald-900">Cuentas Corrientes Oficiales:</p>
              <p class="font-mono text-slate-700">BCP Soles: 191-98765432-0-88</p>
              <p class="font-mono text-slate-700">CCI Interbancario: 002-191-0098765432088-51</p>
              <div class="pt-2">
                <label class="block text-[11px] font-bold text-slate-700 mb-1">N° de Operación de la Constancia:</label>
                <input [(ngModel)]="datosPago.codigoTransferencia" placeholder="Ej: OP-839201"
                       class="w-full rounded-lg px-3 py-2 text-sm bg-white border border-emerald-300 font-mono text-slate-900 outline-none"/>
              </div>
            </div>
          </div>

          <!-- Botón de Confirmación -->
          <button (click)="ejecutarPagoYBloquearAsientos()"
                  [disabled]="procesandoPago"
                  class="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
            <span *ngIf="!procesandoPago">Confirmar y Emitir Boletos (S/ {{ totalAPagar.toFixed(2) }})</span>
            <span *ngIf="procesandoPago" class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Validando pago y emitiendo comprobante oficial...
            </span>
          </button>
        </div>
      </div>

      <!-- ================= MODAL: BOLETA DE VENTA ELECTRÓNICA CON IGV (SUNAT) ================= -->
      <div *ngIf="mostrarBoletoExito && boletaEmitida" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-lg rounded-2xl bg-white border border-slate-300 shadow-2xl p-6 text-slate-900 animate-in zoom-in-95 duration-150">

          <!-- Cabecera Oficial de la Boleta -->
          <div class="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <h4 class="text-base font-black tracking-tight text-slate-900">TRANSSYNC TRANSPORTES DEL PERÚ S.A.C.</h4>
            <p class="text-xs text-slate-600 font-mono">RUC: 20608912345 · Transporte Terrestre Interprovincial</p>
            <p class="text-[11px] text-slate-500">Av. Javier Prado Este 1109, La Victoria - Lima</p>
            <div class="mt-2 inline-block px-3 py-1 rounded border-2 border-slate-800 font-mono font-bold text-xs bg-slate-50">
              BOLETA DE VENTA ELECTRÓNICA: {{ boletaEmitida.numeroBoleta }}
            </div>
          </div>

          <!-- Datos del Viaje y Pasajero -->
          <div class="py-3 text-xs space-y-1.5 border-b border-slate-200">
            <div class="flex justify-between">
              <span class="text-slate-500">Fecha y Hora de Emisión:</span>
              <span class="font-mono font-semibold">{{ boletaEmitida.fechaHora }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Pasajero Titular:</span>
              <strong class="text-slate-900">{{ boletaEmitida.pasajero }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">DNI / Documento:</span>
              <span class="font-mono font-semibold">{{ boletaEmitida.dni }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Ruta de Embarque:</span>
              <strong class="text-teal-700">{{ boletaEmitida.ruta }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Fecha de Viaje:</span>
              <span class="font-semibold">{{ boletaEmitida.fechaViaje }} (Salida {{ boletaEmitida.horario }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Bus / Asiento(s):</span>
              <strong class="text-teal-700 font-bold">Bus #{{ boletaEmitida.busId }} · Asiento(s): {{ boletaEmitida.asientos.join(', ') }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Medio de Pago:</span>
              <span class="font-bold text-purple-700">{{ boletaEmitida.metodoPago }}</span>
            </div>
          </div>

          <!-- Desglose Tributario (IGV 18%) -->
          <div class="py-3 text-xs space-y-1 font-mono">
            <div class="flex justify-between text-slate-600">
              <span>Op. Gravada (Subtotal sin IGV):</span>
              <span>S/ {{ boletaEmitida.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>I.G.V. (18%):</span>
              <span>S/ {{ boletaEmitida.igv.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
              <span>IMPORTE TOTAL:</span>
              <span class="text-base font-black">S/ {{ boletaEmitida.total.toFixed(2) }}</span>
            </div>
          </div>

          <p class="text-[10px] text-center text-slate-400 font-mono mb-4">
            Representación impresa de la Boleta Electrónica autorizada por SUNAT.
          </p>

          <div class="flex items-center gap-2">
            <button (click)="imprimirComprobante()"
                    class="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors">
              Descargar / Imprimir
            </button>
            <button (click)="cerrarBoletaExito()"
                    class="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-xs text-white transition-colors">
              Aceptar y Volver
            </button>
          </div>
        </div>
      </div>

      <!-- ================= PESTAÑA 2: VISTA DEL CONDUCTOR (PANEL DE CONTROL Y ABORDAJE) ================= -->
      <div *ngIf="tabActiva === 'conductor'" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in">

        <!-- CABECERA DEL PANEL DEL CONDUCTOR -->
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                Panel Oficial del Conductor
              </span>
              <span class="text-xs text-slate-500 font-medium">Conductor: Mario Quispe Choque (ID #1)</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Manifiesto de Pasajeros y Control de Abordaje</h2>
            <p class="text-xs text-slate-500">
              Verifique el aforo de su unidad y confirme el embarque de cada pasajero antes de partir.
            </p>
          </div>

          <!-- Selector de Unidad y Botón Actualizar -->
          <div class="flex flex-wrap items-center gap-2.5">
            <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span class="text-xs font-bold text-slate-600 pl-1.5">Unidad:</span>
              <select [(ngModel)]="conductorIdConsulta" (change)="cambiarBusConductor()"
                      class="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs">
                <option [value]="5">Bus #5 · T3C-104 (Volvo 9700 Grand - Compras en vivo)</option>
                <option [value]="1">Bus #1 · BUS-TS-01 (Scania Touring HD)</option>
                <option [value]="2">Bus #2 · BUS-TS-02 (Volvo B430R)</option>
                <option [value]="3">Bus #3 · BUS-TS-03 (Mercedes-Benz Travego)</option>
                <option [value]="4">Bus #4 · BUS-TS-04 (Marcopolo G8 Paradiso)</option>
                <option [value]="6">Bus #6 · BUS-TS-06 (Scania Irizar i6S)</option>
              </select>
            </div>

            <button (click)="cargarManifiesto()"
                    class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5">
              <span>↻ Actualizar</span>
            </button>

            <!-- Botón Conductor: Finalizar Viaje y Liberar Asientos -->
            <button (click)="finalizarViajeConductor()"
                    [disabled]="finalizandoViaje"
                    class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              <span>🏁</span>
              <span>{{ finalizandoViaje ? 'Finalizando...' : 'Finalizar Viaje y Liberar Asientos' }}</span>
            </button>
          </div>
        </div>

        <!-- Banner de Notificación de Viaje Finalizado con Éxito -->
        <div *ngIf="viajeFinalizadoExitoMensaje" 
             class="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-emerald-900 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🏁</span>
            <div>
              <p class="text-xs font-black">¡Viaje Concluido y Asientos Liberados!</p>
              <p class="text-xs text-emerald-700">{{ viajeFinalizadoExitoMensaje }}</p>
            </div>
          </div>
          <button (click)="viajeFinalizadoExitoMensaje = null" 
                  class="px-2.5 py-1 text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors">
            Entendido
          </button>
        </div>

        <!-- Estado Operativo si todos los asientos están libres -->
        <div *ngIf="manifiesto && (manifiesto.asientosOcupados === 0)" 
             class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">✨</span>
            <p class="text-xs text-emerald-950 font-medium">
              <span class="font-bold">Todos los asientos de esta unidad están 100% libres.</span> No hay pasajeros activos en tránsito; los próximos compradores encontrarán el bus totalmente disponible.
            </p>
          </div>
          <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap self-start sm:self-center">
            ✓ Unidad Lista
          </span>
        </div>

        <!-- MÉTRICAS DE LA UNIDAD Y ESTADO DE EMBARQUE -->
        <div *ngIf="manifiesto" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-500 font-medium">Unidad y Placa</p>
            <p class="text-base font-black text-slate-900">{{ manifiesto.placa }}</p>
            <p class="text-[11px] text-slate-500">{{ manifiesto.modelo }}</p>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-500 font-medium">Capacidad del Bus</p>
            <p class="text-base font-black text-slate-900">{{ manifiesto.capacidadTotal }} Asientos</p>
            <p class="text-[11px] text-emerald-700 font-semibold">{{ manifiesto.asientosDisponibles }} Libres</p>
          </div>

          <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <p class="text-xs text-rose-700 font-bold">Pasajeros con Boleto</p>
            <p class="text-xl font-black text-rose-800">{{ manifiesto.asientosOcupados }} Boletos</p>
            <p class="text-[11px] text-rose-600">Registrados en sistema</p>
          </div>

          <div class="p-3.5 rounded-xl border"
               [ngClass]="contarAbordados() === (manifiesto.totalPasajeros || 0) && (manifiesto.totalPasajeros || 0) > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-teal-50 border-teal-200 text-teal-900'">
            <p class="text-xs font-bold">Pasajeros a Bordo</p>
            <p class="text-xl font-black">{{ contarAbordados() }} / {{ manifiesto.totalPasajeros || 0 }}</p>
            <p class="text-[11px] font-semibold"
               [ngClass]="contarAbordados() === (manifiesto.totalPasajeros || 0) && (manifiesto.totalPasajeros || 0) > 0 ? 'text-emerald-700 font-black' : 'text-teal-600'">
              {{ contarAbordados() === (manifiesto.totalPasajeros || 0) && (manifiesto.totalPasajeros || 0) > 0 ? '✓ Embarque Completo' : 'En proceso de subida' }}
            </p>
          </div>
        </div>

        <!-- VISTA SPLIT: PLANO DEL BUS A LA IZQUIERDA Y LISTA NOMINAL A LA DERECHA -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">

          <!-- Columna Izquierda: Chasis Compacto en Vivo para el Conductor (5 Columnas) -->
          <div class="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <div>
                <span class="text-xs font-bold text-slate-800">Mapa Visual de Asientos</span>
                <p class="text-[10px] text-slate-500">Toque un asiento para ver su pasajero</p>
              </div>
              <div class="flex items-center gap-2 text-[10px]">
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400"></span> A bordo</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300"></span> Ocupado</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-white border border-slate-300"></span> Libre</span>
              </div>
            </div>

            <!-- Mini Chasis del Conductor -->
            <div class="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              <div *ngFor="let fila of filasBus"
                   class="flex items-center justify-between p-1 bg-white rounded-lg border border-slate-200 text-xs">
                <!-- Izquierda -->
                <div class="flex gap-1.5">
                  <button (click)="filtrarPorAsientoConductor(fila.izqVentana)"
                          [title]="obtenerTooltipPasajero(fila.izqVentana)"
                          [class]="obtenerClaseAsientoConductor(fila.izqVentana)"
                          class="w-8 h-8 rounded border flex items-center justify-center font-mono transition-transform hover:scale-105">
                    {{ fila.izqVentana }}
                  </button>
                  <button (click)="filtrarPorAsientoConductor(fila.izqPasillo)"
                          [title]="obtenerTooltipPasajero(fila.izqPasillo)"
                          [class]="obtenerClaseAsientoConductor(fila.izqPasillo)"
                          class="w-8 h-8 rounded border flex items-center justify-center font-mono transition-transform hover:scale-105">
                    {{ fila.izqPasillo }}
                  </button>
                </div>

                <!-- Pasillo Central -->
                <span class="text-[9px] text-slate-400 font-bold">F{{ fila.numeroFila }}</span>

                <!-- Derecha -->
                <div class="flex gap-1.5">
                  <button (click)="filtrarPorAsientoConductor(fila.derPasillo)"
                          [title]="obtenerTooltipPasajero(fila.derPasillo)"
                          [class]="obtenerClaseAsientoConductor(fila.derPasillo)"
                          class="w-8 h-8 rounded border flex items-center justify-center font-mono transition-transform hover:scale-105">
                    {{ fila.derPasillo }}
                  </button>
                  <button (click)="filtrarPorAsientoConductor(fila.derVentana)"
                          [title]="obtenerTooltipPasajero(fila.derVentana)"
                          [class]="obtenerClaseAsientoConductor(fila.derVentana)"
                          class="w-8 h-8 rounded border flex items-center justify-center font-mono transition-transform hover:scale-105">
                    {{ fila.derVentana }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Tabla Nominal de Pasajeros y Check-In (7 Columnas) -->
          <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
            
            <!-- Barra Superior de Control de Abordaje -->
            <div class="p-3.5 bg-slate-100 border-b border-slate-200 space-y-2.5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📋</span> Lista Nominal de Pasajeros ({{ manifiesto?.pasajeros?.length || 0 }})
                </span>

                <!-- Acciones Rápidas de Abordaje -->
                <div class="flex items-center gap-1.5">
                  <button (click)="marcarTodosAbordados()"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs">
                    ✓ Marcar Todos a Bordo
                  </button>
                  <button (click)="limpiarAbordajes()"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
                    Reiniciar
                  </button>
                </div>
              </div>

              <!-- Buscador por DNI / Nombre / Asiento -->
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <input [(ngModel)]="filtroConductorTexto"
                         placeholder="Buscar por DNI, Nombre o Asiento (#31)..."
                         class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:border-teal-500 shadow-xs"/>
                  <span class="absolute left-2.5 top-1.5 text-xs text-slate-400">🔍</span>
                </div>
                <button *ngIf="filtroConductorTexto"
                        (click)="filtroConductorTexto = ''"
                        class="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 font-bold">
                  ✕
                </button>
              </div>
            </div>

            <!-- Tabla de Pasajeros -->
            <div class="max-h-[460px] overflow-y-auto flex-1">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th class="px-3.5 py-2.5">Asiento</th>
                    <th class="px-3.5 py-2.5">Pasajero</th>
                    <th class="px-3.5 py-2.5">DNI</th>
                    <th class="px-3.5 py-2.5">Teléfono</th>
                    <th class="px-3.5 py-2.5">Boleta</th>
                    <th class="px-3.5 py-2.5 text-center">Check-In</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let p of pasajerosFiltradosConductor"
                      class="hover:bg-slate-50 transition-colors"
                      [class.bg-emerald-50/50]="estaAbordado(p.reservaId)">
                    
                    <td class="px-3.5 py-2.5 font-mono font-black text-teal-700 text-xs">
                      #{{ p.asiento }}
                    </td>
                    <td class="px-3.5 py-2.5 font-bold text-slate-900">
                      {{ p.nombrePasajero }}
                    </td>
                    <td class="px-3.5 py-2.5 font-mono text-slate-700">
                      {{ p.dniPasajero }}
                    </td>
                    <td class="px-3.5 py-2.5 font-mono text-slate-600">
                      {{ p.telefonoPasajero }}
                    </td>
                    <td class="px-3.5 py-2.5">
                      <span class="font-mono text-[11px] font-bold text-slate-700">
                        {{ p.numeroBoleta || ('B001-' + p.reservaId) }}
                      </span>
                    </td>
                    <td class="px-3.5 py-2.5 text-center">
                      <button (click)="toggleAbordaje(p.reservaId)"
                              [class]="estaAbordado(p.reservaId)
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 font-black'
                                : 'bg-amber-50 hover:bg-emerald-50 text-amber-800 hover:text-emerald-800 border-amber-300 hover:border-emerald-300 font-bold'"
                              class="px-3 py-1 rounded-xl text-xs border transition-all shadow-xs flex items-center justify-center gap-1 mx-auto"
                              [title]="estaAbordado(p.reservaId) ? 'Haga clic para desmarcar' : 'Haga clic para confirmar que subió al bus'">
                        <span *ngIf="estaAbordado(p.reservaId)">✓ A bordo</span>
                        <span *ngIf="!estaAbordado(p.reservaId)">⏳ Por abordar</span>
                      </button>
                    </td>
                  </tr>

                  <tr *ngIf="pasajerosFiltradosConductor.length === 0">
                    <td colspan="6" class="px-3.5 py-16 text-center text-slate-500 font-medium">
                      {{ filtroConductorTexto ? 'No se encontraron pasajeros con el filtro: "' + filtroConductorTexto + '"' : 'Esta unidad no tiene pasajeros registrados para esta fecha.' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      <!-- ================= PESTAÑA 3: AUDITORÍA DE VENTAS POR FECHA (ADMINISTRADOR) ================= -->
      <div *ngIf="tabActiva === 'ventas'" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">

        <!-- Barra de Filtro por Fecha -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Auditoría Financiera</span>
            <h2 class="text-xl font-bold text-slate-900 mt-1">Historial Diario de Ventas y Facturación</h2>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-700">Filtrar por Día:</label>
            <input [(ngModel)]="fechaFiltroVentas" (change)="cargarVentas()" type="date"
                   class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-teal-500"/>
            <button (click)="fechaFiltroVentas = ''; cargarVentas()"
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
              Ver Todas
            </button>
          </div>
        </div>

        <!-- Métricas con Desglose de IGV y Subtotal -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-500 font-medium">Boletos Emitidos</p>
            <p class="text-xl font-black text-slate-900 mt-1">{{ totalBoletosVendidos }} Pasajes</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-500 font-medium">Op. Gravadas (Sin IGV)</p>
            <p class="text-xl font-black text-slate-700 mt-1">S/ {{ subtotalGravadoVentas.toFixed(2) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <p class="text-xs text-teal-800 font-medium">Total I.G.V. (18%)</p>
            <p class="text-xl font-black text-teal-900 mt-1">S/ {{ igvTotalVentas.toFixed(2) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p class="text-xs text-emerald-800 font-medium">Recaudación Total</p>
            <p class="text-2xl font-black text-emerald-900 mt-1">S/ {{ totalRecaudado.toFixed(2) }}</p>
          </div>
        </div>

        <!-- Tabla de Boletas Emitidas -->
        <div class="rounded-xl border border-slate-200 overflow-hidden">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th class="px-4 py-3">N° Boleta</th>
                <th class="px-4 py-3">Fecha y Hora</th>
                <th class="px-4 py-3">Pasajero</th>
                <th class="px-4 py-3">DNI</th>
                <th class="px-4 py-3">Ruta / Destino</th>
                <th class="px-4 py-3">Bus / Asiento</th>
                <th class="px-4 py-3">Medio de Pago</th>
                <th class="px-4 py-3 text-right">Total (S/)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let v of listaVentas" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-mono font-bold text-teal-700">{{ v.numeroBoleta || ('B001-' + v.id) }}</td>
                <td class="px-4 py-3 text-slate-600 font-mono">{{ v.fechaHoraVenta ? (v.fechaHoraVenta | date:'dd/MM/yyyy HH:mm') : (v.fechaViaje + ' 20:30') }}</td>
                <td class="px-4 py-3 font-bold text-slate-900">{{ v.nombrePasajero }}</td>
                <td class="px-4 py-3 font-mono text-slate-600">{{ v.dniPasajero }}</td>
                <td class="px-4 py-3 text-slate-700 font-medium">{{ v.rutaNombre || 'Lima - Arequipa' }}</td>
                <td class="px-4 py-3 text-slate-600">Bus #{{ v.busId }} · Asiento {{ v.asientoNumero }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {{ v.metodoPago || 'TARJETA' }}
                  </span>
                </td>
                <td class="px-4 py-3 font-black text-slate-900 text-right">S/ {{ (v.precio || 45.00).toFixed(2) }}</td>
              </tr>
              <tr *ngIf="listaVentas.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-slate-500 font-medium">
                  No se registraron ventas en la fecha seleccionada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `
})
export class ReservasComponent implements OnInit, OnDestroy {
  calcularPuntosFidelizacion(): number {
    const cant = this.asientosSeleccionados.length;
    if (cant === 0) return 0;
    if (cant === 1) return 1;
    if (cant === 2) return 2;
    return 5; // 3 o más pasajes = 5 puntos
  }

  abrirModalPerfil(): void {
    const btn = document.querySelector('button[title*="Perfil"]') as HTMLElement;
    if (btn) btn.click();
  }
  tabActiva: 'reserva' | 'conductor' | 'ventas' = 'reserva';
  private pollingSub?: Subscription;

  // Sesión
  sesionActual: UserSession | null = null;

  // Rutas Interprovinciales
  rutasDisponibles: RutaOpcion[] = [
    { id: 19, nombre: 'Juliaca → Cusco', origen: 'Juliaca', destino: 'Cusco', busId: 3, precio: 35.00, horario: '07:30 hrs' },
    { id: 20, nombre: 'Cusco → Juliaca', origen: 'Cusco', destino: 'Juliaca', busId: 4, precio: 35.00, horario: '14:00 hrs' },
    { id: 21, nombre: 'Cusco → Arequipa', origen: 'Cusco', destino: 'Arequipa', busId: 5, precio: 40.00, horario: '21:00 hrs' },
    { id: 22, nombre: 'Arequipa → Cusco', origen: 'Arequipa', destino: 'Cusco', busId: 2, precio: 40.00, horario: '20:00 hrs' },
    { id: 23, nombre: 'Lima → Arequipa', origen: 'Lima', destino: 'Arequipa', busId: 1, precio: 55.00, horario: '18:30 hrs' },
    { id: 24, nombre: 'Arequipa → Lima', origen: 'Arequipa', destino: 'Lima', busId: 1, precio: 55.00, horario: '19:00 hrs' }
  ];
  rutaSeleccionadaId = 19; // Juliaca - Cusco por defecto

  get rutaActual(): RutaOpcion {
    return this.rutasDisponibles.find(r => r.id === Number(this.rutaSeleccionadaId)) || this.rutasDisponibles[0];
  }

  get busSeleccionado(): number {
    return this.rutaActual.busId;
  }

  fechaSeleccionada = '2026-10-25';
  asientosOcupados: number[] = [];
  asientosEnReserva: number[] = [];
  tiempoRestanteSegundos: number = 0;
  temporizadorInterval: any = null;
  alertaExpirada: boolean = false;
  reservaTemporalIniciada: boolean = false;
  inactividadTimeout: any = null;
  visibilidadHandler: any = null;
  asientosSeleccionados: number[] = [];
  asientosSeleccionadosGuardados: number[] = [];

  // Filas del bus
  filasBus: FilaAsiento[] = [];

  // Formulario de Pasajero (Totalmente Limpio por Defecto)
  formulario = {
    nombrePasajero: '',
    dniPasajero: '',
    telefonoPasajero: '',
    emailPasajero: ''
  };
  mensajeErrorForm = '';

  // Pasarela de Pagos (Totalmente Limpia)
  mostrarPasarela = false;
  metodoPagoElegido: 'YAPE' | 'TARJETA' | 'TRANSFERENCIA' = 'YAPE';
  procesandoPago = false;
  mostrarBoletoExito = false;
  boletaEmitida: any = null;

  datosPago = {
    telefonoYape: '',
    codigoYape: '',
    numeroTarjeta: '',
    vencimiento: '',
    cvv: '',
    titular: '',
    codigoTransferencia: ''
  };

  // Conductor
  conductorIdConsulta = 5;
  manifiesto: any = null;
  filtroConductorTexto: string = '';
  pasajerosAbordados: Set<number> = new Set<number>();
  finalizandoViaje = false;
  viajeFinalizadoExitoMensaje: string | null = null;

  // Ventas Admin
  fechaFiltroVentas = '';
  listaVentas: any[] = [];
  totalBoletosVendidos = 0;
  totalRecaudado = 0;
  subtotalGravadoVentas = 0;
  igvTotalVentas = 0;

  get minutosRestantesFormateados(): string {
    const minutos = Math.floor(this.tiempoRestanteSegundos / 60);
    return minutos.toString().padStart(2, '0');
  }

  get segundosRestantesFormateados(): string {
    const segundos = this.tiempoRestanteSegundos % 60;
    return segundos.toString().padStart(2, '0');
  }

  get tiempoRestanteFormateado(): string {
    return `${this.minutosRestantesFormateados}:${this.segundosRestantesFormateados}`;
  }

  get porcentajeTiempoRestante(): number {
    return Math.min(100, Math.max(0, (this.tiempoRestanteSegundos / 300) * 100));
  }

  get totalAPagar(): number {
    return this.asientosSeleccionados.length * this.rutaActual.precio;
  }

  constructor(
    private reservasService: ReservasService,
    private rutasService: RutasService,
    private authService: AuthService,
    private pagosService: PagosService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.construirPlanoBus();
  }

  ngOnInit() {
    this.cargarRutasDesdeServicio();
    this.verificarReservaTemporalPersistida();

    this.authService.currentUser$.subscribe(user => {
      this.sesionActual = user;
      if (user && user.roles.includes('CLIENTE')) {
        // Solo autocompletar si el usuario inicio sesion explicitamente
        this.formulario.nombrePasajero = user.nombre;
        this.formulario.emailPasajero = user.email;
      }
      this.cdr.detectChanges();
    });

    // Cargar asientos inmediatamente al iniciar
    this.cargarAsientosOcupados();

    // Polling en tiempo real cada 4 segundos
    this.pollingSub = interval(4000).subscribe(() => {
      this.cargarAsientosOcupadosSilencioso();
      if (this.tabActiva === 'conductor') {
        this.cargarManifiestoSilencioso();
      }
    });
  }

  cargarRutasDesdeServicio() {
    this.rutasService.getRutas().subscribe({
      next: (resp: any) => {
        const datos = Array.isArray(resp) ? resp : (resp?.datos || []);
        if (datos && datos.length > 0) {
          this.rutasDisponibles = datos.map((r: any, idx: number) => ({
            id: r.id,
            nombre: `${r.origen} ➔ ${r.destino}`,
            origen: r.origen,
            destino: r.destino,
            busId: ((idx) % 6) + 1, // Distribuye entre los buses 1 a 6
            precio: r.precio || 35.00,
            horario: r.horario || '08:00 hrs'
          }));

          // Verificar si hay parametro de ruta desde el catalogo de rutas
          const rutaIdParam = this.route.snapshot.queryParamMap.get('rutaId');
          if (rutaIdParam && this.rutasDisponibles.some(r => r.id === Number(rutaIdParam))) {
            this.rutaSeleccionadaId = Number(rutaIdParam);
          } else if (!this.rutasDisponibles.some(r => r.id === Number(this.rutaSeleccionadaId))) {
            this.rutaSeleccionadaId = this.rutasDisponibles[0].id;
          }

          this.cargarAsientosOcupados();
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    if (this.inactividadTimeout) {
      clearTimeout(this.inactividadTimeout);
      this.inactividadTimeout = null;
    }
    if (this.visibilidadHandler) {
      document.removeEventListener('visibilitychange', this.visibilidadHandler);
    }
    // Si navega dentro del sistema a Rutas/Flota/Pagos con asientos seleccionados, asegurar la reserva de 5 min
    if (this.asientosSeleccionados.length > 0 && !this.reservaTemporalIniciada) {
      this.activarReservaTemporal(300);
    }
    this.detenerTemporizador();
  }

  construirPlanoBus() {
    const filas: FilaAsiento[] = [];
    for (let i = 0; i < 12; i++) {
      const base = i * 4;
      filas.push({
        numeroFila: i + 1,
        izqVentana: base + 1,
        izqPasillo: base + 2,
        derPasillo: base + 3,
        derVentana: base + 4
      });
    }
    this.filasBus = filas;
  }

  alCambiarRuta() {
    this.cancelarReservaTemporal();
    this.cargarAsientosOcupados();
  }

  cargarAsientosOcupados() {
    this.reservasService.getAsientosOcupados(this.busSeleccionado, this.fechaSeleccionada).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.asientosOcupados = resp.asientosOcupados || [];
          const enReservaBackend = resp.asientosEnReserva || [];
          this.asientosEnReserva = enReservaBackend.filter((a: number) => !this.asientosSeleccionados.includes(a));
          this.asientosSeleccionados = this.asientosSeleccionados.filter(a => !this.asientosOcupados.includes(a));
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  cargarAsientosOcupadosSilencioso() {
    this.reservasService.getAsientosOcupados(this.busSeleccionado, this.fechaSeleccionada).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.asientosOcupados = resp.asientosOcupados || [];
          const enReservaBackend = resp.asientosEnReserva || [];
          this.asientosEnReserva = enReservaBackend.filter((a: number) => !this.asientosSeleccionados.includes(a));
          this.asientosSeleccionados = this.asientosSeleccionados.filter(a => !this.asientosOcupados.includes(a));
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  esAsientoOcupado(num: number): boolean {
    return this.asientosOcupados.includes(num);
  }

  esAsientoEnReserva(num: number): boolean {
    return this.asientosEnReserva.includes(num);
  }

  verificarReservaTemporalPersistida() {
    try {
      const dataStr = localStorage.getItem('transsync_reserva_temporal');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      const ahora = Date.now();

      if (data.expiraEn && data.expiraEn > ahora) {
        if (data.busId) {
          const ruta = this.rutasDisponibles.find(r => r.busId === data.busId);
          if (ruta) {
            this.rutaSeleccionadaId = ruta.id;
          }
        }
        if (data.fechaViaje) {
          this.fechaSeleccionada = data.fechaViaje;
        }
        if (Array.isArray(data.asientos) && data.asientos.length > 0) {
          this.asientosSeleccionados = [...data.asientos];
          const restantes = Math.floor((data.expiraEn - ahora) / 1000);
          this.activarReservaTemporal(restantes, data.expiraEn);
        }
      } else {
        localStorage.removeItem('transsync_reserva_temporal');
        this.alertaExpirada = true;
        this.asientosSeleccionados = [];
        this.reservaTemporalIniciada = false;
      }
    } catch (e) {
      localStorage.removeItem('transsync_reserva_temporal');
    }
  }

  activarReservaTemporal(segundos: number = 300, expiraEnParam?: number) {
    if (this.inactividadTimeout) {
      clearTimeout(this.inactividadTimeout);
      this.inactividadTimeout = null;
    }
    this.detenerTemporizador();
    this.alertaExpirada = false;
    this.reservaTemporalIniciada = true;
    this.tiempoRestanteSegundos = segundos;

    const expiraEn = expiraEnParam || (Date.now() + segundos * 1000);
    this.guardarEnLocalStorage(expiraEn);

    // Notificar al backend ms-reservas para que cualquier otra pestaña o incógnito lo vea en ámbar
    if (this.asientosSeleccionados.length > 0) {
      this.reservasService.bloquearAsientosTemporal(this.busSeleccionado, this.fechaSeleccionada, this.asientosSeleccionados).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    // Ejecutar el temporizador segundo a segundo dentro de NgZone para refresco inmediato de UI
    this.temporizadorInterval = setInterval(() => {
      this.ngZone.run(() => {
        const ahora = Date.now();
        const diff = Math.floor((expiraEn - ahora) / 1000);

        if (diff <= 0) {
          this.tiempoRestanteSegundos = 0;
          this.detenerTemporizador();
          this.expirarReservaTemporal();
        } else {
          this.tiempoRestanteSegundos = diff;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
    }, 1000);

    this.cdr.detectChanges();
  }

  detenerTemporizador() {
    if (this.temporizadorInterval) {
      clearInterval(this.temporizadorInterval);
      this.temporizadorInterval = null;
    }
  }

  guardarEnLocalStorage(expiraEn: number) {
    try {
      localStorage.setItem('transsync_reserva_temporal', JSON.stringify({
        busId: this.busSeleccionado,
        fechaViaje: this.fechaSeleccionada,
        asientos: this.asientosSeleccionados,
        expiraEn: expiraEn
      }));
    } catch (e) {}
  }

  actualizarLocalStorageReserva() {
    try {
      const dataStr = localStorage.getItem('transsync_reserva_temporal');
      let expiraEn = Date.now() + 300 * 1000;
      if (dataStr) {
        const d = JSON.parse(dataStr);
        if (d.expiraEn && d.expiraEn > Date.now()) {
          expiraEn = d.expiraEn;
        }
      }
      this.guardarEnLocalStorage(expiraEn);
    } catch (e) {}
  }

  cancelarReservaTemporal() {
    if (this.inactividadTimeout) {
      clearTimeout(this.inactividadTimeout);
      this.inactividadTimeout = null;
    }
    if (this.asientosSeleccionados.length > 0) {
      this.reservasService.liberarAsientosTemporal(this.busSeleccionado, this.fechaSeleccionada, this.asientosSeleccionados).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.detenerTemporizador();
    this.tiempoRestanteSegundos = 0;
    this.reservaTemporalIniciada = false;
    this.asientosSeleccionados = [];
    this.mostrarPasarela = false;
    localStorage.removeItem('transsync_reserva_temporal');
    this.cargarAsientosOcupados();
    this.cdr.detectChanges();
  }

  expirarReservaTemporal() {
    if (this.inactividadTimeout) {
      clearTimeout(this.inactividadTimeout);
      this.inactividadTimeout = null;
    }
    if (this.asientosSeleccionados.length > 0) {
      this.reservasService.liberarAsientosTemporal(this.busSeleccionado, this.fechaSeleccionada, this.asientosSeleccionados).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.reservaTemporalIniciada = false;
    this.asientosSeleccionados = [];
    this.mostrarPasarela = false;
    localStorage.removeItem('transsync_reserva_temporal');
    this.alertaExpirada = true;
    this.cargarAsientosOcupados();
    this.cdr.detectChanges();
  }

  reiniciarTemporizadorInactividad() {
    if (this.inactividadTimeout) {
      clearTimeout(this.inactividadTimeout);
      this.inactividadTimeout = null;
    }
    // Si el usuario pasa 10 segundos sin hacer más clics en los asientos, se asegura la reserva por 5 minutos
    this.inactividadTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.asientosSeleccionados.length > 0 && !this.reservaTemporalIniciada) {
          this.activarReservaTemporal(300);
        }
      });
    }, 10000);
  }

  toggleSeleccionAsiento(num: number) {
    if (this.esAsientoOcupado(num)) return;
    if (this.esAsientoEnReserva(num)) {
      alert('El asiento #' + num + ' se encuentra actualmente en proceso de reserva y pago por otro comprador. Por favor elija otro asiento disponible.');
      return;
    }
    this.mensajeErrorForm = '';
    this.alertaExpirada = false;

    if (this.asientosSeleccionados.includes(num)) {
      this.reservasService.liberarAsientosTemporal(this.busSeleccionado, this.fechaSeleccionada, [num]).subscribe();
      this.asientosSeleccionados = this.asientosSeleccionados.filter(a => a !== num);
      if (this.asientosSeleccionados.length === 0) {
        this.cancelarReservaTemporal();
      } else if (this.reservaTemporalIniciada) {
        this.actualizarLocalStorageReserva();
        this.reservasService.bloquearAsientosTemporal(this.busSeleccionado, this.fechaSeleccionada, this.asientosSeleccionados).subscribe();
      }
    } else {
      this.asientosSeleccionados.push(num);
      this.asientosSeleccionados.sort((a, b) => a - b);

      if (this.reservaTemporalIniciada) {
        this.actualizarLocalStorageReserva();
        this.reservasService.bloquearAsientosTemporal(this.busSeleccionado, this.fechaSeleccionada, this.asientosSeleccionados).subscribe();
      } else {
        this.reiniciarTemporizadorInactividad();
      }
    }
    this.cdr.detectChanges();
  }

  obtenerClaseBotonAsiento(num: number): string {
    if (this.esAsientoOcupado(num)) {
      return 'bg-rose-50 border-2 border-rose-300 text-rose-700 cursor-not-allowed opacity-90';
    }
    if (this.asientosSeleccionados.includes(num)) {
      return 'bg-teal-600 border-2 border-teal-700 text-white font-black shadow-md scale-105 ring-2 ring-teal-300';
    }
    if (this.esAsientoEnReserva(num)) {
      return 'bg-amber-100 border-2 border-amber-500 text-amber-950 font-black cursor-not-allowed shadow-xs ring-2 ring-amber-300 animate-pulse';
    }
    return 'bg-white border-2 border-emerald-300 text-slate-800 hover:border-teal-500 hover:bg-teal-50';
  }

  obtenerTooltipAsientoCliente(num: number): string {
    if (this.esAsientoOcupado(num)) return `Asiento #${num} · Ocupado / Comprado`;
    if (this.asientosSeleccionados.includes(num)) return `Asiento #${num} · Seleccionado por ti`;
    if (this.esAsientoEnReserva(num)) return `Asiento #${num} · En Reserva por otro comprador (Comprándose en vivo)`;
    return `Asiento #${num} · Disponible`;
  }

  obtenerTextoEstadoAsiento(num: number): string {
    if (this.esAsientoOcupado(num)) return 'OCUPADO';
    if (this.asientosSeleccionados.includes(num)) return 'ELEGIDO';
    if (this.esAsientoEnReserva(num)) return 'RESERVA';
    return 'LIBRE';
  }

  abrirPasarelaPago() {
    this.mensajeErrorForm = '';
    if (!this.formulario.nombrePasajero || !this.formulario.dniPasajero || !this.formulario.telefonoPasajero) {
      this.mensajeErrorForm = 'Por favor complete Nombre, DNI y Teléfono antes de continuar.';
      return;
    }
    if (this.asientosSeleccionados.length === 0) {
      this.mensajeErrorForm = 'Seleccione al menos un asiento disponible en el plano del bus.';
      return;
    }
    this.datosPago.titular = this.formulario.nombrePasajero;
    // Al pasar a la pasarela de pago, asegurar la reserva temporal de 5 minutos
    if (!this.reservaTemporalIniciada || this.tiempoRestanteSegundos <= 0) {
      this.activarReservaTemporal(300);
    }
    this.mostrarPasarela = true;
    this.cdr.detectChanges();
  }

  ejecutarPagoYBloquearAsientos() {
    // Validaciones según medio de pago
    if (this.metodoPagoElegido === 'YAPE' && !this.datosPago.codigoYape) {
      alert('Por favor ingrese el código de operación de la app Yape.');
      return;
    }
    if (this.metodoPagoElegido === 'TARJETA' && !this.datosPago.numeroTarjeta) {
      alert('Por favor ingrese los datos de su tarjeta.');
      return;
    }

    this.procesandoPago = true;

    const payload = {
      nombrePasajero: this.formulario.nombrePasajero,
      dniPasajero: this.formulario.dniPasajero,
      telefonoPasajero: this.formulario.telefonoPasajero,
      emailPasajero: this.formulario.emailPasajero,
      rutaId: this.rutaActual.id,
      rutaNombre: this.rutaActual.nombre,
      busId: this.busSeleccionado,
      fechaViaje: this.fechaSeleccionada,
      asientos: this.asientosSeleccionados,
      precioUnitario: this.rutaActual.precio,
      metodoPago: this.metodoPagoElegido,
      idCliente: this.sesionActual?.idCliente || 101
    };

    this.reservasService.createReservaMultiple(payload).subscribe({
      next: (resp: any) => {
        this.procesandoPago = false;
        this.mostrarPasarela = false;
        this.asientosSeleccionadosGuardados = [...this.asientosSeleccionados];

        // Sincronizar automáticamente cada boleto comprado con ms-pagos
        const reservasCreadas = resp?.datos?.reservas || [];
        if (reservasCreadas.length > 0) {
          reservasCreadas.forEach((r: any) => {
            this.pagosService.createPago({
              reservaId: r.id,
              monto: r.precio || this.rutaActual.precio || 45,
              metodoPago: this.metodoPagoElegido || 'TARJETA',
              estado: 'COMPLETADO'
            }).subscribe({
              next: () => {},
              error: (err: any) => console.warn('Aviso: ms-pagos no pudo registrar el pago:', err)
            });
          });
        }

        const total = this.totalAPagar;
        const subtotal = total / 1.18;
        const igv = total - subtotal;
        const fechaHora = new Date().toLocaleString('es-PE');
        const puntosGanados = this.sesionActual ? this.calcularPuntosFidelizacion() : 0;
        if (puntosGanados > 0) {
          this.authService.sumarPuntos(puntosGanados);
        }

        this.boletaEmitida = {
          numeroBoleta: 'B001-' + String(Math.floor(100000 + Math.random() * 900000)),
          fechaHora: fechaHora,
          pasajero: this.formulario.nombrePasajero,
          dni: this.formulario.dniPasajero,
          ruta: this.rutaActual.nombre,
          fechaViaje: this.fechaSeleccionada,
          horario: this.rutaActual.horario,
          busId: this.busSeleccionado,
          asientos: [...this.asientosSeleccionados],
          metodoPago: this.metodoPagoElegido,
          subtotal: Math.round(subtotal * 100) / 100,
          igv: Math.round(igv * 100) / 100,
          total: total,
          puntosGanados: puntosGanados,
          saldoTotalPuntos: this.authService.obtenerPuntos()
        };

        this.asientosSeleccionados = [];
        this.mostrarBoletoExito = true;
        this.cargarAsientosOcupados();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.procesandoPago = false;
        alert(err.error?.mensaje || 'Error al procesar el pago.');
        this.cargarAsientosOcupados();
        this.cdr.detectChanges();
      }
    });
  }

  cerrarBoletaExito() {
    this.mostrarBoletoExito = false;
    this.boletaEmitida = null;
    this.formulario = { nombrePasajero: '', dniPasajero: '', telefonoPasajero: '', emailPasajero: '' };
    this.cdr.detectChanges();
  }

  imprimirComprobante() {
    window.print();
  }

  cambiarBusConductor() {
    this.filtroConductorTexto = '';
    this.cargarManifiesto();
  }

  toggleAbordaje(reservaId: number) {
    if (this.pasajerosAbordados.has(reservaId)) {
      this.pasajerosAbordados.delete(reservaId);
    } else {
      this.pasajerosAbordados.add(reservaId);
    }
    this.cdr.detectChanges();
  }

  estaAbordado(reservaId: number): boolean {
    return this.pasajerosAbordados.has(reservaId);
  }

  contarAbordados(): number {
    if (!this.manifiesto || !this.manifiesto.pasajeros) return 0;
    return this.manifiesto.pasajeros.filter((p: any) => this.estaAbordado(p.reservaId)).length;
  }

  marcarTodosAbordados() {
    if (!this.manifiesto || !this.manifiesto.pasajeros) return;
    this.manifiesto.pasajeros.forEach((p: any) => this.pasajerosAbordados.add(p.reservaId));
    this.cdr.detectChanges();
  }

  limpiarAbordajes() {
    this.pasajerosAbordados.clear();
    this.cdr.detectChanges();
  }

  finalizarViajeConductor() {
    const total = this.manifiesto?.asientosOcupados || 0;
    const msg = total > 0
      ? `¿Confirmar llegada a destino y FINALIZAR el viaje del Bus #${this.conductorIdConsulta}?\n\n- Se registrarán ${total} pasaje(s) como COMPLETADOS (su historial de venta y pago se mantiene intacto).\n- Todos los ${this.manifiesto?.capacidadTotal || 50} asientos quedarán 100% LIBRES para que los siguientes pasajeros puedan comprar.`
      : `¿Desea reiniciar y liberar completamente todos los asientos del Bus #${this.conductorIdConsulta} para el próximo viaje?`;

    if (!confirm(msg)) return;

    this.finalizandoViaje = true;
    this.reservasService.finalizarViaje(this.conductorIdConsulta, this.fechaSeleccionada).subscribe({
      next: (resp: any) => {
        this.finalizandoViaje = false;
        this.limpiarAbordajes();
        this.viajeFinalizadoExitoMensaje = resp.mensaje || '¡Viaje finalizado con éxito! La unidad quedó liberada y lista para recibir nuevos pasajeros.';
        this.cargarManifiesto();
        this.cargarAsientosOcupados();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.viajeFinalizadoExitoMensaje = null;
          this.cdr.detectChanges();
        }, 12000);
      },
      error: (err: any) => {
        this.finalizandoViaje = false;
        alert('Error al finalizar el viaje: ' + (err.error?.mensaje || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  esAsientoOcupadoManifiesto(num: number): boolean {
    if (!this.manifiesto || !this.manifiesto.pasajeros) return false;
    return this.manifiesto.pasajeros.some((p: any) => p.asiento === num);
  }

  obtenerPasajeroPorAsiento(num: number): any {
    if (!this.manifiesto || !this.manifiesto.pasajeros) return null;
    return this.manifiesto.pasajeros.find((p: any) => p.asiento === num);
  }

  obtenerTooltipPasajero(num: number): string {
    const pas = this.obtenerPasajeroPorAsiento(num);
    if (!pas) return `Asiento #${num} - Disponible`;
    const abord = this.estaAbordado(pas.reservaId) ? ' [✓ A BORDO]' : ' [⏳ POR ABORDAR]';
    return `Asiento #${num}: ${pas.nombrePasajero} · DNI: ${pas.dniPasajero} · Boleto: ${pas.numeroBoleta || 'B001-' + pas.reservaId}${abord}`;
  }

  obtenerClaseAsientoConductor(num: number): string {
    const pas = this.obtenerPasajeroPorAsiento(num);
    if (!pas) {
      return 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 cursor-default';
    }
    if (this.estaAbordado(pas.reservaId)) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-xs cursor-pointer ring-2 ring-emerald-300';
    }
    return 'bg-rose-100 text-rose-900 border-rose-300 font-bold shadow-xs cursor-pointer ring-2 ring-rose-200';
  }

  filtrarPorAsientoConductor(num: number) {
    if (this.esAsientoOcupadoManifiesto(num)) {
      this.filtroConductorTexto = String(num);
    } else {
      this.filtroConductorTexto = '';
    }
    this.cdr.detectChanges();
  }

  get pasajerosFiltradosConductor(): any[] {
    if (!this.manifiesto || !this.manifiesto.pasajeros) return [];
    if (!this.filtroConductorTexto.trim()) return this.manifiesto.pasajeros;
    const q = this.filtroConductorTexto.trim().toLowerCase();
    return this.manifiesto.pasajeros.filter((p: any) =>
      (p.nombrePasajero && p.nombrePasajero.toLowerCase().includes(q)) ||
      (p.dniPasajero && p.dniPasajero.includes(q)) ||
      String(p.asiento) === q ||
      String(p.asiento).includes(q) ||
      (p.numeroBoleta && p.numeroBoleta.toLowerCase().includes(q))
    );
  }

  cargarManifiesto() {
    this.reservasService.getManifiestoConductor(this.conductorIdConsulta).subscribe({
      next: (resp: any) => {
        if (resp && resp.datos) {
          this.manifiesto = resp.datos;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  cargarManifiestoSilencioso() {
    this.reservasService.getManifiestoConductor(this.conductorIdConsulta).subscribe({
      next: (resp: any) => {
        if (resp && resp.datos) {
          this.manifiesto = resp.datos;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  cargarVentas() {
    this.reservasService.getVentasAdmin(this.fechaFiltroVentas).subscribe({
      next: (resp: any) => {
        if (resp && resp.datos) {
          this.listaVentas = resp.datos.ventas || [];
          this.totalBoletosVendidos = resp.datos.totalBoletosVendidos || 0;
          this.totalRecaudado = resp.datos.totalRecaudado || 0;
          this.subtotalGravadoVentas = resp.datos.subtotalGravado || (this.totalRecaudado / 1.18);
          this.igvTotalVentas = resp.datos.igvTotal || (this.totalRecaudado - this.subtotalGravadoVentas);
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  reiniciarBusDemostracion() {
    if (confirm('¿Desea reiniciar todos los asientos del Bus #' + this.busSeleccionado + ' a 0% para la prueba con el docente?')) {
      this.reservasService.reiniciarBus(this.busSeleccionado).subscribe({
        next: () => {
          alert('Bus #' + this.busSeleccionado + ' reiniciado con éxito. Todos los asientos ahora están libres.');
          this.cargarAsientosOcupados();
          this.cargarManifiesto();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          alert('Error al reiniciar bus: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }

  cambiarRol(email: string, pass: string) {
    this.authService.login({ email, password: pass }).subscribe({
      next: () => {
        if (this.esConductor()) {
          this.tabActiva = 'conductor';
          this.cargarManifiesto();
        } else if (this.esAdmin()) {
          this.tabActiva = 'ventas';
          this.cargarVentas();
        } else {
          this.tabActiva = 'reserva';
          this.cargarAsientosOcupados();
        }
        this.cdr.detectChanges();
      }
    });
  }

  esCliente(): boolean {
    return !this.sesionActual || this.sesionActual.roles.includes('CLIENTE');
  }

  esConductor(): boolean {
    return !!this.sesionActual && this.sesionActual.roles.includes('CONDUCTOR');
  }

  esAdmin(): boolean {
    return !!this.sesionActual && this.sesionActual.roles.includes('ADMIN');
  }
}
