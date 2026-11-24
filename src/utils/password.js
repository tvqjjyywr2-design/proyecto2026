'use strict';

const bcrypt = require('bcryptjs');
const { ValidationError } = require('./http');

const DEFAULT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

/**
 * Genera el hash bcrypt de una contraseña en texto plano.
 * La columna `Clave` del esquema exige >= 60 caracteres, por eso nunca
 * se guarda el texto original.
 */
async function hashPassword(plainPassword, field = 'Clave') {
  if (typeof plainPassword !== 'string') {
    throw new ValidationError(`El campo "${field}" debe ser un texto.`);
  }
  if (plainPassword.length < 6) {
    throw new ValidationError(`El campo "${field}" debe tener al menos 6 caracteres.`);
  }
  if (Buffer.byteLength(plainPassword, 'utf8') > 72) {
    throw new ValidationError(`El campo "${field}" no puede superar los 72 bytes (límite de bcrypt).`);
  }
  return bcrypt.hash(plainPassword, DEFAULT_ROUNDS);
}

function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, verifyPassword };
