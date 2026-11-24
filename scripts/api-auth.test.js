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
const email = `auth.${suffix}@golfstore.com`;
const username = `auth${suffix}`;
const mobile = uniquePhone('8');
const clave = 'Prueba2026!';

const nuevoUsuario = {
  Apellido_y_Nombre: 'Test, Login API',
  Residencia: 'Calle Testing 456, CABA',
  N_Movil: mobile,
  Email: email,
  Usuario: username,
  Clave: clave,
  Recibe_Publicidad: 1,
};

before(async () => {
  ({ server, baseUrl } = await startServer());
});

after(async () => {
  await tryDelete(baseUrl, userId ? `/api/usuarios/${userId}` : null);
  await stopServer(server);
});

test('POST /api/auth/login rechaza credenciales inexistentes', async () => {
  const res = await api(baseUrl, 'POST', '/api/auth/login', {
    email: `nadie.${suffix}@golfstore.com`,
    clave,
  });

  assert.equal(res.status, 401);
  assert.equal(typeof res.data.error, 'string');
});

test('POST /api/auth/login valida el formato del email', async () => {
  const res = await api(baseUrl, 'POST', '/api/auth/login', {
    email: 'no-es-un-email',
    clave,
  });

  assert.equal(res.status, 400);
});

test('el usuario registrado inicia sesión y recibe el rol cliente', async () => {
  const creado = await api(baseUrl, 'POST', '/api/usuarios', nuevoUsuario);
  assert.equal(creado.status, 201);

  userId = creado.data.data.idUsuario;
  assert.ok(userId);

  const res = await api(baseUrl, 'POST', '/api/auth/login', { email, clave });

  assert.equal(res.status, 200);
  assert.equal(res.data.data.id, userId);
  assert.equal(res.data.data.email, email);
  assert.equal(res.data.data.rol, 'cliente');
  assert.equal(Object.prototype.hasOwnProperty.call(res.data.data, 'Clave'), false);
});

test('POST /api/auth/login rechaza una contraseña incorrecta', async () => {
  const res = await api(baseUrl, 'POST', '/api/auth/login', {
    email,
    clave: 'ClaveIncorrecta2026',
  });

  assert.equal(res.status, 401);
});

test('POST /api/usuarios con email repetido responde 409 con mensaje claro', async () => {
  const res = await api(baseUrl, 'POST', '/api/usuarios', {
    ...nuevoUsuario,
    Usuario: `otro${suffix}`,
    N_Movil: uniquePhone('7'),
  });

  assert.equal(res.status, 409);
  assert.match(res.data.error, /email/i);
});

test('POST /api/auth/login rechaza una cuenta desactivada', async () => {
  const baja = await api(baseUrl, 'PATCH', `/api/usuarios/${userId}`, { Activo: 0 });
  assert.equal(baja.status, 200);

  const res = await api(baseUrl, 'POST', '/api/auth/login', { email, clave });

  assert.equal(res.status, 403);
});
