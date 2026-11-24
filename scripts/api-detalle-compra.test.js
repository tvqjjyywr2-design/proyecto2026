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
let productId = null;
let tempUserId = null;
let tempProductId = null;
let purchaseId = null;
let detailId = null;

async function ensureUser() {
  const list = await api(baseUrl, 'GET', '/api/usuarios?limit=1&activo=1');
  assert.equal(list.status, 200);

  if (list.data.data.length) {
    return list.data.data[0].idUsuario;
  }

  const suffix = uniqueSuffix();
  const created = await api(baseUrl, 'POST', '/api/usuarios', {
    Apellido_y_Nombre: 'Test, Usuario Detalle',
    Residencia: 'Calle Testing 789, CABA',
    N_Movil: uniquePhone('9'),
    Email: `api.detalle.${suffix}@golfstore.com`,
    Usuario: `apidetalle${suffix}`,
    Clave: 'Prueba2026!',
  });

  assert.equal(created.status, 201);
  tempUserId = created.data.data.idUsuario;
  return tempUserId;
}

async function ensureProduct() {
  const list = await api(baseUrl, 'GET', '/api/productos?limit=1');
  assert.equal(list.status, 200);

  if (list.data.data.length) {
    return list.data.data[0].idProductos;
  }

  const suffix = uniqueSuffix();
  const created = await api(baseUrl, 'POST', '/api/productos', {
    Nombre_Corto: `Test API detalle ${suffix}`,
    Precio: 100,
    Porcentaje_Oferta: 0,
    Stock: 20,
    Marca: 'TestBrand',
    Tallas: 'S,M,L',
    Tipo: 'Adulto Masculino',
  });

  assert.equal(created.status, 201);
  tempProductId = created.data.data.idProductos;
  return tempProductId;
}

before(async () => {
  ({ server, baseUrl } = await startServer());
  userId = await ensureUser();
  productId = await ensureProduct();

  const purchase = await api(baseUrl, 'POST', '/api/proceso-compra', {
    idUsuario: userId,
    Tipo: 'En proceso',
    Importe: 0,
  });

  assert.equal(purchase.status, 201);
  purchaseId = purchase.data.data.idTransaccion;
});

after(async () => {
  await tryDelete(baseUrl, detailId ? `/api/detalle-compra/${detailId}` : null);
  await tryDelete(baseUrl, purchaseId ? `/api/proceso-compra/${purchaseId}` : null);
  await tryDelete(baseUrl, tempProductId ? `/api/productos/${tempProductId}` : null);
  await tryDelete(baseUrl, tempUserId ? `/api/usuarios/${tempUserId}` : null);
  await stopServer(server);
});

test('GET /api/detalle-compra devuelve listado paginado', async () => {
  const res = await api(baseUrl, 'GET', '/api/detalle-compra?limit=2');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data));
  assert.equal(typeof res.data.meta.total, 'number');
});

test('POST /api/detalle-compra crea la línea y calcula Subtotal', async () => {
  const res = await api(baseUrl, 'POST', '/api/detalle-compra', {
    idTransaccion: purchaseId,
    idProductos: productId,
    Cantidad: 2,
    Precio_Unitario: 100,
  });

  assert.equal(res.status, 201);
  assert.equal(res.data.data.idTransaccion, purchaseId);
  assert.equal(res.data.data.idProductos, productId);
  assert.equal(res.data.data.Cantidad, 2);
  assert.equal(Number(res.data.data.Precio_Unitario), 100);
  assert.equal(Number(res.data.data.Subtotal), 200);

  detailId = res.data.data.idDetalle;
  assert.ok(detailId);
});

test('GET /api/detalle-compra/:id obtiene la línea creada', async () => {
  const res = await api(baseUrl, 'GET', `/api/detalle-compra/${detailId}`);

  assert.equal(res.status, 200);
  assert.equal(res.data.data.idDetalle, detailId);
  assert.equal(Number(res.data.data.Subtotal), 200);
});

test('GET /api/detalle-compra filtra por idTransaccion', async () => {
  const res = await api(
    baseUrl,
    'GET',
    `/api/detalle-compra?idTransaccion=${purchaseId}&limit=100`
  );

  assert.equal(res.status, 200);
  assert.ok(res.data.data.some((item) => item.idDetalle === detailId));
});

test('PATCH /api/detalle-compra/:id recalcula el Subtotal', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/detalle-compra/${detailId}`, {
    Cantidad: 3,
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Cantidad, 3);
  assert.equal(Number(res.data.data.Subtotal), 300);
});

test('PUT /api/detalle-compra/:id actualiza el precio y recalcula el Subtotal', async () => {
  const res = await api(baseUrl, 'PUT', `/api/detalle-compra/${detailId}`, {
    Precio_Unitario: 150,
  });

  assert.equal(res.status, 200);
  assert.equal(Number(res.data.data.Precio_Unitario), 150);
  assert.equal(Number(res.data.data.Subtotal), 450);
});

test('PATCH /api/detalle-compra/:id rechaza Cantidad = 0 con 400', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/detalle-compra/${detailId}`, {
    Cantidad: 0,
  });

  assert.equal(res.status, 400);
});

test('POST /api/detalle-compra rechaza una transacción inexistente con 409', async () => {
  const res = await api(baseUrl, 'POST', '/api/detalle-compra', {
    idTransaccion: 999999999,
    idProductos: productId,
    Cantidad: 1,
    Precio_Unitario: 10,
  });

  assert.equal(res.status, 409);
});

test('GET /api/detalle-compra/:id inexistente devuelve 404', async () => {
  const res = await api(baseUrl, 'GET', '/api/detalle-compra/999999999');

  assert.equal(res.status, 404);
});

test('DELETE /api/detalle-compra/:id elimina y luego devuelve 404', async () => {
  const idToDelete = detailId;
  const del = await api(baseUrl, 'DELETE', `/api/detalle-compra/${idToDelete}`);

  assert.equal(del.status, 204);
  detailId = null;

  const get = await api(baseUrl, 'GET', `/api/detalle-compra/${idToDelete}`);
  assert.equal(get.status, 404);
});
