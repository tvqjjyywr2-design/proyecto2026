'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  startServer,
  stopServer,
  api,
  tryDelete,
  uniqueSuffix,
} = require('./test-utils');

let server;
let baseUrl;
let productId = null;

const suffix = uniqueSuffix();
const productName = `Test API ${suffix}`;

const newProduct = {
  Nombre_Corto: productName,
  Descripcion: 'Producto temporal creado por el suite de pruebas automatizadas.',
  Precio: 1000,
  Porcentaje_Oferta: 25,
  Stock: 10,
  Marca: 'TestBrand',
  Tallas: 'S,M,L',
  Tipo: 'Adulto Masculino',
};

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(async () => {
  await tryDelete(baseUrl, productId ? `/api/productos/${productId}` : null);
  await stopServer(server);
});

test('GET /api/productos devuelve listado paginado', async () => {
  const res = await api(baseUrl, 'GET', '/api/productos?limit=2');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data));
  assert.equal(typeof res.data.meta.total, 'number');
});

test('POST /api/productos crea el producto y calcula Precio_Final', async () => {
  const res = await api(baseUrl, 'POST', '/api/productos', newProduct);

  assert.equal(res.status, 201);
  assert.equal(res.data.data.Nombre_Corto, productName);
  assert.equal(Number(res.data.data.Precio_Final), 750);
  assert.equal(Number(res.data.data.Precio), 1000);
  assert.equal(Number(res.data.data.Porcentaje_Oferta), 25);

  productId = res.data.data.idProductos;
  assert.ok(productId);
});

test('GET /api/productos/:id obtiene el producto creado', async () => {
  const res = await api(baseUrl, 'GET', `/api/productos/${productId}`);

  assert.equal(res.status, 200);
  assert.equal(res.data.data.idProductos, productId);
  assert.equal(Number(res.data.data.Precio_Final), 750);
});

test('PATCH /api/productos/:id actualiza precio y recalcula Precio_Final', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/productos/${productId}`, {
    Precio: 1200,
    Porcentaje_Oferta: 50,
    Stock: 5,
  });

  assert.equal(res.status, 200);
  assert.equal(Number(res.data.data.Precio), 1200);
  assert.equal(Number(res.data.data.Porcentaje_Oferta), 50);
  assert.equal(Number(res.data.data.Precio_Final), 600);
  assert.equal(res.data.data.Stock, 5);
});

test('PUT /api/productos/:id actualiza el stock', async () => {
  const res = await api(baseUrl, 'PUT', `/api/productos/${productId}`, {
    Stock: 7,
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Stock, 7);
  assert.equal(Number(res.data.data.Precio_Final), 600);
});

test('GET /api/productos?q= encuentra el producto creado', async () => {
  const res = await api(
    baseUrl,
    'GET',
    `/api/productos?q=${encodeURIComponent(productName)}`
  );

  assert.equal(res.status, 200);
  assert.ok(res.data.data.some((item) => item.idProductos === productId));
});

test('POST /api/productos rechaza un Tipo inválido con 400', async () => {
  const res = await api(baseUrl, 'POST', '/api/productos', {
    ...newProduct,
    Nombre_Corto: `${productName} inválido`,
    Tipo: 'Tipo inexistente',
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /Tipo/i);
});

test('POST /api/productos rechaza datos incompletos con 400', async () => {
  const res = await api(baseUrl, 'POST', '/api/productos', {
    Nombre_Corto: 'Producto sin datos',
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /obligatorios/i);
});

test('GET /api/productos/:id inexistente devuelve 404', async () => {
  const res = await api(baseUrl, 'GET', '/api/productos/999999999');

  assert.equal(res.status, 404);
});

test('DELETE /api/productos/:id elimina y luego devuelve 404', async () => {
  const idToDelete = productId;
  const del = await api(baseUrl, 'DELETE', `/api/productos/${idToDelete}`);

  assert.equal(del.status, 204);
  productId = null;

  const get = await api(baseUrl, 'GET', `/api/productos/${idToDelete}`);
  assert.equal(get.status, 404);
});
