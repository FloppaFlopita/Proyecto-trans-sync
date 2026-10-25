import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ReservasService } from '../../services/reservas.service';
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
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
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
                  [class]="esCliente() ? 'bg-blue-600 text-white font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200">
            Pasajero / Cliente
          </button>
          <button (click)="cambiarRol('conductor@transsync.com', 'chofer123')"
                  [class]="esConductor() ? 'bg-blue-600 text-white font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200">
            Conductor
          </button>
          <button (click)="cambiarRol('admin@transsync.com', 'admin123')"
                  [class]="esAdmin() ? 'bg-blue-600 text-white font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200">
            Administrador
          </button>
        </div>
      </div>

      <!-- PESTAÑAS DE NAVEGACIÓN -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-1 text-sm font-medium">
        <button *ngIf="esCliente() || esAdmin()"
                (click)="tabActiva = 'reserva'"
                [class]="tabActiva === 'reserva' ? 'text-blue-700 border-b-2 border-blue-600 font-bold bg-blue-50/50' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2.5 rounded-t-xl transition-all">
          Comprar Boletos
        </button>

        <button *ngIf="esConductor() || esAdmin()"
                (click)="tabActiva = 'conductor'; cargarManifiesto()"
                [class]="tabActiva === 'conductor' ? 'text-blue-700 border-b-2 border-blue-600 font-bold bg-blue-50/50' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2.5 rounded-t-xl transition-all">
          Vista del Conductor (Plano y Pasajeros)
        </button>

        <button *ngIf="esAdmin()"
                (click)="tabActiva = 'ventas'; cargarVentas()"
                [class]="tabActiva === 'ventas' ? 'text-blue-700 border-b-2 border-blue-600 font-bold bg-blue-50/50' : 'text-slate-600 hover:text-slate-900'"
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
                      class="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500">
                <option *ngFor="let r of rutasDisponibles" [value]="r.id">
                  {{ r.nombre }} · S/ {{ r.precio.toFixed(2) }} ({{ r.horario }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha de Salida:</label>
              <input [(ngModel)]="fechaSeleccionada" (change)="cargarAsientosOcupados()" type="date"
                     class="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-blue-500"/>
            </div>
          </div>

          <!-- Información del Servicio Seleccionado -->
          <div class="flex items-center justify-between text-xs mb-4 px-3 py-2 bg-blue-50/60 rounded-xl border border-blue-100">
            <span class="font-bold text-blue-900">Unidad Asignada: Bus #{{ rutaActual.busId }}</span>
            <span class="text-slate-600">Tarifa por Pasaje: <strong class="text-slate-900 font-bold">S/ {{ rutaActual.precio.toFixed(2) }}</strong></span>
            <span class="text-slate-600">Salida: <strong class="text-slate-900 font-bold">{{ rutaActual.horario }}</strong></span>
          </div>

          <!-- LEYENDA CLARA DE ASIENTOS -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-white border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-700">1</span>
              <span class="font-medium text-slate-700">Disponible</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-blue-600 border-2 border-blue-700 flex items-center justify-center text-[10px] font-bold text-white">✓</span>
              <span class="font-medium text-slate-700">Seleccionado</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-[10px] font-bold text-amber-800">⏳</span>
              <span class="font-medium text-slate-700">En Reserva</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-rose-100 border-2 border-rose-500 flex items-center justify-center text-[10px] font-bold text-rose-800">✕</span>
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
                          [disabled]="esAsientoOcupado(fila.izqVentana)"
                          [class]="obtenerClaseBotonAsiento(fila.izqVentana)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="Fila {{ fila.numeroFila }} · Ventana">
                    <span>{{ fila.izqVentana }}</span>
                    <span class="text-[8px] font-semibold tracking-tighter opacity-75">
                      {{ obtenerTextoEstadoAsiento(fila.izqVentana) }}
                    </span>
                  </button>

                  <button (click)="toggleSeleccionAsiento(fila.izqPasillo)"
                          [disabled]="esAsientoOcupado(fila.izqPasillo)"
                          [class]="obtenerClaseBotonAsiento(fila.izqPasillo)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="Fila {{ fila.numeroFila }} · Pasillo">
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
                          [disabled]="esAsientoOcupado(fila.derPasillo)"
                          [class]="obtenerClaseBotonAsiento(fila.derPasillo)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="Fila {{ fila.numeroFila }} · Pasillo">
                    <span>{{ fila.derPasillo }}</span>
                    <span class="text-[8px] font-semibold tracking-tighter opacity-75">
                      {{ obtenerTextoEstadoAsiento(fila.derPasillo) }}
                    </span>
                  </button>

                  <button (click)="toggleSeleccionAsiento(fila.derVentana)"
                          [disabled]="esAsientoOcupado(fila.derVentana)"
                          [class]="obtenerClaseBotonAsiento(fila.derVentana)"
                          class="w-11 h-11 rounded-lg transition-all flex flex-col items-center justify-center font-bold text-xs shadow-xs"
                          title="Fila {{ fila.numeroFila }} · Ventana">
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
                       class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition-all"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    DNI / Documento <span class="text-red-500">*</span>
                  </label>
                  <input [(ngModel)]="formulario.dniPasajero" placeholder="8 dígitos" maxlength="10"
                         class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition-all font-mono"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular <span class="text-red-500">*</span>
                  </label>
                  <input [(ngModel)]="formulario.telefonoPasajero" placeholder="Ej: 987654321"
                         class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition-all"/>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico <span class="text-slate-400 font-normal">(Opcional para recibir comprobante)</span>
                </label>
                <input [(ngModel)]="formulario.emailPasajero" placeholder="ejemplo@correo.com"
                       class="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:bg-white focus:border-blue-600 transition-all"/>
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
                <span class="font-bold text-blue-700 text-sm">
                  {{ asientosSeleccionados.length > 0 ? asientosSeleccionados.join(', ') : 'Ninguno' }}
                </span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span>Tarifa unitaria:</span>
                <span class="font-semibold text-slate-800">S/ {{ rutaActual.precio.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span>Puntos de recompensa:</span>
                <span class="font-bold text-emerald-700">+{{ asientosSeleccionados.length * 10 }} Puntos</span>
              </div>
              <div class="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-800">Total a Pagar (inc. IGV):</span>
                <span class="text-2xl font-black text-slate-900">
                  S/ {{ (asientosSeleccionados.length * rutaActual.precio).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Botón de Continuar -->
          <div class="mt-6 space-y-2">
            <button (click)="abrirPasarelaPago()"
                    [disabled]="asientosSeleccionados.length === 0"
                    class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2"
                    [class]="asientosSeleccionados.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 cursor-pointer active:scale-[0.98]'
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

          <!-- Resumen de Boletos -->
          <div class="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <p class="text-slate-500 font-medium">Titular: <strong class="text-slate-900">{{ formulario.nombrePasajero }}</strong></p>
              <p class="text-slate-500 font-medium">Ruta: <strong class="text-slate-900">{{ rutaActual.nombre }}</strong></p>
              <p class="text-slate-500 font-medium">Asiento(s): <strong class="text-blue-700">{{ asientosSeleccionados.join(', ') }}</strong></p>
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
                    [class]="metodoPagoElegido === 'TARJETA' ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-slate-200 bg-white text-slate-600'"
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
                  class="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
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
              <strong class="text-blue-700">{{ boletaEmitida.ruta }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Fecha de Viaje:</span>
              <span class="font-semibold">{{ boletaEmitida.fechaViaje }} (Salida {{ boletaEmitida.horario }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Bus / Asiento(s):</span>
              <strong class="text-blue-700 font-bold">Bus #{{ boletaEmitida.busId }} · Asiento(s): {{ boletaEmitida.asientos.join(', ') }}</strong>
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
                    class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white transition-colors">
              Aceptar y Volver
            </button>
          </div>
        </div>
      </div>

      <!-- ================= PESTAÑA 2: VISTA DEL CONDUCTOR (BUS Y LISTA LADO A LADO) ================= -->
      <div *ngIf="tabActiva === 'conductor'" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">

        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Panel Oficial del Conductor</span>
              <span class="text-xs text-slate-500 font-medium">Asignado a: Mario Quispe Choque (Conductor #1)</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Control de Ocupación en Vivo y Lista de Pasajeros</h2>
            <p class="text-xs text-slate-500">Visualice en tiempo real cómo se va llenando su vehículo a medida que los pasajeros compran.</p>
          </div>

          <!-- Botón de Reinicio para la Demostración al Docente -->
          <div class="flex items-center gap-2">
            <button (click)="reiniciarBusDemostracion()"
                    class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all"
                    title="Vacía los asientos del bus para iniciar la demostración al docente desde cero">
              ↺ Reiniciar Bus de Prueba (0% Asientos)
            </button>
            <button (click)="cargarManifiesto()"
                    class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
              Actualizar
            </button>
          </div>
        </div>

        <!-- Métricas del Bus -->
        <div *ngIf="manifiesto" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-500">Vehículo</p>
            <p class="text-base font-bold text-slate-900">{{ manifiesto.placa }}</p>
            <p class="text-[11px] text-slate-500">{{ manifiesto.modelo }}</p>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p class="text-xs text-slate-500">Capacidad Total</p>
            <p class="text-base font-bold text-slate-900">{{ manifiesto.capacidadTotal }} Asientos</p>
          </div>
          <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <p class="text-xs text-rose-700 font-bold">Asientos Ocupados</p>
            <p class="text-xl font-black text-rose-800">{{ manifiesto.asientosOcupados }} Pasajeros</p>
          </div>
          <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <p class="text-xs text-emerald-700 font-bold">Asientos Libres</p>
            <p class="text-xl font-black text-emerald-800">{{ manifiesto.asientosDisponibles }} Libres</p>
          </div>
        </div>

        <!-- VISTA SPLIT: PLANO DEL BUS A LA IZQUIERDA Y LISTA A LA DERECHA -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">

          <!-- Columna Izquierda: Chasis Compacto en Vivo para el Conductor (5 Columnas) -->
          <div class="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <span class="text-xs font-bold text-slate-800">Plano de Asientos de Mi Bus</span>
              <span class="text-[11px] font-semibold text-blue-600">En Vivo</span>
            </div>

            <!-- Mini Chasis del Conductor -->
            <div class="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              <div *ngFor="let fila of filasBus"
                   class="flex items-center justify-between p-1 bg-white rounded-lg border border-slate-200 text-xs">
                <!-- Izq -->
                <div class="flex gap-1.5">
                  <span [class]="esAsientoOcupado(fila.izqVentana) ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-emerald-50 text-emerald-800 border-emerald-300'"
                        class="w-8 h-8 rounded border flex items-center justify-center font-mono">
                    {{ fila.izqVentana }}
                  </span>
                  <span [class]="esAsientoOcupado(fila.izqPasillo) ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-emerald-50 text-emerald-800 border-emerald-300'"
                        class="w-8 h-8 rounded border flex items-center justify-center font-mono">
                    {{ fila.izqPasillo }}
                  </span>
                </div>
                <!-- Pasillo -->
                <span class="text-[9px] text-slate-400 font-bold">F{{ fila.numeroFila }}</span>
                <!-- Der -->
                <div class="flex gap-1.5">
                  <span [class]="esAsientoOcupado(fila.derPasillo) ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-emerald-50 text-emerald-800 border-emerald-300'"
                        class="w-8 h-8 rounded border flex items-center justify-center font-mono">
                    {{ fila.derPasillo }}
                  </span>
                  <span [class]="esAsientoOcupado(fila.derVentana) ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-emerald-50 text-emerald-800 border-emerald-300'"
                        class="w-8 h-8 rounded border flex items-center justify-center font-mono">
                    {{ fila.derVentana }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Tabla Nominal de Pasajeros (7 Columnas) -->
          <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <span class="text-xs font-bold text-slate-800">Lista Nominal de Pasajeros a Bordo</span>
              <span class="text-xs text-slate-500 font-semibold">{{ manifiesto?.pasajeros?.length || 0 }} Registrados</span>
            </div>

            <div class="max-h-[440px] overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th class="px-3 py-2.5">Asiento</th>
                    <th class="px-3 py-2.5">Pasajero</th>
                    <th class="px-3 py-2.5">DNI</th>
                    <th class="px-3 py-2.5">Teléfono</th>
                    <th class="px-3 py-2.5">Ruta</th>
                    <th class="px-3 py-2.5">Pago</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let p of manifiesto?.pasajeros" class="hover:bg-slate-50 transition-colors">
                    <td class="px-3 py-2 font-black text-blue-700 text-xs">#{{ p.asiento }}</td>
                    <td class="px-3 py-2 font-bold text-slate-900">{{ p.nombrePasajero }}</td>
                    <td class="px-3 py-2 font-mono text-slate-600">{{ p.dniPasajero }}</td>
                    <td class="px-3 py-2 font-mono text-slate-600">{{ p.telefonoPasajero }}</td>
                    <td class="px-3 py-2 text-slate-600">{{ p.rutaNombre || 'Lima - Arequipa' }}</td>
                    <td class="px-3 py-2">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {{ p.metodoPago || 'TARJETA' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="!manifiesto || manifiesto?.pasajeros?.length === 0">
                    <td colspan="6" class="px-3 py-16 text-center text-slate-500 font-medium">
                      El bus está vacío en este momento. Al comprar un pasaje aparecerá aquí inmediatamente.
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
                   class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500"/>
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
          <div class="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p class="text-xs text-blue-800 font-medium">Total I.G.V. (18%)</p>
            <p class="text-xl font-black text-blue-900 mt-1">S/ {{ igvTotalVentas.toFixed(2) }}</p>
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
                <td class="px-4 py-3 font-mono font-bold text-blue-700">{{ v.numeroBoleta || ('B001-' + v.id) }}</td>
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
  tabActiva: 'reserva' | 'conductor' | 'ventas' = 'reserva';
  private pollingSub?: Subscription;

  // Sesión
  sesionActual: UserSession | null = null;

  // Rutas Interprovinciales
  rutasDisponibles: RutaOpcion[] = [
    { id: 19, nombre: 'Juliaca ➔ Cusco', origen: 'Juliaca', destino: 'Cusco', busId: 3, precio: 35.00, horario: '07:30 hrs' },
    { id: 20, nombre: 'Cusco ➔ Juliaca', origen: 'Cusco', destino: 'Juliaca', busId: 4, precio: 35.00, horario: '14:00 hrs' },
    { id: 21, nombre: 'Cusco ➔ Arequipa', origen: 'Cusco', destino: 'Arequipa', busId: 5, precio: 40.00, horario: '21:00 hrs' },
    { id: 22, nombre: 'Arequipa ➔ Cusco', origen: 'Arequipa', destino: 'Cusco', busId: 2, precio: 40.00, horario: '20:00 hrs' },
    { id: 23, nombre: 'Lima ➔ Arequipa', origen: 'Lima', destino: 'Arequipa', busId: 1, precio: 55.00, horario: '18:30 hrs' },
    { id: 24, nombre: 'Arequipa ➔ Lima', origen: 'Arequipa', destino: 'Lima', busId: 1, precio: 55.00, horario: '19:00 hrs' }
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
  conductorIdConsulta = 1;
  manifiesto: any = null;

  // Ventas Admin
  fechaFiltroVentas = '';
  listaVentas: any[] = [];
  totalBoletosVendidos = 0;
  totalRecaudado = 0;
  subtotalGravadoVentas = 0;
  igvTotalVentas = 0;

  get totalAPagar(): number {
    return this.asientosSeleccionados.length * this.rutaActual.precio;
  }

  constructor(
    private reservasService: ReservasService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.construirPlanoBus();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.sesionActual = user;
      if (user && user.roles.includes('CLIENTE')) {
        // Solo autocompletar si el usuario inició sesión explícitamente
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

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
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
    this.asientosSeleccionados = [];
    this.cargarAsientosOcupados();
  }

  cargarAsientosOcupados() {
    this.reservasService.getAsientosOcupados(this.busSeleccionado, this.fechaSeleccionada).subscribe({
      next: (resp: any) => {
        if (resp && resp.asientosOcupados) {
          this.asientosOcupados = [...resp.asientosOcupados];
          this.asientosSeleccionados = this.asientosSeleccionados.filter(a => !this.asientosOcupados.includes(a));
          this.cdr.detectChanges(); // Fuerza renderizado inmediato
        }
      },
      error: () => {}
    });
  }

  cargarAsientosOcupadosSilencioso() {
    this.reservasService.getAsientosOcupados(this.busSeleccionado, this.fechaSeleccionada).subscribe({
      next: (resp: any) => {
        if (resp && resp.asientosOcupados) {
          this.asientosOcupados = [...resp.asientosOcupados];
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  esAsientoOcupado(num: number): boolean {
    return this.asientosOcupados.includes(num);
  }

  toggleSeleccionAsiento(num: number) {
    if (this.esAsientoOcupado(num)) return;
    this.mensajeErrorForm = '';
    if (this.asientosSeleccionados.includes(num)) {
      this.asientosSeleccionados = this.asientosSeleccionados.filter(a => a !== num);
    } else {
      this.asientosSeleccionados.push(num);
      this.asientosSeleccionados.sort((a, b) => a - b);
    }
    this.cdr.detectChanges();
  }

  obtenerClaseBotonAsiento(num: number): string {
    if (this.esAsientoOcupado(num)) {
      return 'bg-rose-50 border-2 border-rose-300 text-rose-700 cursor-not-allowed opacity-90';
    }
    if (this.asientosSeleccionados.includes(num)) {
      return 'bg-blue-600 border-2 border-blue-700 text-white font-black shadow-md scale-105 ring-2 ring-blue-300';
    }
    return 'bg-white border-2 border-emerald-300 text-slate-800 hover:border-blue-500 hover:bg-blue-50';
  }

  obtenerTextoEstadoAsiento(num: number): string {
    if (this.esAsientoOcupado(num)) return 'OCUPADO';
    if (this.asientosSeleccionados.includes(num)) return 'ELEGIDO';
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

        const total = this.totalAPagar;
        const subtotal = total / 1.18;
        const igv = total - subtotal;
        const fechaHora = new Date().toLocaleString('es-PE');

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
          total: total
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
