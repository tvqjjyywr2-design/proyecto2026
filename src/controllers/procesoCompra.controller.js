'use strict';

const { query } = require('../config/db');
const {
  asyncHandler,
  getPagination,
  parseSort,
  parseId,
  buildWhere,
  paginatedQuery,
  ValidationError,
  NotFoundError,
} = require('../utils/http');
const {
  has,
  isBlank,
  requireFields,
  ensureInt,
  ensureDecimal,
  ensureEnum,
  ensureBoolean,
  ensureDateTime,
} = require('../utils/validators');
const { findByIdOrFail } = require('../utils/records');

const TABLE = 'Proceso_Compra';
const ID = 'idTransaccion';

const TIPOS = ['Finalizada', 'En proceso'];
const ESTADOS_PAGO = ['Pendiente', 'Pagado', 'Rechazado', 'Reembolsado'];
const METODOS_PAGO = ['Tarjeta', 'Transferencia', 'Efectivo', 'MercadoPago'];

const SELECT_COLUMNS = `
  idTransaccion, Tipo, Importe, idUsuario, Entregado, Estado_Pago,
  Metodo_Pago, Fecha_Transaccion, Fecha_Pago, Fecha_Entrega,
  Es_Black_Friday, Descuento_Aplicado, created_at, updated_at
`;

const SORTABLE = [
  'idTransaccion',
  'Tipo',
  'Importe',
  'idUsuario',
  'Entregado',
  'Estado_Pago',
  'Fecha_Transaccion',
  'Fecha_Pago',
  'Fecha_Entrega',
  'Es_Black_Friday',
  'Descuento_Aplicado',
  'created_at',
];

async function list(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const params = [];

  if (!isBlank(req.query.idUsuario)) {
    filters.push('idUsuario = ?');
    params.push(ensureInt(req.query.idUsuario, 'idUsuario', { min: 1 }));
  }
  if (!isBlank(req.query.tipo)) {
    filters.push('Tipo = ?');
    params.push(ensureEnum(req.query.tipo, 'tipo', TIPOS));
  }
  if (!isBlank(req.query.estadoPago)) {
    filters.push('Estado_Pago = ?');
    params.push(ensureEnum(req.query.estadoPago, 'estadoPago', ESTADOS_PAGO));
  }
  if (!isBlank(req.query.entregado)) {
    filters.push('Entregado = ?');
    params.push(ensureBoolean(req.query.entregado, 'entregado'));
  }
  if (!isBlank(req.query.esBlackFriday)) {
    filters.push('Es_Black_Friday = ?');
    params.push(ensureBoolean(req.query.esBlackFriday, 'esBlackFriday'));
  }
  if (!isBlank(req.query.fechaDesde)) {
    filters.push('Fecha_Transaccion >= ?');
    params.push(ensureDateTime(req.query.fechaDesde, 'fechaDesde', { nullable: false }));
  }
  if (!isBlank(req.query.fechaHasta)) {
    filters.push('Fecha_Transaccion <= ?');
    params.push(ensureDateTime(req.query.fechaHasta, 'fechaHasta', { nullable: false }));
  }

  const orderSql = parseSort(req.query.sort, SORTABLE, '`idTransaccion` DESC');
  const result = await paginatedQuery({
    query,
    table: TABLE,
    select: SELECT_COLUMNS,
    whereSql: buildWhere(filters),
    params,
    orderSql,
    page,
    limit,
    offset,
  });

  res.json(result);
}

async function getById(req, res) {
  const id = parseId(req.params.id, ID);
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Transacción');
  res.json({ data: row });
}

/** Reglas de negocio que también existen como CHECK en MySQL. */
function validateBusinessRules({ tipo, entregado, importe, descuento }) {
  if (tipo !== 'Finalizada' && entregado === 1) {
    throw new ValidationError(
      "Un pedido con Tipo 'En proceso' no puede marcarse como Entregado = 1. " +
        "Primero debe finalizarse."
    );
  }
  if (descuento > importe) {
    throw new ValidationError(
      'Descuento_Aplicado no puede ser mayor que Importe.'
    );
  }
}

