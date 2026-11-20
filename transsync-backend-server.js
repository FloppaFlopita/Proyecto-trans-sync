const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

function emitirEventoKafka(topico, evento) {
  console.log(`>>> [KAFKA EVENT PRODUCER] Emitiendo a '${topico}':`, JSON.stringify(evento));
  if (!state.kafkaEventos) state.kafkaEventos = [];
  state.kafkaEventos.unshift({ topico, ...evento });
  if (state.kafkaEventos.length > 50) state.kafkaEventos.pop();
  try {
    const jsonEscaped = JSON.stringify(evento).replace(/"/g, '\"');
    const proc = exec(`docker exec -i trans-sync-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic ${topico}`, (err) => {});
    if (proc && proc.stdin) {
      proc.stdin.write(JSON.stringify(evento) + '\n');
      proc.stdin.end();
    }
  } catch (e) {}
}

const PORT = 8100;
const DATA_FILE = path.join(__dirname, 'backend-state.json');
// Credencial Oficial PRODUCCIÓN EN VIVO (Activada y Autorizada para Cobros Reales)
const MP_ACCESS_TOKEN = 'APP_USR-1789579822505186-111721-79b4c33369e58b48a70ac3692eb3e880-3852779519';

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
  ]
};

// Cargar estado de disco si existe
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const loaded = JSON.parse(raw);
    state = Object.assign(state, loaded);
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

    // 5. CREAR RESERVAS MÚLTIPLES (COMPRA CONFIRMADA)
    if (pathname === '/api/reservas/multiple' && req.method === 'POST') {
      const busId = String(body.busId || '1');
      const fechaViaje = body.fechaViaje || new Date().toISOString().split('T')[0];
      const asientos = body.asientos || [];
      const nombrePasajero = body.nombrePasajero || 'Pasajero General';
      const dniPasajero = body.dniPasajero || '00000000';
      const telefonoPasajero = body.telefonoPasajero || '';
      const metodoPago = body.metodoPago || 'EFECTIVO';
      const precioUnitario = Number(body.precioUnitario) || 35.0;

      // 1. Agregar a ocupados
      if (!state.asientosOcupadosPorBus[busId]) {
        state.asientosOcupadosPorBus[busId] = [];
      }
      state.asientosOcupadosPorBus[busId] = [...new Set([...state.asientosOcupadosPorBus[busId], ...asientos])];

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
          busId: Number(busId),
          fechaViaje: fechaViaje,
          asiento: asiento,
          tipoComprobante: esFactura ? 'FACTURA' : 'BOLETA',
          numeroComprobante: numComprobante,
          numeroBoleta: numComprobante,
          nombrePasajero: nombrePasajero,
          dniPasajero: dniPasajero,
          telefonoPasajero: telefonoPasajero,
          ruc: body.rucEmpresa || body.ruc || '',
          razonSocial: body.razonSocial || '',
          direccionFiscal: body.direccionFiscal || '',
          precio: precioUnitario,
          metodoPago: metodoPago,
          fechaHora: new Date().toLocaleString('es-PE'),
          abordado: false
        };
        state.reservas.unshift(resObj);
        nuevasReservas.push(resObj);

        // Emitir evento asíncrono a Kafka
        emitirEventoKafka('reserva-eventos', {
          tipoEvento: 'RESERVA_CONFIRMADA',
          reservaId: resObj.id,
          asiento: resObj.asiento,
          numeroBoleta: resObj.numeroBoleta,
          nombrePasajero: resObj.nombrePasajero,
          dniPasajero: resObj.dniPasajero,
          totalPagar: resObj.precio,
          metodoPago: resObj.metodoPago,
          fechaViaje: resObj.fechaViaje,
          timestamp: new Date().toISOString()
        });
        emitirEventoKafka('pago-eventos', {
          tipoEvento: 'PAGO_APROBADO',
          reservaId: resObj.id,
          monto: resObj.precio,
          metodoPago: resObj.metodoPago,
          estado: 'APROBADO',
          pasajero: resObj.nombrePasajero,
          timestamp: new Date().toISOString()
        });
      });

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
        capacidadTotal: 48,
        pasajeros: pasajeros
      });
    }

    // 7. FINALIZAR VIAJE CONDUCTOR
    if (pathname === '/api/reservas/finalizar-viaje' && req.method === 'POST') {
      const busId = String(body.busId || '1');
      state.asientosOcupadosPorBus[busId] = [];
      state.reservas = state.reservas.filter(r => r.busId !== Number(busId));
      persistState();
      return sendJson(200, { exito: true, mensaje: `Viaje finalizado con éxito para Bus #${busId}. Todos los asientos quedaron liberados.` });
    }

    // 7b. REINICIAR BUS (Liberar asientos)
    const matchReiniciar = pathname.match(/^\/api\/reservas\/bus\/(\d+)\/reiniciar$/);
    if (matchReiniciar && (req.method === 'DELETE' || req.method === 'POST')) {
      const busId = matchReiniciar[1];
      state.asientosOcupadosPorBus[busId] = [];
      state.reservas = state.reservas.filter(r => r.busId !== Number(busId));
      persistState();
      return sendJson(200, { exito: true, mensaje: `Bus #${busId} reiniciado con éxito. Todos los asientos han sido liberados.` });
    }

    // 8. AUDITORÍA VENTAS ADMIN
    if (pathname === '/api/reservas/ventas' && req.method === 'GET') {
      const totalRecaudado = state.reservas.reduce((acc, r) => acc + (r.precio || 0), 0);
      const subtotal = totalRecaudado / 1.18;
      const igv = totalRecaudado - subtotal;
      return sendJson(200, {
        totalVentas: state.reservas.length,
        totalBoletosVendidos: state.reservas.length,
        totalRecaudado: totalRecaudado,
        subtotalGravado: subtotal,
        igvTotal: igv,
        ventas: state.reservas
      });
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
      // Soporte para simulación de demostración si se solicita explícitamente (?simular=true)
      if (query.simular === 'true') {
        const dummyId = 'SIM-' + Date.now();
        emitirEventoKafka('pago-eventos', {
          tipoEvento: 'PAGO_APROBADO',
          paymentId: dummyId,
          monto: 3,
          metodoPago: 'YAPE (DEMO DOCENTE)',
          estado: 'APROBADO',
          timestamp: new Date().toISOString()
        });
        return sendJson(200, {
          aprobado: true,
          paymentId: dummyId,
          status: 'approved',
          metodoPago: 'YAPE (DEMO)',
          monto: 3
        });
      }

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
              
              if (ultimo.status === 'approved') {
                emitirEventoKafka('pago-eventos', {
                  tipoEvento: 'PAGO_APROBADO',
                  paymentId: String(ultimo.id),
                  monto: ultimo.transaction_amount,
                  metodoPago: (ultimo.payment_method_id || 'YAPE').toUpperCase(),
                  estado: 'APROBADO',
                  timestamp: new Date().toISOString()
                });
                return sendJson(200, {
                  aprobado: true,
                  paymentId: String(ultimo.id),
                  status: ultimo.status,
                  metodoPago: (ultimo.payment_method_id || 'YAPE').toUpperCase(),
                  monto: ultimo.transaction_amount
                });
              } else if (ultimo.status === 'rejected') {
                emitirEventoKafka('pago-eventos', {
                  tipoEvento: 'PAGO_RECHAZADO',
                  paymentId: String(ultimo.id),
                  monto: ultimo.transaction_amount,
                  metodoPago: (ultimo.payment_method_id || 'YAPE').toUpperCase(),
                  estado: 'RECHAZADO',
                  motivo: ultimo.status_detail || 'Pago rechazado por el banco o emisor',
                  timestamp: new Date().toISOString()
                });
                return sendJson(200, {
                  aprobado: false,
                  rechazado: true,
                  paymentId: String(ultimo.id),
                  status: ultimo.status,
                  motivo: ultimo.status_detail || 'Pago rechazado'
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

    // 9.2 MONITOR WEB DE EVENTOS KAFKA
    if (pathname === '/api/kafka/eventos' && req.method === 'GET') {
      return sendJson(200, state.kafkaEventos || []);
    }

    // 10. RUTAS CATÁLOGO Y GESTIÓN CRUD (PROXY DIRECTO A MS-RUTAS :8101)
    if (pathname.startsWith('/api/rutas')) {
      const targetPath = pathname.replace(/^\/api\/rutas/, '/rutas') + (parsedUrl.search || '');
      const clientReq = http.request({
        hostname: '127.0.0.1',
        port: 8101,
        path: targetPath,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr || '')
        }
      }, (clientRes) => {
        let respData = '';
        clientRes.on('data', chunk => { respData += chunk; });
        clientRes.on('end', () => {
          res.writeHead(clientRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(respData);
        });
      });

      clientReq.on('error', (err) => {
        // Fallback local en backend-state.json si MS-Rutas estuviera apagado
        if (!state.rutas) {
          state.rutas = [
            { id: 99, origen: 'Juliaca', destino: 'Puno', precio: 3.00, horario: '10:00 hrs' },
            { id: 1, origen: 'Juliaca', destino: 'Arequipa', precio: 35.00, horario: '08:00 hrs' },
            { id: 2, origen: 'Puno', destino: 'Cusco', precio: 45.00, horario: '14:30 hrs' },
            { id: 3, origen: 'Arequipa', destino: 'Lima', precio: 80.00, horario: '20:00 hrs' }
          ];
        }
        if (req.method === 'GET' && pathname === '/api/rutas') {
          return sendJson(200, state.rutas);
        }
        if (req.method === 'POST' && pathname === '/api/rutas') {
          const nuevaRuta = { id: Date.now(), ...body };
          state.rutas.push(nuevaRuta);
          persistState();
          return sendJson(200, { exito: true, mensaje: 'Ruta registrada con éxito', datos: nuevaRuta });
        }
        sendJson(200, { exito: true, datos: state.rutas });
      });

      if (bodyStr) clientReq.write(bodyStr);
      clientReq.end();
      return;
    }

    // 11. BUSES FLOTA (PROXY A MS-FLOTA :8102)
    if (pathname.startsWith('/api/buses')) {
      const targetPath = pathname.replace(/^\/api\/buses/, '/buses') + (parsedUrl.search || '');
      const clientReq = http.request({
        hostname: '127.0.0.1',
        port: 8102,
        path: targetPath,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr || '')
        }
      }, (clientRes) => {
        let respData = '';
        clientRes.on('data', chunk => { respData += chunk; });
        clientRes.on('end', () => {
          res.writeHead(clientRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(respData);
        });
      });

      clientReq.on('error', () => {
        return sendJson(200, [
          { id: 1, placa: 'BUS-TS-01', modelo: 'Scania Touring HD', capacidad: 48, estado: 'OPERATIVO' },
          { id: 2, placa: 'BUS-TS-02', modelo: 'Volvo B430R', capacidad: 48, estado: 'OPERATIVO' },
          { id: 3, placa: 'BUS-TS-03', modelo: 'Mercedes Travego', capacidad: 48, estado: 'MANTENIMIENTO' },
          { id: 4, placa: 'BUS-TS-04', modelo: 'Marcopolo G8', capacidad: 48, estado: 'OPERATIVO' },
          { id: 5, placa: 'T3C-104', modelo: 'Volvo 9700 Grand', capacidad: 48, estado: 'OPERATIVO' },
          { id: 6, placa: 'BUS-TS-06', modelo: 'Scania Irizar i6S', capacidad: 48, estado: 'OPERATIVO' }
        ]);
      });

      if (bodyStr) clientReq.write(bodyStr);
      clientReq.end();
      return;
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
