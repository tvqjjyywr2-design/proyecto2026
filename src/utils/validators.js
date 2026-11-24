'use strict';

const { ValidationError } = require('./http');

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/** Verifica que el body tenga todos los campos obligatorios. */
function requireFields(body, fields) {
  const missing = fields.filter((field) => isBlank(body[field]));
  if (missing.length) {
    throw new ValidationError(`Campos obligatorios faltantes: ${missing.join(', ')}.`);
  }
}

/** Texto obligatorio u opcional con longitud máxima. */
function ensureString(value, field, { max = 255, min = 1 } = {}) {
  if (typeof value !== 'string') {
    throw new ValidationError(`El campo "${field}" debe ser un texto.`);
  }

  const text = value.trim();
  const length = [...text].length;

  if (length < min) {
    throw new ValidationError(`El campo "${field}" debe tener al menos ${min} caracteres.`);
  }
  if (length > max) {
    throw new ValidationError(`El campo "${field}" no puede superar los ${max} caracteres.`);
  }
  return text;
}

/** Texto opcional: null/vacío se guarda como NULL. */
function ensureOptionalString(value, field, { max = 255 } = {}) {
  if (value === null || value === undefined || value === '') return null;
  return ensureString(value, field, { max, min: 0 });
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

/** Decimal con redondeo a 2 posiciones (DECIMAL(10,2)). */
function ensureDecimal(value, field, { min = 0, max = 99999999.99 } = {}) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    throw new ValidationError(`El campo "${field}" debe ser un número.`);
  }
  if (number < min || number > max) {
    throw new ValidationError(`El campo "${field}" debe estar entre ${min} y ${max}.`);
  }
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

/** Entero >= min (por defecto 0) y <= max. */
function ensureInt(value, field, { min = 0, max = 4294967295 } = {}) {
  const number = toNumber(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    throw new ValidationError(`El campo "${field}" debe ser un número entero.`);
  }
  if (number < min || number > max) {
    throw new ValidationError(`El campo "${field}" debe estar entre ${min} y ${max}.`);
  }
  return number;
}

const TRUE_VALUES = new Set([true, 1, '1', 'true', 'si', 'sí']);
const FALSE_VALUES = new Set([false, 0, '0', 'false', 'no']);

/** Booleano de MySQL (TINYINT(1)): acepta true/false, 1/0, "true"/"false". */
function ensureBoolean(value, field) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : value;
  if (TRUE_VALUES.has(normalized)) return 1;
  if (FALSE_VALUES.has(normalized)) return 0;
  throw new ValidationError(`El campo "${field}" debe ser booleano (true/false o 1/0).`);
}

/** Valor de un ENUM de MySQL. */
function ensureEnum(value, field, allowed) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new ValidationError(
      `El campo "${field}" debe ser uno de: ${allowed.join(', ')}.`
    );
  }
  return value;
}

/** Escapa % y _ para usarlos como texto dentro de un LIKE. */
function likePattern(value) {
  return `%${String(value).replace(/[\\%_]/g, '\\$&')}%`;
}

function ensureEmail(value, field = 'Email', { max = 150 } = {}) {
  const email = ensureString(value, field, { max });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError(`El campo "${field}" no tiene un formato de correo válido.`);
  }
  return email;
}

function ensurePhone(value, field = 'N_Movil') {
  const phone = ensureString(value, field, { max: 20, min: 6 });
  if (!/^[+0-9 ()-]+$/.test(phone)) {
    throw new ValidationError(
      `El campo "${field}" solo admite números, espacios, +, -, paréntesis.`
    );
  }
  return phone;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatUtc(date) {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

/**
 * Normaliza fechas a "YYYY-MM-DD HH:MM:SS".
 * Acepta "2026-11-18", "2026-11-18 10:30", ISO 8601 con o sin zona.
 */
function ensureDateTime(value, field, { nullable = true } = {}) {
  if (value === null || value === undefined || value === '') {
    if (nullable) return null;
    throw new ValidationError(`El campo "${field}" es obligatorio.`);
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`El campo "${field}" debe ser una fecha en texto.`);
  }

  const raw = value.trim();
  const plain = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw);

  if (plain) {
    const [, year, month, day, hour = '00', minute = '00', second = '00'] = plain;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
    );

    const valid =
      date.getUTCFullYear() === Number(year) &&
      date.getUTCMonth() === Number(month) - 1 &&
      date.getUTCDate() === Number(day) &&
      date.getUTCHours() === Number(hour) &&
      date.getUTCMinutes() === Number(minute) &&
      date.getUTCSeconds() === Number(second);

    if (!valid) {
      throw new ValidationError(`El campo "${field}" no es una fecha válida.`);
    }

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`El campo "${field}" no es una fecha válida.`);
  }
  return formatUtc(parsed);
}

module.exports = {
  has,
  isBlank,
  requireFields,
  ensureString,
  ensureOptionalString,
  ensureDecimal,
  ensureInt,
  ensureBoolean,
  ensureEnum,
  ensureEmail,
  likePattern,
  ensurePhone,
  ensureDateTime,
};
