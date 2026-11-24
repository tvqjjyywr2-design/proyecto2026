'use strict';

const mysql = require('mysql2/promise');

/**
 * Pool de conexiones a MySQL.
 * Los datos de conexión se leen de variables de entorno (.env).
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_golf',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // Devuelve DATE/DATETIME/TIMESTAMP como texto "YYYY-MM-DD HH:MM:SS"
  // para evitar conversiones de zona horaria inesperadas en el frontend.
  dateStrings: true,
});

/**
 * Ejecuta una consulta parametrizada.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array|object>}
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Ejecuta varias operaciones dentro de una transacción.
 * @param {(connection: import('mysql2/promise').PoolConnection) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function testConnection() {
  const rows = await query('SELECT DATABASE() AS database, VERSION() AS version');
  return rows[0];
}

module.exports = { pool, query, withTransaction, testConnection };
