'use strict';

/** Error HTTP controlado (se traduce a una respuesta JSON). */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

class ValidationError extends HttpError {
  constructor(message, details) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends HttpError {
  constructor(message, details) {
    super(409, message, details);
    this.name = 'ConflictError';
  }
}

/** Envuelve controladores async para que Express reciba sus errores. */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

/**
 * Lee y valida page/limit de la query string.
 * @returns {{ page: number, limit: number, offset: number }}
 */
function getPagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || 20;
  const limit = Math.min(Math.max(requested, 1), 100);

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Convierte "campo", "-campo" o "campo:desc" en una cláusula ORDER BY segura.
 * Solo acepta columnas incluidas en la lista blanca.
 */
function parseSort(raw, allowed, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;

  let field = raw.trim();
  let direction = 'ASC';

  if (field.startsWith('-')) {
    direction = 'DESC';
    field = field.slice(1);
  } else if (field.includes(':')) {
    const [name, dir] = field.split(':');
    field = name;
    direction = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  }

  if (!allowed.includes(field)) {
    throw new ValidationError(
      `Orden inválido. Campos permitidos: ${allowed.join(', ')}`
    );
  }

  return `\`${field}\` ${direction}`;
}

/** Valida un id numérico positivo de la URL. */
function parseId(raw, field = 'id') {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`El parámetro "${field}" debe ser un entero positivo.`);
  }
  return value;
}

/** Construye la cláusula WHERE a partir de fragmentos no vacíos. */
function buildWhere(fragments) {
  const parts = fragments.filter(Boolean);
  return parts.length ? `WHERE ${parts.join(' AND ')}` : '';
}

/**
 * Ejecuta una consulta de listado paginada.
 * @returns {{ data: Array, meta: object }}
 */
async function paginatedQuery({
  query,
  table,
  select,
  whereSql,
  params,
  orderSql,
  page,
  limit,
  offset,
}) {
  const countRows = await query(`SELECT COUNT(*) AS total FROM \`${table}\` ${whereSql}`, params);
  const total = Number(countRows[0]?.total || 0);

  const data = await query(
    `SELECT ${select} FROM \`${table}\` ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

module.exports = {
  HttpError,
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
  getPagination,
  parseSort,
  parseId,
  buildWhere,
  paginatedQuery,
};
