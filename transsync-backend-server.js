const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8100;
const DATA_FILE = path.join(__dirname, 'backend-state.json');
// Credencial Oficial PRODUCCIÓN EN VIVO (Christian Yoel)
const MP_ACCESS_TOKEN = 'APP_USR-5501313215680220-112622-86779b5604644079000232c5168d0ada-3853588557';

// Estado inicial persistente
let state = {
  asientosOcupadosPorBus: {
    '1': [3, 4, 7],
    '2': [1, 2],
    '5': [15, 16]
  },
  reservasTemporales: {}, // key: "busId_fechaViaje" -> array de { asientos: [], expira: timestamp }
  reservas: [
    {
      id: 101,
      busId: 1,
      fechaViaje: new Date().toISOString().split('T')[0],
      asiento: 3,
      nombrePasajero: 'Juan Pérez Ramos',
      dniPasajero: '45892014',
      telefonoPasajero: '984123456',
      numeroBoleta: 'B001-000101',
      precio: 35.0,
      metodoPago: 'YAPE',
      fechaHora: new Date().toLocaleString('es-PE'),
      abordado: true
    },
    {
      id: 102,
      busId: 1,
      fechaViaje: new Date().toISOString().split('T')[0],
      asiento: 4,
      nombrePasajero: 'María Condori Quispe',
      dniPasajero: '70231948',
      telefonoPasajero: '951789234',
      numeroBoleta: 'B001-000102',
      precio: 35.0,
      metodoPago: 'TARJETA',
      fechaHora: new Date().toLocaleString('es-PE'),
      abordado: false
    },
    {
      id: 103,
      busId: 1,
      fechaViaje: new Date().toISOString().split('T')[0],
      asiento: 7,
      nombrePasajero: 'Pedro Mamani Flores',
      dniPasajero: '60124893',
      telefonoPasajero: '978456123',
      numeroBoleta: 'B001-000103',
      precio: 35.0,
      metodoPago: 'TRANSFERENCIA',
      fechaHora: new Date().toLocaleString('es-PE'),
      abordado: false
    }
  ],
  rutas: [
    { id: 99, origen: 'Juliaca', destino: 'Puno', precio: 1.00, horario: '10:00 hrs' },
    { id: 1, origen: 'Juliaca', destino: 'Arequipa', precio: 35.00, horario: '08:00 hrs' },
    { id: 2, origen: 'Puno', destino: 'Cusco', precio: 45.00, horario: '14:30 hrs' },
    { id: 3, origen: 'Arequipa', destino: 'Lima', precio: 80.00, horario: '20:00 hrs' },
    { id: 4, origen: 'Cusco', destino: 'Arequipa', precio: 50.00, horario: '21:00 hrs' },
    { id: 5, origen: 'Lima', destino: 'Huancayo', precio: 40.00, horario: '07:00 hrs' }
  ],
  historialAuditoriaRutas: [
    {
      id: 1,
      rutaId: 99,
      tipoOperacion: 'CREACION',
      origen: 'Juliaca',
      destino: 'Puno',
      horario: '10:00 hrs',
      precio: 3.00,
      detallesNuevos: 'Ruta creada inicialmente: Juliaca -> Puno a S/.3.00',
      fechaOperacion: new Date().toISOString()
    }
  ],
  buses: [
    { id: 1, placa: 'BUS-TS-01', modelo: 'Scania Touring HD', capacidad: 48, asientosDisponibles: 45, estado: 'OPERATIVO' },
    { id: 2, placa: 'BUS-TS-02', modelo: 'Volvo B430R', capacidad: 48, asientosDisponibles: 46, estado: 'OPERATIVO' },
    { id: 3, placa: 'BUS-TS-03', modelo: 'Mercedes Travego', capacidad: 48, asientosDisponibles: 48, estado: 'MANTENIMIENTO' },
    { id: 4, placa: 'BUS-TS-04', modelo: 'Marcopolo G8', capacidad: 48, asientosDisponibles: 48, estado: 'OPERATIVO' },
    { id: 5, placa: 'T3C-104', modelo: 'Volvo 9700 Grand', capacidad: 48, asientosDisponibles: 46, estado: 'OPERATIVO' },
    { id: 6, placa: 'BUS-TS-06', modelo: 'Scania Irizar i6S', capacidad: 48, asientosDisponibles: 48, estado: 'OPERATIVO' }
  ],
  mantenimientos: [
    {
      id: 1,
      busId: 3,
      busPlaca: 'BUS-TS-03',
      busModelo: 'Mercedes Travego',
      tipoMantenimiento: 'PREVENTIVO',
      estado: 'EN_MANTENIMIENTO',
      descripcion: 'Revisión técnica de frenos y cambio de aceite de motor',
      tallerAsignado: 'Taller Central TransSync',
      taller: 'Taller Central TransSync',
      costoEstimado: 850.0,
      costo: 850.0,
      fechaProgramada: '2026-11-19',
      fechaInicio: '2026-11-19',
      bloqueaOperacion: true
    }
  ],
  pagos: [
    { id: 1, reservaId: 101, monto: 35.0, metodoPago: 'YAPE', estado: 'COMPLETADO', fechaPago: new Date().toISOString() },
    { id: 2, reservaId: 102, monto: 35.0, metodoPago: 'TARJETA', estado: 'COMPLETADO', fechaPago: new Date().toISOString() },
    { id: 3, reservaId: 103, monto: 35.0, metodoPago: 'EFECTIVO', estado: 'COMPLETADO', fechaPago: new Date().toISOString() }
  ],
  pagosMpConsumidos: [],
  promociones: [
    { id: 1, titulo: 'Tarifa Especial: Juliaca - Cusco', descripcion: 'Ahorre en sus traslados interprovinciales nocturnos con asientos reclinables estándar.', descuento: 20, fechaFin: '30/11/2026', activo: true },
    { id: 2, titulo: 'Viaje Grupal / Familiar', descripcion: 'Compre 3 o más asientos y reciba 5 puntos de fidelización directos más 10% de descuento.', descuento: 10, fechaFin: '31/12/2026', activo: true },
    { id: 3, titulo: 'Corredor Cusco - Arequipa', descripcion: 'Tarifa corporativa y turística con seguro de viaje incluido y servicio directo.', descuento: 15, fechaFin: '31/12/2026', activo: true }
  ]
};

