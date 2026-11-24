'use strict';

require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');

const { testConnection, pool } = require('./src/config/db');
const { notFoundHandler, errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

// ------------------------------ Middlewares ------------------------------
app.disable('x-powered-by');
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin && corsOrigin !== '*'
      ? { origin: corsOrigin.split(',').map((origin) => origin.trim()) }
      : {}
  )
);
app.use(express.json({ limit: '1mb' }));

// -------------------------------- Rutas ----------------------------------
app.get('/', (_req, res) => {
  res.json({
    name: 'API Ecommerce Golf',
    version: '1.0.0',
    docs: '/api',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'API Ecommerce Golf',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      productos: '/api/productos',
      procesoCompra: '/api/proceso-compra',
      detalleCompra: '/api/detalle-compra',
      administradores: '/api/administradores',
      health: '/api/health',
    },
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    const info = await testConnection();
    res.json({
      status: 'ok',
      database: info.database,
      mysql: info.version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'No se pudo conectar con la base de datos.',
      details: error.sqlMessage || error.message,
    });
  }
});

app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/usuarios', require('./src/routes/usuarios.routes'));
app.use('/api/productos', require('./src/routes/productos.routes'));
app.use('/api/proceso-compra', require('./src/routes/procesoCompra.routes'));
app.use('/api/detalle-compra', require('./src/routes/detalleCompra.routes'));
app.use('/api/administradores', require('./src/routes/administrador.routes'));

// ---------------------- 404 y manejo centralizado -------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ------------------------------- Arranque --------------------------------
function start() {
  const port = Number(process.env.PORT) || 3000;

  const server = app.listen(port, () => {
    console.log(`API Ecommerce Golf escuchando en http://localhost:${port}`);
    console.log(`Documentación de rutas: http://localhost:${port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
