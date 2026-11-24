'use strict';

const { app } = require('../index');
const { pool } = require('../src/config/db');

/**
 * Levanta la app Express en un puerto efímero para cada archivo de test.
 */
function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve({ server, baseUrl });
    });
    server.on('error', reject);
  });
}

/**
 * Cierra el servidor HTTP y el pool de MySQL.
 */
async function stopServer(server) {
  await new Promise((resolve) => {
    server.close(resolve);
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
  });
  await pool.end();
}

/**
 * Cliente HTTP mínimo para los tests.
 */
async function api(baseUrl, method, path, body) {
  const hasBody = body !== undefined;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { status: response.status, data, text };
}

/** Borra un recurso ignorando 404/503 (usado en la limpieza). */
async function tryDelete(baseUrl, path) {
  if (!baseUrl || !path) return;
  try {
    await api(baseUrl, 'DELETE', path);
  } catch {
    // La limpieza no debe ocultar el resultado principal de los tests.
  }
}

/** Sufijo alfanumérico único para emails, usuarios y nombres. */
function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Teléfono válido y único para el CHECK de la base. */
function uniquePhone(prefix = '9') {
  const random = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  return `+54 11 ${prefix}${random}`;
}

module.exports = {
  app,
  pool,
  startServer,
  stopServer,
  api,
  tryDelete,
  uniqueSuffix,
  uniquePhone,
};
