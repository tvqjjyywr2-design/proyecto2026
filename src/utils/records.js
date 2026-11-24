'use strict';

const { query } = require('../config/db');
const { NotFoundError } = require('./http');

/** Busca una fila por su PK. Devuelve null si no existe. */
async function findById(table, idColumn, id, select = '*') {
  const rows = await query(
    `SELECT ${select} FROM \`${table}\` WHERE \`${idColumn}\` = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/** Igual que findById pero lanza 404 si no existe. */
async function findByIdOrFail(table, idColumn, id, select = '*', label = 'Registro') {
  const row = await findById(table, idColumn, id, select);
  if (!row) {
    throw new NotFoundError(`${label} con id ${id} no encontrado.`);
  }
  return row;
}

module.exports = { findById, findByIdOrFail };
