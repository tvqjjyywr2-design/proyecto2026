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
} = require('../utils/validators');
const { findByIdOrFail } = require('../utils/records');

const TABLE = 'Detalle_Compra';
const ID = 'idDetalle';

const SELECT_COLUMNS = `
  idDetalle, idTransaccion, idProductos, Cantidad, Precio_Unitario,
  Subtotal, created_at, updated_at
`;

const SORTABLE = [
  'idDetalle',
  'idTransaccion',
  'idProductos',
  'Cantidad',
  'Precio_Unitario',
  'Subtotal',
  'created_at',
];

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateSubtotal(cantidad, precioUnitario) {
  const subtotal = round2(cantidad * precioUnitario);
  if (!Number.isFinite(subtotal)) {
    throw new ValidationError('No se pudo calcular el Subtotal de la línea.');
  }
  if (subtotal > 99999999.99) {
    throw new ValidationError(
      'El Subtotal calculado excede el máximo permitido por la columna DECIMAL(10,2).'
    );
  }
  return subtotal;
}

async function list(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const params = [];

  if (!isBlank(req.query.idTransaccion)) {
    filters.push('idTransaccion = ?');
    params.push(ensureInt(req.query.idTransaccion, 'idTransaccion', { min: 1 }));
  }
  if (!isBlank(req.query.idProductos)) {
    filters.push('idProductos = ?');
    params.push(ensureInt(req.query.idProductos, 'idProductos', { min: 1 }));
  }

  const orderSql = parseSort(req.query.sort, SORTABLE, '`idDetalle` ASC');
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
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Detalle');
  res.json({ data: row });
}

function buildData(body, { partial = false } = {}) {
  if (!partial) {
    requireFields(body, ['idTransaccion', 'idProductos', 'Precio_Unitario']);
  }

  const data = {};

  if (has(body, 'idTransaccion')) {
    data.idTransaccion = ensureInt(body.idTransaccion, 'idTransaccion', { min: 1 });
  }
  if (has(body, 'idProductos')) {
    data.idProductos = ensureInt(body.idProductos, 'idProductos', { min: 1 });
  }
  if (has(body, 'Cantidad')) {
    data.Cantidad = ensureInt(body.Cantidad, 'Cantidad', { min: 1 });
  }
  if (has(body, 'Precio_Unitario')) {
    data.Precio_Unitario = ensureDecimal(body.Precio_Unitario, 'Precio_Unitario');
  }

  // `Subtotal` se calcula siempre en el servidor (Cantidad * Precio_Unitario).
  return data;
}

async function create(req, res) {
  const data = buildData(req.body || {});
  data.Cantidad = data.Cantidad ?? 1;
  data.Subtotal = calculateSubtotal(data.Cantidad, data.Precio_Unitario);

  const result = await query(`INSERT INTO \`${TABLE}\` SET ?`, [data]);
  const row = await findByIdOrFail(TABLE, ID, result.insertId, SELECT_COLUMNS, 'Detalle');

  res.status(201).location(`/api/detalle-compra/${result.insertId}`).json({ data: row });
}

async function update(req, res) {
  const id = parseId(req.params.id, ID);
  const current = await findByIdOrFail(TABLE, ID, id, '*', 'Detalle');

  const data = buildData(req.body || {}, { partial: true });
  if (!Object.keys(data).length) {
    throw new ValidationError('No se envió ningún campo para actualizar.');
  }

  const cantidad = data.Cantidad ?? Number(current.Cantidad);
  const precioUnitario = data.Precio_Unitario ?? Number(current.Precio_Unitario);
  data.Subtotal = calculateSubtotal(cantidad, precioUnitario);

  await query(`UPDATE \`${TABLE}\` SET ? WHERE \`${ID}\` = ?`, [data, id]);
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Detalle');

  res.json({ data: row });
}

async function remove(req, res) {
  const id = parseId(req.params.id, ID);
  const result = await query(`DELETE FROM \`${TABLE}\` WHERE \`${ID}\` = ?`, [id]);

  if (!result.affectedRows) {
    throw new NotFoundError(`Detalle con id ${id} no encontrado.`);
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