function buildData(body, { partial = false } = {}) {
  if (!partial) {
    requireFields(body, ['idUsuario']);
  }

  const data = {};

  if (has(body, 'Tipo')) {
    data.Tipo = ensureEnum(body.Tipo, 'Tipo', TIPOS);
  }
  if (has(body, 'Importe')) {
    data.Importe = ensureDecimal(body.Importe, 'Importe');
  }
  if (has(body, 'idUsuario')) {
    data.idUsuario = ensureInt(body.idUsuario, 'idUsuario', { min: 1 });
  }
  if (has(body, 'Entregado')) {
    data.Entregado = ensureBoolean(body.Entregado, 'Entregado');
  }
  if (has(body, 'Estado_Pago')) {
    data.Estado_Pago = ensureEnum(body.Estado_Pago, 'Estado_Pago', ESTADOS_PAGO);
  }
  if (has(body, 'Metodo_Pago')) {
    data.Metodo_Pago = isBlank(body.Metodo_Pago)
      ? null
      : ensureEnum(body.Metodo_Pago, 'Metodo_Pago', METODOS_PAGO);
  }
  if (has(body, 'Fecha_Transaccion')) {
    data.Fecha_Transaccion = ensureDateTime(body.Fecha_Transaccion, 'Fecha_Transaccion', {
      nullable: false,
    });
  }
  if (has(body, 'Fecha_Pago')) {
    data.Fecha_Pago = ensureDateTime(body.Fecha_Pago, 'Fecha_Pago');
  }
  if (has(body, 'Fecha_Entrega')) {
    data.Fecha_Entrega = ensureDateTime(body.Fecha_Entrega, 'Fecha_Entrega');
  }
  if (has(body, 'Es_Black_Friday')) {
    data.Es_Black_Friday = ensureBoolean(body.Es_Black_Friday, 'Es_Black_Friday');
  }
  if (has(body, 'Descuento_Aplicado')) {
    data.Descuento_Aplicado = ensureDecimal(body.Descuento_Aplicado, 'Descuento_Aplicado');
  }

  return data;
}

async function create(req, res) {
  const data = buildData(req.body || {});

  validateBusinessRules({
    tipo: data.Tipo || 'En proceso',
    entregado: data.Entregado ?? 0,
    importe: data.Importe ?? 0,
    descuento: data.Descuento_Aplicado ?? 0,
  });

  const result = await query(`INSERT INTO \`${TABLE}\` SET ?`, [data]);
  const row = await findByIdOrFail(TABLE, ID, result.insertId, SELECT_COLUMNS, 'Transacción');

  res.status(201).location(`/api/proceso-compra/${result.insertId}`).json({ data: row });
}

async function update(req, res) {
  const id = parseId(req.params.id, ID);
  const current = await findByIdOrFail(TABLE, ID, id, '*', 'Transacción');

  const data = buildData(req.body || {}, { partial: true });
  if (!Object.keys(data).length) {
    throw new ValidationError('No se envió ningún campo para actualizar.');
  }

  // Se valida el estado resultante (fila actual + cambios enviados).
  validateBusinessRules({
    tipo: data.Tipo ?? current.Tipo,
    entregado: data.Entregado ?? Number(current.Entregado),
    importe: data.Importe ?? Number(current.Importe),
    descuento: data.Descuento_Aplicado ?? Number(current.Descuento_Aplicado),
  });

  await query(`UPDATE \`${TABLE}\` SET ? WHERE \`${ID}\` = ?`, [data, id]);
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Transacción');

  res.json({ data: row });
}

async function remove(req, res) {
  const id = parseId(req.params.id, ID);
  const result = await query(`DELETE FROM \`${TABLE}\` WHERE \`${ID}\` = ?`, [id]);

  if (!result.affectedRows) {
    throw new NotFoundError(`Transacción con id ${id} no encontrada.`);
  }

  res.status(204).send();
}

module.exports = {
  list: asyncHandler(list),
  getById: asyncHandler(getById),
  create: asyncHandler(create),
  update: asyncHandler(update),
  remove: asyncHandler(remove),
};