// Cargar estado de disco si existe
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const loaded = JSON.parse(raw);
    state = Object.assign(state, loaded);
    if (!state.rutas || !Array.isArray(state.rutas) || state.rutas.length === 0) {
      state.rutas = [
        { id: 99, origen: 'Juliaca', destino: 'Puno', precio: 1.00, horario: '10:00 hrs' },
        { id: 1, origen: 'Juliaca', destino: 'Arequipa', precio: 35.00, horario: '08:00 hrs' },
        { id: 2, origen: 'Puno', destino: 'Cusco', precio: 45.00, horario: '14:30 hrs' },
        { id: 3, origen: 'Arequipa', destino: 'Lima', precio: 80.00, horario: '20:00 hrs' },
        { id: 4, origen: 'Cusco', destino: 'Arequipa', precio: 50.00, horario: '21:00 hrs' },
        { id: 5, origen: 'Lima', destino: 'Huancayo', precio: 40.00, horario: '07:00 hrs' }
      ];
    }
    if (!state.historialAuditoriaRutas || !Array.isArray(state.historialAuditoriaRutas)) {
      state.historialAuditoriaRutas = [];
    }
    if (!state.buses || !Array.isArray(state.buses) || state.buses.length === 0) {
      state.buses = [
        { id: 1, placa: 'BUS-TS-01', modelo: 'Scania Touring HD', capacidad: 48, asientosDisponibles: 45, estado: 'OPERATIVO' },
        { id: 2, placa: 'BUS-TS-02', modelo: 'Volvo B430R', capacidad: 48, asientosDisponibles: 46, estado: 'OPERATIVO' },
        { id: 3, placa: 'BUS-TS-03', modelo: 'Mercedes Travego', capacidad: 48, asientosDisponibles: 48, estado: 'MANTENIMIENTO' },
        { id: 4, placa: 'BUS-TS-04', modelo: 'Marcopolo G8', capacidad: 48, asientosDisponibles: 48, estado: 'OPERATIVO' },
        { id: 5, placa: 'T3C-104', modelo: 'Volvo 9700 Grand', capacidad: 48, asientosDisponibles: 46, estado: 'OPERATIVO' },
        { id: 6, placa: 'BUS-TS-06', modelo: 'Scania Irizar i6S', capacidad: 48, asientosDisponibles: 48, estado: 'OPERATIVO' }
      ];
    }
    if (!state.mantenimientos || !Array.isArray(state.mantenimientos)) {
      state.mantenimientos = [];
    }
    if (!state.pagos || !Array.isArray(state.pagos)) {
      state.pagos = (state.reservas || []).map((r, idx) => ({
        id: idx + 1,
        reservaId: r.id,
        monto: Number(r.precio) || 35.0,
        metodoPago: r.metodoPago || 'EFECTIVO',
        estado: 'COMPLETADO',
        fechaPago: new Date().toISOString()
      }));
    }
    if (!state.pagosMpConsumidos || !Array.isArray(state.pagosMpConsumidos)) {
      state.pagosMpConsumidos = [];
    }
    if (!state.promociones || !Array.isArray(state.promociones) || state.promociones.length === 0) {
      state.promociones = [
        { id: 1, titulo: 'Tarifa Especial: Juliaca - Cusco', descripcion: 'Ahorre en sus traslados interprovinciales nocturnos con asientos reclinables estándar.', descuento: 20, fechaFin: '30/11/2026', activo: true },
        { id: 2, titulo: 'Viaje Grupal / Familiar', descripcion: 'Compre 3 o más asientos y reciba 5 puntos de fidelización directos más 10% de descuento.', descuento: 10, fechaFin: '31/12/2026', activo: true },
        { id: 3, titulo: 'Corredor Cusco - Arequipa', descripcion: 'Tarifa corporativa y turística con seguro de viaje incluido y servicio directo.', descuento: 15, fechaFin: '31/12/2026', activo: true }
      ];
    }
  } catch (err) {
    console.error('Error al cargar estado previo:', err.message);
  }
}

function persistState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar estado:', err.message);
  }
}

