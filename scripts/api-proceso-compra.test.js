'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  startServer,
  stopServer,
  api,
  tryDelete,
  uniqueSuffix,
  uniquePhone,
} = require('./test-utils');

let server;
let baseUrl;
let userId = null;
let tempUserId = null;
let purchaseId = null;

async function ensureUser() {
  const list = await api(baseUrl, 'GET', '/api/usuarios?limit=1&activo=1');
  assert.equal(list.status, 200);

  if (list.data.data.length) {
    return list.data.data[0].idUsuario;
  }

  // Fallback: si la base no tuviera usuarios, se crea uno temporal.
  const suffix = uniqueSuffix();
  const created = await api(baseUrl, 'POST', '/api/usuarios', {
    Apellido_y_Nombre: 'Test, Usuario Compra',
    Residencia: 'Calle Testing 456, CABA',
    N_Movil: uniquePhone('9'),
    Email: `api.compra.${suffix}@golfstore.com`,
    Usuario: `apicompra${suffix}`,
    Clave: 'Prueba2026!',
  });

  assert.equal(created.status, 201);
  tempUserId = created.data.data.idUsuario;
  return tempUserId;
}

before(async () => {
  ({ server, baseUrl } = await startServer());
  userId = await ensureUser();
});

after(async () => {
  await tryDelete(baseUrl, purchaseId ? `/api/proceso-compra/${purchaseId}` : null);
  await tryDelete(baseUrl, tempUserId ? `/api/usuarios/${tempUserId}` : null);
  await stopServer(server);
});

test('GET /api/proceso-compra devuelve listado paginado', async () => {
  const res = await api(baseUrl, 'GET', '/api/proceso-compra?limit=2');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data));
  assert.equal(typeof res.data.meta.total, 'number');
});

test('POST /api/proceso-compra crea un carrito en proceso', async () => {
  const res = await api(baseUrl, 'POST', '/api/proceso-compra', {
    idUsuario: userId,
    Tipo: 'En proceso',
    Importe: 100,
  });

  assert.equal(res.status, 201);
  assert.equal(res.data.data.idUsuario, userId);
  assert.equal(res.data.data.Tipo, 'En proceso');
  assert.equal(res.data.data.Entregado, 0);
  assert.equal(res.data.data.Estado_Pago, 'Pendiente');
  assert.equal(Number(res.data.data.Importe), 100);

  purchaseId = res.data.data.idTransaccion;
  assert.ok(purchaseId);
});

test('Regla de negocio: un carrito en proceso no puede marcarse entregado', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/proceso-compra/${purchaseId}`, {
    Entregado: 1,
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /En proceso|Entregado/i);
});

test('Regla de negocio: el descuento no puede superar el importe', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/proceso-compra/${purchaseId}`, {
    Importe: 50,
    Descuento_Aplicado: 100,
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /Descuento_Aplicado|Importe/i);
});

test('PATCH /api/proceso-compra/:id finaliza la compra', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/proceso-compra/${purchaseId}`, {
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'Tarjeta',
    Importe: 100,
    Descuento_Aplicado: 0,
    Fecha_Pago: '2026-11-19 10:00:00',
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Tipo, 'Finalizada');
  assert.equal(res.data.data.Estado_Pago, 'Pagado');
  assert.equal(res.data.data.Metodo_Pago, 'Tarjeta');
  assert.equal(res.data.data.Fecha_Pago, '2026-11-19 10:00:00');
});

test('PUT /api/proceso-compra/:id actualiza el método de pago', async () => {
  const res = await api(baseUrl, 'PUT', `/api/proceso-compra/${purchaseId}`, {
    Metodo_Pago: 'Transferencia',
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Metodo_Pago, 'Transferencia');
  assert.equal(res.data.data.Tipo, 'Finalizada');
});

test('GET /api/proceso-compra filtra por usuario y tipo', async () => {
  const res = await api(
    baseUrl,
    'GET',
    `/api/proceso-compra?idUsuario=${userId}&tipo=Finalizada&limit=100`
  );

  assert.equal(res.status, 200);
  assert.ok(res.data.data.some((item) => item.idTransaccion === purchaseId));
});

test('POST /api/proceso-compra rechaza un idUsuario inexistente con 409', async () => {
  const res = await api(baseUrl, 'POST', '/api/proceso-compra', {
    idUsuario: 999999999,
    Tipo: 'En proceso',
    Importe: 10,
  });

  assert.equal(res.status, 409);
});

test('GET /api/proceso-compra/:id inexistente devuelve 404', async () => {
  const res = await api(baseUrl, 'GET', '/api/proceso-compra/999999999');

  assert.equal(res.status, 404);
});

test('DELETE /api/proceso-compra/:id elimina y luego devuelve 404', async () => {
  const idToDelete = purchaseId;
  const del = await api(baseUrl, 'DELETE', `/api/proceso-compra/${idToDelete}`);

  assert.equal(del.status, 204);
  purchaseId = null;

  const get = await api(baseUrl, 'GET', `/api/proceso-compra/${idToDelete}`);
  assert.equal(get.status, 404);
});
