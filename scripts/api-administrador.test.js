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
let adminId = null;

const suffix = uniqueSuffix();
const email = `api.admin.${suffix}@golfstore.com`;
const username = `apiadmin${suffix}`;
const mobile = uniquePhone('8');

const newAdmin = {
  Apellido_y_Nombre: 'Test, Administrador API',
  Email: email,
  N_Movil: mobile,
  Usuario: username,
  Clave: 'Prueba2026!',
  Rol: 'Editor',
};

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(async () => {
  await tryDelete(baseUrl, adminId ? `/api/administradores/${adminId}` : null);
  await stopServer(server);
});

test('GET /api/administradores devuelve listado paginado', async () => {
  const res = await api(baseUrl, 'GET', '/api/administradores?limit=2');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data));
  assert.equal(typeof res.data.meta.total, 'number');
});

test('POST /api/administradores crea el administrador y no expone Clave', async () => {
  const res = await api(baseUrl, 'POST', '/api/administradores', newAdmin);

  assert.equal(res.status, 201);
  assert.equal(res.data.data.Email, email);
  assert.equal(res.data.data.Usuario, username);
  assert.equal(res.data.data.Rol, 'Editor');
  assert.equal(res.data.data.Activo, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(res.data.data, 'Clave'), false);

  adminId = res.data.data.idAdministrador;
  assert.ok(adminId);
});

test('GET /api/administradores/:id obtiene el administrador creado', async () => {
  const res = await api(baseUrl, 'GET', `/api/administradores/${adminId}`);

  assert.equal(res.status, 200);
  assert.equal(res.data.data.idAdministrador, adminId);
  assert.equal(res.data.data.Usuario, username);
});

test('PATCH /api/administradores/:id actualiza Activo y Rol', async () => {
  const res = await api(baseUrl, 'PATCH', `/api/administradores/${adminId}`, {
    Activo: 0,
    Rol: 'Admin',
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Activo, 0);
  assert.equal(res.data.data.Rol, 'Admin');
});

test('PUT /api/administradores/:id actualiza Intentos_Fallidos', async () => {
  const res = await api(baseUrl, 'PUT', `/api/administradores/${adminId}`, {
    Intentos_Fallidos: 4,
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.Intentos_Fallidos, 4);
  assert.equal(res.data.data.Rol, 'Admin');
});

test('GET /api/administradores?q= encuentra el administrador creado', async () => {
  const res = await api(
    baseUrl,
    'GET',
    `/api/administradores?q=${encodeURIComponent(username)}`
  );

  assert.equal(res.status, 200);
  assert.ok(res.data.data.some((item) => item.idAdministrador === adminId));
});

test('POST /api/administradores rechaza un email duplicado con 409', async () => {
  const res = await api(baseUrl, 'POST', '/api/administradores', newAdmin);

  assert.equal(res.status, 409);
});

test('POST /api/administradores rechaza un email inválido con 400', async () => {
  const res = await api(baseUrl, 'POST', '/api/administradores', {
    ...newAdmin,
    Email: 'correo-invalido',
    Usuario: `${username}2`,
    N_Movil: uniquePhone('8'),
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /correo|Email/i);
});

test('POST /api/administradores rechaza datos incompletos con 400', async () => {
  const res = await api(baseUrl, 'POST', '/api/administradores', {
    Email: 'incompleto@example.com',
  });

  assert.equal(res.status, 400);
  assert.match(res.data.error, /obligatorios/i);
});

test('GET /api/administradores/:id inexistente devuelve 404', async () => {
  const res = await api(baseUrl, 'GET', '/api/administradores/999999999');

  assert.equal(res.status, 404);
});

test('DELETE /api/administradores/:id elimina y luego devuelve 404', async () => {
  const idToDelete = adminId;
  const del = await api(baseUrl, 'DELETE', `/api/administradores/${idToDelete}`);

  assert.equal(del.status, 204);
  adminId = null;

  const get = await api(baseUrl, 'GET', `/api/administradores/${idToDelete}`);
  assert.equal(get.status, 404);
});