// Limpiar reservas temporales vencidas periódicamente
setInterval(() => {
  const ahora = Date.now();
  let changed = false;
  for (const k in state.reservasTemporales) {
    const arr = state.reservasTemporales[k] || [];
    const validos = arr.filter(item => item.expira > ahora);
    if (validos.length !== arr.length) {
      state.reservasTemporales[k] = validos;
      changed = true;
    }
  }
  if (changed) persistState();
}, 2000);

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Leer body para POST/PUT
  let bodyStr = '';
  req.on('data', chunk => {
    bodyStr += chunk;
  });

  req.on('end', () => {
    let body = {};
    if (bodyStr) {
      try {
        body = JSON.parse(bodyStr);
      } catch (e) {}
    }

    // Helper respuesta JSON
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // ROUTING
    // 1. AUTH LOGIN
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const email = body.email;
      let user = null;
      if (email === 'admin@transsync.com') {
        user = {
          token: 'jwt-admin-token-transsync-2026',
          email: 'admin@transsync.com',
          nombre: 'Administrador General',
          roles: ['ADMIN']
        };
      } else if (email === 'conductor@transsync.com') {
        user = {
          token: 'jwt-conductor-token-transsync-2026',
          email: 'conductor@transsync.com',
          nombre: 'Mario Quispe Choque',
          roles: ['CONDUCTOR'],
          idConductor: 1
        };
      } else {
        user = {
          token: 'jwt-cliente-token-transsync-2026',
          email: email || 'cliente@transsync.com',
          nombre: 'Carlos Mendoza Ramos',
          roles: ['CLIENTE'],
          idCliente: 101,
          dni: '72384910',
          telefono: '951234567',
          puntosFidelizacion: 35
        };
      }
      return sendJson(200, { exito: true, datos: user });
    }

    // 2. ASIENTOS OCUPADOS Y EN RESERVA
    // GET /api/reservas/bus/:busId/asientos-ocupados
    const matchAsientos = pathname.match(/^\/api\/reservas\/bus\/(\d+)\/asientos-ocupados$/);
    if (matchAsientos && req.method === 'GET') {
      const busId = matchAsientos[1];
      const fechaViaje = query.fechaViaje || new Date().toISOString().split('T')[0];
      const ocupados = state.asientosOcupadosPorBus[busId] || [];

      // Temporales activos
      const keyTemp = `${busId}_${fechaViaje}`;
      const temporalesArr = state.reservasTemporales[keyTemp] || [];
      const ahora = Date.now();
      const asientosEnReserva = [];
      temporalesArr.forEach(item => {
        if (item.expira > ahora) {
          asientosEnReserva.push(...item.asientos);
        }
      });

      return sendJson(200, {
        busId: Number(busId),
        fechaViaje,
        asientosOcupados: ocupados,
        asientosEnReserva: [...new Set(asientosEnReserva)]
      });
    }

    // 3. BLOQUEAR TEMPORAL
    if (pathname === '/api/reservas/bloquear-temporal' && req.method === 'POST') {
      const busId = String(body.busId || '1');
      const fechaViaje = body.fechaViaje || new Date().toISOString().split('T')[0];
      const asientos = body.asientos || [];
      const keyTemp = `${busId}_${fechaViaje}`;

      if (!state.reservasTemporales[keyTemp]) {
        state.reservasTemporales[keyTemp] = [];
      }
      // Agregar reserva temporal por 5 minutos (300s)
      state.reservasTemporales[keyTemp].push({
        asientos: asientos,
        expira: Date.now() + 300 * 1000
      });
      persistState();
      return sendJson(200, { exito: true, mensaje: 'Asientos bloqueados temporalmente por 5 minutos' });
    }

    // 4. LIBERAR TEMPORAL
    if (pathname === '/api/reservas/liberar-temporal' && req.method === 'POST') {
      const busId = String(body.busId || '1');
      const fechaViaje = body.fechaViaje || new Date().toISOString().split('T')[0];
      const asientosALiberar = body.asientos || [];
      const keyTemp = `${busId}_${fechaViaje}`;

      if (state.reservasTemporales[keyTemp]) {
        state.reservasTemporales[keyTemp] = state.reservasTemporales[keyTemp].map(item => {
          return {
            ...item,
            asientos: item.asientos.filter(a => !asientosALiberar.includes(a))
          };
        }).filter(item => item.asientos.length > 0);
      }
      persistState();
      return sendJson(200, { exito: true, mensaje: 'Asientos liberados' });
    }

    // 4b. LISTAR TODAS LAS RESERVAS (GET /api/reservas) Y DETALLE (GET /api/reservas/:id)
    if (pathname === '/api/reservas' && req.method === 'GET') {
      const lista = (state.reservas || []).map(r => ({
        ...r,
        asientoNumero: r.asiento,
        estado: r.estado || 'CONFIRMADA'
      }));
      return sendJson(200, { exito: true, mensaje: 'Reservas obtenidas correctamente', datos: lista });
    }

    const matchHistorialDni = pathname.match(/^\/api\/reservas\/historial\/cliente\/([^/]+)$/);
    if (matchHistorialDni && req.method === 'GET') {
      const dni = decodeURIComponent(matchHistorialDni[1]);
      const filtradas = (state.reservas || []).filter(r => String(r.dniPasajero) === dni);
      return sendJson(200, { exito: true, dni, totalReservas: filtradas.length, datos: filtradas });
    }

    const matchHistorialEmail = pathname.match(/^\/api\/reservas\/historial\/usuario\/([^/]+)$/);
    if (matchHistorialEmail && req.method === 'GET') {
      const email = decodeURIComponent(matchHistorialEmail[1]).toLowerCase();
      const filtradas = (state.reservas || []).filter(r => (r.emailPasajero || '').toLowerCase() === email);
      return sendJson(200, { exito: true, email, totalReservas: filtradas.length, datos: filtradas });
    }

    // 5. CREAR RESERVAS MÚLTIPLES (COMPRA CONFIRMADA)
    if (pathname === '/api/reservas/multiple' && req.method === 'POST') {
      const busId = String(body.busId || '1');
      const busIdNum = Number(busId);
      const fechaViaje = body.fechaViaje || new Date().toISOString().split('T')[0];
      const asientos = Array.isArray(body.asientos) ? body.asientos.map(Number) : [];
      const nombrePasajero = body.nombrePasajero || 'Pasajero General';
      const dniPasajero = body.dniPasajero || '00000000';
      const telefonoPasajero = body.telefonoPasajero || '';
      const emailPasajero = body.emailPasajero || '';
      const metodoPago = body.metodoPago || 'EFECTIVO';
      const precioUnitario = Number(body.precioUnitario) || 35.0;

      if (asientos.length === 0) {
        return sendJson(400, { exito: false, mensaje: 'Debe seleccionar al menos 1 asiento' });
      }

      // Validar que el bus no esté en mantenimiento
      const busObj = (state.buses || []).find(b => b.id === busIdNum);
      const enMant = (busObj && busObj.estado === 'MANTENIMIENTO') ||
        (state.mantenimientos || []).some(m => m.busId === busIdNum && m.estado === 'EN_MANTENIMIENTO');
      if (enMant) {
        return sendJson(409, { exito: false, mensaje: `El bus #${busIdNum} se encuentra EN MANTENIMIENTO PREVENTIVO y no admite reservas.` });
      }

      // Validar que ninguno de los asientos ya esté ocupado
      if (!state.asientosOcupadosPorBus[busId]) {
        state.asientosOcupadosPorBus[busId] = [];
      }
      const yaOcupado = asientos.find(a => state.asientosOcupadosPorBus[busId].includes(a));
      if (yaOcupado !== undefined) {
        return sendJson(409, { exito: false, mensaje: `El asiento #${yaOcupado} ya fue comprado y confirmado por otro cliente.` });
      }

      // 1. Agregar a ocupados y descontar asientos en bus
      state.asientosOcupadosPorBus[busId] = [...new Set([...state.asientosOcupadosPorBus[busId], ...asientos])];
      if (busObj) {
        const cap = Number(busObj.capacidad) || 48;
        busObj.asientosDisponibles = Math.max(0, cap - state.asientosOcupadosPorBus[busId].length);
      }

      // 2. Limpiar de temporales
      const keyTemp = `${busId}_${fechaViaje}`;
      if (state.reservasTemporales[keyTemp]) {
        state.reservasTemporales[keyTemp] = state.reservasTemporales[keyTemp].map(item => ({
          ...item,
          asientos: item.asientos.filter(a => !asientos.includes(a))
        })).filter(item => item.asientos.length > 0);
      }

      // 3. Crear registros individuales
      const nuevasReservas = [];
      const esFactura = body.tipoComprobante === 'FACTURA';
      const prefijo = esFactura ? 'F001-' : 'B001-';
      const numComprobante = body.numeroComprobante || (prefijo + String(Math.floor(100000 + Math.random() * 900000)));

      asientos.forEach((asiento, idx) => {
        const id = Date.now() + idx;
        const resObj = {
          id: id,
          busId: busIdNum,
          rutaId: body.rutaId || 1,
          rutaNombre: body.rutaNombre || 'Juliaca ➔ Puno',
          fechaViaje: fechaViaje,
          asiento: asiento,
          asientoNumero: asiento,
          tipoComprobante: esFactura ? 'FACTURA' : 'BOLETA',
          numeroComprobante: numComprobante,
          numeroBoleta: numComprobante,
          nombrePasajero: nombrePasajero,
          dniPasajero: dniPasajero,
          telefonoPasajero: telefonoPasajero,
          emailPasajero: emailPasajero,
          ruc: body.rucEmpresa || body.ruc || '',
          razonSocial: body.razonSocial || '',
          direccionFiscal: body.direccionFiscal || '',
          precio: precioUnitario,
          metodoPago: metodoPago,
          fechaHora: new Date().toLocaleString('es-PE'),
          estado: 'CONFIRMADA',
          abordado: false
        };
        state.reservas.unshift(resObj);
        nuevasReservas.push(resObj);
      });

      // 4. Registrar transacción en state.pagos para Conciliación / Dashboard
      if (!state.pagos) state.pagos = [];
      const maxPagoId = state.pagos.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
      const montoTotal = Math.round(asientos.length * precioUnitario * 100) / 100;
      const metodoNormalizado = metodoPago.toUpperCase().includes('YAPE') ? 'YAPE' :
        (metodoPago.toUpperCase().includes('PLIN') ? 'PLIN' :
        (metodoPago.toUpperCase().includes('EFECTIVO') ? 'EFECTIVO' : 'TARJETA'));
      state.pagos.unshift({
        id: maxPagoId + 1,
        reservaId: nuevasReservas[0].id,
        monto: montoTotal,
        metodoPago: metodoNormalizado,
        estado: 'COMPLETADO',
        fechaPago: new Date().toISOString()
      });

      if (body.paymentId) {
        if (!state.pagosMpConsumidos) state.pagosMpConsumidos = [];
        if (!state.pagosMpConsumidos.includes(String(body.paymentId))) {
          state.pagosMpConsumidos.push(String(body.paymentId));
        }
      }

      persistState();
      return sendJson(200, {
        exito: true,
        mensaje: 'Reservas generadas exitosamente',
        datos: { reservas: nuevasReservas }
      });
    }

    // 6. MANIFIESTO DEL CONDUCTOR
    // GET /api/reservas/conductor/:id/manifiesto
    const matchManifiesto = pathname.match(/^\/api\/reservas\/conductor\/(\d+)\/manifiesto$/);
    if (matchManifiesto && req.method === 'GET') {
      const conductorId = Number(matchManifiesto[1]);
      const busIdParam = Number(query.busId) || conductorId || 1;
      const busObj = (state.buses || []).find(b => b.id === busIdParam);
      const pasajeros = state.reservas.filter(r => r.busId === busIdParam).map(r => ({
        reservaId: r.id,
        asiento: r.asiento,
        nombrePasajero: r.nombrePasajero,
        dniPasajero: r.dniPasajero,
        telefonoPasajero: r.telefonoPasajero,
        numeroBoleta: r.numeroComprobante || r.numeroBoleta,
        tipoComprobante: r.tipoComprobante || 'BOLETA',
        ruc: r.ruc || '',
        razonSocial: r.razonSocial || '',
        abordado: !!r.abordado
      }));

      return sendJson(200, {
        busId: busIdParam,
        conductorNombre: 'Mario Quispe Choque',
        totalPasajeros: pasajeros.length,
        asientosOcupados: pasajeros.length,
        capacidadTotal: busObj ? busObj.capacidad : 48,
        pasajeros: pasajeros
      });
    }

    // 7. FINALIZAR VIAJE CONDUCTOR
    if (pathname === '/api/reservas/finalizar-viaje' && req.method === 'POST') {
      const busId = String(body.busId || '1');
      const busIdNum = Number(busId);
      state.asientosOcupadosPorBus[busId] = [];
      state.reservas = state.reservas.filter(r => r.busId !== busIdNum);
      const busObj = (state.buses || []).find(b => b.id === busIdNum);
      if (busObj) busObj.asientosDisponibles = busObj.capacidad || 48;
      persistState();
      return sendJson(200, { exito: true, mensaje: `Viaje finalizado con éxito para Bus #${busId}. Todos los asientos quedaron liberados.` });
    }

    // 7b. REINICIAR BUS (Liberar asientos)
    const matchReiniciar = pathname.match(/^\/api\/reservas\/bus\/(\d+)\/reiniciar$/);
    if (matchReiniciar && (req.method === 'DELETE' || req.method === 'POST')) {
      const busId = matchReiniciar[1];
      const busIdNum = Number(busId);
      state.asientosOcupadosPorBus[busId] = [];
      state.reservas = state.reservas.filter(r => r.busId !== busIdNum);
      const busObj = (state.buses || []).find(b => b.id === busIdNum);
      if (busObj) busObj.asientosDisponibles = busObj.capacidad || 48;
      persistState();
      return sendJson(200, { exito: true, mensaje: `Bus #${busId} reiniciado con éxito. Todos los asientos han sido liberados.` });
    }

    // 8. AUDITORÍA VENTAS ADMIN
    if (pathname === '/api/reservas/ventas' && req.method === 'GET') {
      const fechaFiltro = query.fecha ? String(query.fecha).trim() : '';
      const ventasFiltradas = fechaFiltro
        ? (state.reservas || []).filter(r => r.fechaViaje === fechaFiltro)
        : (state.reservas || []);
      const totalRecaudado = ventasFiltradas.reduce((acc, r) => acc + (Number(r.precio) || 0), 0);
      const subtotal = totalRecaudado / 1.18;
      const igv = totalRecaudado - subtotal;
      return sendJson(200, {
        totalVentas: ventasFiltradas.length,
        totalBoletosVendidos: ventasFiltradas.length,
        totalRecaudado: totalRecaudado,
        subtotalGravado: subtotal,
        igvTotal: igv,
        ventas: ventasFiltradas
      });
    }

    const matchReservaId = pathname.match(/^\/api\/reservas\/(\d+)$/);
    if (matchReservaId && req.method === 'GET') {
      const id = Number(matchReservaId[1]);
      const resFound = (state.reservas || []).find(r => r.id === id);
      if (!resFound) return sendJson(404, { exito: false, mensaje: `Reserva no encontrada con id: ${id}` });
      return sendJson(200, { exito: true, datos: resFound });
    }

    // 9. MERCADO PAGO: CREAR PREFERENCIA REAL
    if (pathname === '/api/pagos/crear-preferencia' && req.method === 'POST') {
      console.log('Recibida petición crear preferencia Mercado Pago:', body);

      const emailPayer = (body.emailComprador && body.emailComprador.includes('@') && !body.emailComprador.includes('transsync.com'))
        ? body.emailComprador.trim()
        : 'tkamado321@gmail.com';

      const postDataObj = {
        items: [
          {
            title: body.rutaNombre || 'Pasaje TransSync Interprovincial',
            quantity: Number(body.cantidadPasajes) || 1,
            unit_price: Number(body.montoTotal) / (Number(body.cantidadPasajes) || 1),
            currency_id: 'PEN'
          }
        ],
        payer: {
          name: body.nombreComprador || 'Pasajero TransSync',
          email: emailPayer
        },
        back_urls: {
          success: (body.frontendUrl || 'http://localhost:4200/reservas') + '?mp_status=approved',
          pending: (body.frontendUrl || 'http://localhost:4200/reservas') + '?mp_status=pending',
          failure: (body.frontendUrl || 'http://localhost:4200/reservas') + '?mp_status=failure'
        }
      };
      const postData = JSON.stringify(postDataObj);

      const options = {
        hostname: 'api.mercadopago.com',
        path: '/checkout/preferences',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const mpReq = https.request(options, mpRes => {
        let mpData = '';
        mpRes.on('data', d => { mpData += d; });
        mpRes.on('end', () => {
          try {
            const parsed = JSON.parse(mpData);
            console.log('Respuesta MP Status:', mpRes.statusCode, 'Body:', mpData);
            return sendJson(mpRes.statusCode, {
              id: parsed.id,
              init_point: parsed.init_point,
              sandbox_init_point: parsed.sandbox_init_point,
              error: parsed.message || parsed.error
            });
          } catch (e) {
            console.error('Error parseando respuesta MP:', e);
            return sendJson(500, { error: 'Error parseando respuesta de Mercado Pago' });
          }
        });
      });

      mpReq.on('error', err => {
        console.error('Error llamando a Mercado Pago API:', err.message);
        return sendJson(500, { error: err.message });
      });

      mpReq.write(postData);
      mpReq.end();
      return;
    }

    // 9.1 VERIFICAR ÚLTIMO PAGO EN MERCADO PAGO API (Detección en tiempo real sin salir ni recargar)
    if (pathname === '/api/pagos/verificar-ultimo-pago' && req.method === 'GET') {
      const options = {
        hostname: 'api.mercadopago.com',
        path: '/v1/payments/search?sort=date_created&criteria=desc&limit=1',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      };

      const mpReq = https.request(options, mpRes => {
        let mpData = '';
        mpRes.on('data', d => { mpData += d; });
        mpRes.on('end', () => {
          try {
            const parsed = JSON.parse(mpData);
            if (parsed.results && parsed.results.length > 0) {
              const ultimo = parsed.results[0];
              const ahora = Date.now();
              const fechaAprobado = new Date(ultimo.date_approved || ultimo.date_created).getTime();
              const minutosDiferencia = (ahora - fechaAprobado) / (1000 * 60);

              // Si se aprobó recientemente (últimas 2 horas) y no fue consumido ya por una reserva
              const yaConsumido = (state.pagosMpConsumidos || []).includes(String(ultimo.id));
              if (ultimo.status === 'approved' && minutosDiferencia < 120 && !yaConsumido) {
                return sendJson(200, {
                  aprobado: true,
                  paymentId: String(ultimo.id),
                  status: ultimo.status,
                  metodoPago: (ultimo.payment_method_id || 'YAPE').toUpperCase(),
                  monto: ultimo.transaction_amount
                });
              }
            }
            return sendJson(200, { aprobado: false });
          } catch (e) {
            return sendJson(200, { aprobado: false, error: e.message });
          }
        });
      });

      mpReq.on('error', err => {
        return sendJson(200, { aprobado: false, error: err.message });
      });

      mpReq.end();
      return;
    }

    // 9.2 PAGOS CRUD (EFECTIVO, YAPE, PLIN, TARJETA) Y CONCILIACIÓN
    if (pathname === '/api/pagos' && req.method === 'GET') {
      return sendJson(200, {
        exito: true,
        mensaje: 'Pagos obtenidos correctamente',
        datos: state.pagos || []
      });
    }

    const matchPagoId = pathname.match(/^\/api\/pagos\/(\d+)$/);
    if (matchPagoId && req.method === 'GET') {
      const id = Number(matchPagoId[1]);
      const pago = (state.pagos || []).find(p => p.id === id);
      if (!pago) return sendJson(404, { exito: false, mensaje: `Pago no encontrado con id: ${id}` });
      return sendJson(200, { exito: true, mensaje: 'Pago encontrado', datos: pago });
    }

    if (pathname === '/api/pagos' && req.method === 'POST') {
      const monto = Number(body.monto);
      const reservaId = Number(body.reservaId);
      if (!reservaId || isNaN(reservaId) || reservaId <= 0) {
        return sendJson(400, { exito: false, mensaje: 'Debe especificar un ID de reserva válido' });
      }
      if (!monto || isNaN(monto) || monto <= 0) {
        return sendJson(400, { exito: false, mensaje: 'El monto debe ser mayor a S/. 0.00' });
      }
      if (!state.pagos) state.pagos = [];
      const maxId = state.pagos.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
      const nuevoPago = {
        id: maxId + 1,
        reservaId: reservaId,
        monto: monto,
        metodoPago: (body.metodoPago || 'EFECTIVO').toUpperCase(),
        estado: (body.estado || 'COMPLETADO').toUpperCase(),
        fechaPago: body.fechaPago || new Date().toISOString()
      };
      state.pagos.unshift(nuevoPago);
      persistState();
      return sendJson(201, { exito: true, mensaje: 'Pago registrado correctamente', datos: nuevoPago });
    }

    if (matchPagoId && req.method === 'PUT') {
      const id = Number(matchPagoId[1]);
      const idx = (state.pagos || []).findIndex(p => p.id === id);
      if (idx === -1) return sendJson(404, { exito: false, mensaje: `Pago no encontrado con id: ${id}` });
      state.pagos[idx] = { ...state.pagos[idx], ...body, id };
      persistState();
      return sendJson(200, { exito: true, mensaje: 'Pago actualizado correctamente', datos: state.pagos[idx] });
    }

    if (matchPagoId && req.method === 'DELETE') {
      const id = Number(matchPagoId[1]);
      const idx = (state.pagos || []).findIndex(p => p.id === id);
      if (idx === -1) return sendJson(404, { exito: false, mensaje: `Pago no encontrado con id: ${id}` });
      state.pagos[idx].estado = 'RECHAZADO';
      persistState();
      return sendJson(200, { exito: true, mensaje: 'Pago marcado como rechazado', datos: state.pagos[idx] });
    }

    // 9.3 PROMOCIONES
    if (pathname === '/api/promociones' && req.method === 'GET') {
      return sendJson(200, {
        exito: true,
        mensaje: 'Lista de promociones obtenida correctamente',
        datos: state.promociones || []
      });
    }

    // 10. RUTAS CATÁLOGO
    // 10.1 Listar todas las rutas
    if (pathname === '/api/rutas' && req.method === 'GET') {
      return sendJson(200, {
        exito: true,
        mensaje: 'Rutas obtenidas correctamente',
        datos: state.rutas
      });
    }

    // 10.2 Historial de auditoría de rutas
    if (pathname === '/api/rutas/historial' && req.method === 'GET') {
      return sendJson(200, {
        exito: true,
        mensaje: 'Historial de auditoría transaccional de rutas obtenido',
        datos: state.historialAuditoriaRutas || []
      });
    }

    // 10.3 Estadísticas de rutas
    if (pathname === '/api/rutas/estadisticas' && req.method === 'GET') {
      const totalRutas = state.rutas.length;
      const origenes = new Set(state.rutas.map(r => r.origen)).size;
      const destinos = new Set(state.rutas.map(r => r.destino)).size;
      const precios = state.rutas.map(r => Number(r.precio) || 0);
      const precioMinimo = precios.length > 0 ? Math.min(...precios) : 0;
      const precioMaximo = precios.length > 0 ? Math.max(...precios) : 0;
      const precioPromedio = precios.length > 0 ? Math.round((precios.reduce((a, b) => a + b, 0) / precios.length) * 100) / 100 : 0;
      const freq = {};
      state.rutas.forEach(r => { freq[r.destino] = (freq[r.destino] || 0) + 1; });
      const destinosPopulares = Object.keys(freq).map(d => ({ destino: d, frecuencia: freq[d] }));

      const turnos = { Mañana: 0, Tarde: 0, Noche: 0 };
      state.rutas.forEach(r => {
        const h = (r.horario || '').toLowerCase();
        if (h.includes('06:') || h.includes('07:') || h.includes('08:') || h.includes('09:') || h.includes('10:') || h.includes('11:') || h.includes('am')) {
          turnos.Mañana++;
        } else if (h.includes('12:') || h.includes('13:') || h.includes('14:') || h.includes('15:') || h.includes('16:') || h.includes('17:')) {
          turnos.Tarde++;
        } else {
          turnos.Noche++;
        }
      });

      return sendJson(200, {
        exito: true,
        mensaje: 'Estadísticas analíticas de rutas calculadas',
        datos: {
          totalRutas,
          totalOrigenes: origenes,
          totalDestinos: destinos,
          precioPromedio,
          precioMinimo,
          precioMaximo,
          destinosPopulares,
          distribucionTurnos: turnos
        }
      });
    }

    // 10.4 Buscar rutas
    if (pathname === '/api/rutas/buscar' && req.method === 'GET') {
      const orig = (query.origen || '').toLowerCase().trim();
      const dest = (query.destino || '').toLowerCase().trim();
      const maxP = query.maxPrecio ? Number(query.maxPrecio) : null;
      let resRutas = state.rutas.filter(r => {
        if (orig && !r.origen.toLowerCase().includes(orig)) return false;
        if (dest && !r.destino.toLowerCase().includes(dest)) return false;
        if (maxP !== null && r.precio > maxP) return false;
        return true;
      });
      return sendJson(200, { exito: true, mensaje: 'Búsqueda completada', datos: resRutas });
    }

    // 10.5 Obtener una ruta por ID
    const matchRutaId = pathname.match(/^\/api\/rutas\/(\d+)$/);
    if (matchRutaId && req.method === 'GET') {
      const id = Number(matchRutaId[1]);
      const ruta = state.rutas.find(r => r.id === id);
      if (!ruta) return sendJson(404, { exito: false, mensaje: `Ruta no encontrada con id: ${id}` });
      return sendJson(200, { exito: true, mensaje: 'Ruta encontrada', datos: ruta });
    }

    // 10.6 CREAR NUEVA RUTA (POST /api/rutas)
    if (pathname === '/api/rutas' && req.method === 'POST') {
      const origen = body.origen ? String(body.origen).trim() : '';
      const destino = body.destino ? String(body.destino).trim() : '';
      const horario = body.horario ? String(body.horario).trim() : '';
      const precio = Number(body.precio);

      if (!origen) return sendJson(400, { exito: false, mensaje: 'La ciudad de origen es obligatoria.' });
      if (!destino) return sendJson(400, { exito: false, mensaje: 'La ciudad de destino es obligatoria.' });
      if (origen.toLowerCase() === destino.toLowerCase()) {
        return sendJson(400, { exito: false, mensaje: 'Regla de negocio infringida: La ciudad de origen no puede ser idéntica a la ciudad de destino.' });
      }
      if (!horario) return sendJson(400, { exito: false, mensaje: 'El horario de salida es obligatorio.' });
      if (isNaN(precio) || precio <= 0) {
        return sendJson(400, { exito: false, mensaje: 'Regla de negocio: La tarifa de pasaje debe ser mayor a S/. 0.00.' });
      }

      // Validar duplicado
      const existeDuplicada = state.rutas.some(r =>
        r.origen.toLowerCase() === origen.toLowerCase() &&
        r.destino.toLowerCase() === destino.toLowerCase() &&
        r.horario.toLowerCase() === horario.toLowerCase()
      );
      if (existeDuplicada) {
        return sendJson(409, { exito: false, mensaje: `Conflicto: Ya existe una ruta programada para ${origen} -> ${destino} a las ${horario}` });
      }

      const maxId = state.rutas.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
      const nuevoId = maxId + 1;
      const nuevaRuta = { id: nuevoId, origen, destino, horario, precio };
      state.rutas.push(nuevaRuta);

      if (!state.historialAuditoriaRutas) state.historialAuditoriaRutas = [];
      state.historialAuditoriaRutas.unshift({
        id: Date.now(),
        rutaId: nuevoId,
        tipoOperacion: 'CREACION',
        origen,
        destino,
        horario,
        precio,
        detallesNuevos: `Ruta creada: ${origen} -> ${destino} a S/.${precio.toFixed(2)} (${horario})`,
        fechaOperacion: new Date().toISOString()
      });

      persistState();
      console.log(`[Rutas] Nueva ruta registrada con éxito: #${nuevoId} ${origen} -> ${destino} (${horario}) S/.${precio}`);
      return sendJson(201, { exito: true, mensaje: 'Ruta registrada con éxito', datos: nuevaRuta });
    }

    // 10.7 ACTUALIZAR RUTA (PUT /api/rutas/:id)
    if (matchRutaId && req.method === 'PUT') {
      const id = Number(matchRutaId[1]);
      const idx = state.rutas.findIndex(r => r.id === id);
      if (idx === -1) {
        return sendJson(404, { exito: false, mensaje: `Ruta no encontrada con id: ${id}` });
      }
      const actual = state.rutas[idx];
      const detallesAnteriores = `Origen: ${actual.origen}, Destino: ${actual.destino}, Horario: ${actual.horario}, Precio: S/.${actual.precio}`;

      const nuevoOrigen = body.origen ? String(body.origen).trim() : actual.origen;
      const nuevoDestino = body.destino ? String(body.destino).trim() : actual.destino;
      const nuevoHorario = body.horario ? String(body.horario).trim() : actual.horario;
      const nuevoPrecio = body.precio !== undefined ? Number(body.precio) : actual.precio;

      if (nuevoOrigen.toLowerCase() === nuevoDestino.toLowerCase()) {
        return sendJson(400, { exito: false, mensaje: 'La ciudad de origen no puede ser idéntica a la ciudad de destino.' });
      }

      state.rutas[idx] = { id, origen: nuevoOrigen, destino: nuevoDestino, horario: nuevoHorario, precio: nuevoPrecio };

      if (!state.historialAuditoriaRutas) state.historialAuditoriaRutas = [];
      state.historialAuditoriaRutas.unshift({
        id: Date.now(),
        rutaId: id,
        tipoOperacion: 'MODIFICACION',
        origen: nuevoOrigen,
        destino: nuevoDestino,
        horario: nuevoHorario,
        precio: nuevoPrecio,
        detallesAnteriores,
        detallesNuevos: `Modificado: ${nuevoOrigen} -> ${nuevoDestino} a S/.${nuevoPrecio.toFixed(2)} (${nuevoHorario})`,
        fechaOperacion: new Date().toISOString()
      });

      persistState();
      return sendJson(200, { exito: true, mensaje: 'Ruta actualizada correctamente', datos: state.rutas[idx] });
    }

    // 10.8 ELIMINAR RUTA (DELETE /api/rutas/:id)
    if (matchRutaId && req.method === 'DELETE') {
      const id = Number(matchRutaId[1]);
      const idx = state.rutas.findIndex(r => r.id === id);
      if (idx === -1) {
        return sendJson(404, { exito: false, mensaje: `Ruta no encontrada con id: ${id}` });
      }
      const eliminada = state.rutas.splice(idx, 1)[0];

      if (!state.historialAuditoriaRutas) state.historialAuditoriaRutas = [];
      state.historialAuditoriaRutas.unshift({
        id: Date.now(),
        rutaId: id,
        tipoOperacion: 'ELIMINACION',
        origen: eliminada.origen,
        destino: eliminada.destino,
        horario: eliminada.horario,
        precio: eliminada.precio,
        detallesAnteriores: `Eliminada: ${eliminada.origen} -> ${eliminada.destino}`,
        fechaOperacion: new Date().toISOString()
      });

      persistState();
      return sendJson(200, { exito: true, mensaje: 'Ruta eliminada correctamente' });
    }

    // 11. BUSES FLOTA
    if (pathname === '/api/buses' && req.method === 'GET') {
      return sendJson(200, {
        exito: true,
        mensaje: 'Buses obtenidos correctamente',
        datos: state.buses
      });
    }

    if (pathname === '/api/buses/estadisticas' && req.method === 'GET') {
      const total = state.buses.length;
      const operativos = state.buses.filter(b => b.estado === 'OPERATIVO').length;
      const enMantenimiento = state.buses.filter(b => b.estado === 'MANTENIMIENTO').length;
      const capacidadTotal = state.buses.reduce((a, b) => a + (b.capacidad || 0), 0);
      const asientosDisp = state.buses.reduce((a, b) => a + (b.asientosDisponibles || 0), 0);
      return sendJson(200, {
        exito: true,
        mensaje: 'Estadísticas de flota calculadas',
        datos: { totalBuses: total, busesOperativos: operativos, busesEnMantenimiento: enMantenimiento, capacidadTotal, asientosDisponiblesTotal: asientosDisp }
      });
    }

    // 11.1 Mantenimientos de buses
    if (pathname === '/api/buses/mantenimientos' && req.method === 'GET') {
      return sendJson(200, { exito: true, mensaje: 'Mantenimientos obtenidos', datos: state.mantenimientos || [] });
    }

    if (pathname === '/api/buses/mantenimientos/resumen' && req.method === 'GET') {
      const mants = state.mantenimientos || [];
      const programados = mants.filter(m => m.estado === 'PROGRAMADO').length;
      const enTaller = mants.filter(m => m.estado === 'EN_MANTENIMIENTO').length;
      const finalizados = mants.filter(m => m.estado === 'FINALIZADO').length;
      return sendJson(200, { exito: true, datos: { programados, enMantenimiento: enTaller, finalizados, total: mants.length } });
    }

    if (pathname === '/api/buses/mantenimientos/proximos' && req.method === 'GET') {
      const mants = (state.mantenimientos || []).filter(m => m.estado === 'PROGRAMADO' || m.estado === 'EN_MANTENIMIENTO');
      return sendJson(200, { exito: true, datos: mants });
    }

    const matchMantBus = pathname.match(/^\/api\/buses\/mantenimientos\/bus\/(\d+)$/);
    if (matchMantBus && req.method === 'GET') {
      const bId = Number(matchMantBus[1]);
      const mants = (state.mantenimientos || []).filter(m => m.busId === bId);
      return sendJson(200, { exito: true, datos: mants });
    }

    if (pathname === '/api/buses/mantenimientos' && req.method === 'POST') {
      const mId = (state.mantenimientos || []).reduce((m, item) => Math.max(m, item.id || 0), 0) + 1;
      const bus = state.buses.find(b => b.id === Number(body.busId));
      const nuevoM = {
        id: mId,
        busId: Number(body.busId),
        busPlaca: bus ? bus.placa : 'BUS-' + body.busId,
        busModelo: bus ? bus.modelo : 'Estándar',
        tipoMantenimiento: body.tipoMantenimiento || body.tipo || 'PREVENTIVO',
        estado: body.estado || 'PROGRAMADO',
        descripcion: body.descripcion || '',
        tallerAsignado: body.tallerAsignado || body.taller || 'Taller Central TransSync',
        taller: body.tallerAsignado || body.taller || 'Taller Central TransSync',
        costoEstimado: Number(body.costoEstimado || body.costo || 500),
        costo: Number(body.costoEstimado || body.costo || 500),
        fechaProgramada: body.fechaProgramada || new Date().toISOString().split('T')[0],
        bloqueaOperacion: body.bloqueaOperacion !== undefined ? body.bloqueaOperacion : true
      };
      if (!state.mantenimientos) state.mantenimientos = [];
      state.mantenimientos.unshift(nuevoM);
      persistState();
      return sendJson(201, { exito: true, mensaje: 'Mantenimiento registrado', datos: nuevoM });
    }

    const matchMantIniciar = pathname.match(/^\/api\/buses\/mantenimientos\/(\d+)\/iniciar$/);
    if (matchMantIniciar && req.method === 'PUT') {
      const id = Number(matchMantIniciar[1]);
      const m = (state.mantenimientos || []).find(item => item.id === id);
      if (m) {
        m.estado = 'EN_MANTENIMIENTO';
        m.fechaInicio = new Date().toISOString().split('T')[0];
        const b = state.buses.find(bus => bus.id === m.busId);
        if (b) b.estado = 'MANTENIMIENTO';
        persistState();
        return sendJson(200, { exito: true, mensaje: 'Mantenimiento iniciado', datos: m });
      }
      return sendJson(404, { exito: false, mensaje: 'Mantenimiento no encontrado' });
    }

    const matchMantFinalizar = pathname.match(/^\/api\/buses\/mantenimientos\/(\d+)\/finalizar$/);
    if (matchMantFinalizar && req.method === 'PUT') {
      const id = Number(matchMantFinalizar[1]);
      const m = (state.mantenimientos || []).find(item => item.id === id);
      if (m) {
        m.estado = 'FINALIZADO';
        m.fechaFin = new Date().toISOString().split('T')[0];
        if (body.costo) m.costoReal = Number(body.costo);
        if (body.observaciones) m.observacionesFinales = body.observaciones;
        const b = state.buses.find(bus => bus.id === m.busId);
        if (b) b.estado = 'OPERATIVO';
        persistState();
        return sendJson(200, { exito: true, mensaje: 'Mantenimiento finalizado', datos: m });
      }
      return sendJson(404, { exito: false, mensaje: 'Mantenimiento no encontrado' });
    }

    const matchMantCancelar = pathname.match(/^\/api\/buses\/mantenimientos\/(\d+)\/cancelar$/);
    if (matchMantCancelar && req.method === 'PUT') {
      const id = Number(matchMantCancelar[1]);
      const m = (state.mantenimientos || []).find(item => item.id === id);
      if (m) {
        m.estado = 'CANCELADO';
        const b = state.buses.find(bus => bus.id === m.busId);
        if (b) b.estado = 'OPERATIVO';
        persistState();
        return sendJson(200, { exito: true, mensaje: 'Mantenimiento cancelado', datos: m });
      }
      return sendJson(404, { exito: false, mensaje: 'Mantenimiento no encontrado' });
    }

    const matchBusId = pathname.match(/^\/api\/buses\/(\d+)$/);
    if (matchBusId && req.method === 'GET') {
      const id = Number(matchBusId[1]);
      const bus = state.buses.find(b => b.id === id);
      if (!bus) return sendJson(404, { exito: false, mensaje: `Bus no encontrado con id: ${id}` });
      return sendJson(200, { exito: true, mensaje: 'Bus encontrado', datos: bus });
    }

    const matchBusDisp = pathname.match(/^\/api\/buses\/(\d+)\/disponibilidad$/);
    if (matchBusDisp && req.method === 'GET') {
      const id = Number(matchBusDisp[1]);
      const bus = state.buses.find(b => b.id === id);
      if (!bus) return sendJson(404, { exito: false, mensaje: `Bus no encontrado con id: ${id}` });
      const enMant = bus.estado === 'MANTENIMIENTO' || (state.mantenimientos || []).some(m => m.busId === id && m.estado === 'EN_MANTENIMIENTO');
      return sendJson(200, {
        exito: true,
        mensaje: enMant ? 'Bus en taller' : 'Disponible',
        datos: {
          busId: bus.id,
          placa: bus.placa,
          modelo: bus.modelo,
          capacidad: bus.capacidad,
          asientosDisponibles: bus.asientosDisponibles,
          disponible: !enMant && (bus.asientosDisponibles > 0),
          enMantenimiento: enMant
        }
      });
    }

    if (pathname === '/api/buses' && req.method === 'POST') {
      const placa = body.placa ? String(body.placa).toUpperCase().trim() : '';
      const modelo = body.modelo ? String(body.modelo).trim() : 'Estándar';
      const capacidad = Number(body.capacidad) || 48;
      if (!placa) return sendJson(400, { exito: false, mensaje: 'La placa es obligatoria' });
      if (state.buses.some(b => b.placa.toUpperCase() === placa)) {
        return sendJson(409, { exito: false, mensaje: `Ya existe un bus con la placa: ${placa}` });
      }
      const bId = state.buses.reduce((m, b) => Math.max(m, b.id || 0), 0) + 1;
      const nuevoBus = { id: bId, placa, modelo, capacidad, asientosDisponibles: capacidad, estado: 'OPERATIVO' };
      state.buses.push(nuevoBus);
      persistState();
      return sendJson(201, { exito: true, mensaje: 'Bus registrado correctamente', datos: nuevoBus });
    }

    if (matchBusId && req.method === 'PUT') {
      const id = Number(matchBusId[1]);
      const idx = state.buses.findIndex(b => b.id === id);
      if (idx === -1) return sendJson(404, { exito: false, mensaje: 'Bus no encontrado' });
      state.buses[idx] = { ...state.buses[idx], ...body, id };
      persistState();
      return sendJson(200, { exito: true, mensaje: 'Bus actualizado correctamente', datos: state.buses[idx] });
    }

    if (matchBusId && req.method === 'DELETE') {
      const id = Number(matchBusId[1]);
      const idx = state.buses.findIndex(b => b.id === id);
      if (idx === -1) return sendJson(404, { exito: false, mensaje: 'Bus no encontrado' });
      state.buses.splice(idx, 1);
      persistState();
      return sendJson(200, { exito: true, mensaje: 'Bus eliminado correctamente' });
    }

    // Fallback 200 OK
    sendJson(200, { exito: true, mensaje: 'Endpoint atendido por TransSync Backend Gateway' });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TransSync Backend Gateway] Activo y escuchando en http://localhost:${PORT}`);
  console.log(`- Mercado Pago Oficial: Conectado con credencial real`);
  console.log(`- Sincronización multi-navegador en tiempo real habilitada`);
});
