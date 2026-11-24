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

const suffix = uniqueSuffix();
const email = `api.user.${suffix}@golfstore.com`;
const username = `apiuser${suffix}`;
const mobile = uniquePhone('9');

const newUser = {
  Apellido_y_Nombre: 'Test, Usuario API',
  Residencia: 'Calle Testing 123, CABA',
  N_Movil: mobile,
  Email: email,
  Usuario: username,
  Clave: 'Prueba2026!',
  Recibe_Publicidad: 1,
};

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(async () => {
  await tryDelete(baseUrl, userId ? `/api/usuarios/${userId}` : null);
  await stopServer(server);
});

test('GET /api/usuarios devuelve listado paginado', async () => {
  const res = await api(baseUrl, 'GET', '/api/usuarios?limit=2');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data));
  assert.equal(typeof res.data.meta.total, 'number');
  assert.equal(res.data.meta.page, 1);
  assert.equal(res.data.meta.limit, 2);
});

test('POST /api/usuarios crea el usuario y no expone Clave', async () => {
  const res = await api(baseUrl, 'POST', '/api/usuarios', newUser);

  assert.equal(res.status, 201);
  assert.equal(res.data.data.Email, email);
  assert.equal(res.data.data.Usuario, username);
  assert.equal(res.data.data.Activo, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(res.data.data, 'Clave'), false);

  userId = res.data.data.idUsuario;
  assert.ok(userId);
});

test('GET /api/usuarios/:id obtiene el usuario creado', async () => {
  const res = await api(baseUrl, 'GET', `/api/usuarios/${userId}`);

  assert.equal(res.status, 200);
  assert.equal(res.data.data.idUsuario, userId);
  assert.equal(res.data.data.Usuario, username);
});

test('PATCH /api/usuarios/:id actualiza campos parciales', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/usuarios/${userId}`, {
    Activo: 0,
    Recibe_Publicidad: 0,
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Activo, 0);
  assert.equal(res.data.data.Recibe_Publicidad, 0);
  assert.equal(res.data.data.Usuario, username);
});

test('PUT /api/usuarios/:id actualiza la residencia', async () => {
  const res = await api(baseUrl, 'PUT', `/api/usuarios/${userId}`, {
    Residencia: 'Av. Testing 999, CABA',
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Residencia, 'Av. Testing 999, CABA');
  assert.equal(res.data.data.Usuario, username);
});

test('GET /api/usuarios?q= encuentra el usuario creado', async () => {
  const res = await api(baseUrl, 'GET', `/api/usuarios?q=${encodeURIComponent(username)}`);

  assert.equal(res.status, 200);
  assert.ok(res.data.data.some((item) => item.idUsuario === userId));
});

test('POST /api/usuarios rechaza un email duplicado con 409', async () => {
  const res = await api(baseUrl, 'POST', '/api/usuarios', newUser);

  assert.equal(res.status, 409);
  assert.match(res.data.error, /existe|único/i);
});

test('POST /api/usuarios rechaza datos incompletos con 400', async () => {
  const res = await api(baseUrl, 'POST', '/api/usuarios', {
    Email: 'incompleto@example.com',
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /obligatorios/i);
});

test('GET /api/usuarios/:id inexistente devuelve 404', async () => {
  const res = await api(baseUrl, 'GET', '/api/usuarios/999999999');

  assert.equal(res.status, 404);
});

test('DELETE /api/usuarios/:id elimina y luego devuelve 404', async () => {
  const idToDelete = userId;
  const del = await api(baseUrl, 'DELETE', `/api/usuarios/${idToDelete}`);

  assert.equal(del.status, 204);
  userId = null;

  const get = await api(baseUrl, 'GET', `/api/usuarios/${idToDelete}`);
  assert.equal(get.status, 404);
});
