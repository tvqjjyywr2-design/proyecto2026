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
  ensureString,
  ensureOptionalString,
  ensureDecimal,
  ensureInt,
  ensureEnum,
  ensureBoolean,
  likePattern,
} = require('../utils/validators');
const { findByIdOrFail } = require('../utils/records');

const TABLE = 'productos';
const ID = 'idProductos';

const TIPOS = ['Infantil Niños', 'Infantil Niñas', 'Adulto Femenino', 'Adulto Masculino'];

const SELECT_COLUMNS = `
  idProductos, Nombre_Corto, Descripcion, Precio, Porcentaje_Oferta, Stock,
  Marca, Tallas, Tipo, Precio_Final, created_at, updated_at
`;

const SORTABLE = [
  'idProductos',
  'Nombre_Corto',
  'Precio',
  'Porcentaje_Oferta',
  'Stock',
  'Marca',
  'Tipo',
  'Precio_Final',
  'created_at',
];

async function list(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const params = [];

  if (!isBlank(req.query.q)) {
    const pattern = likePattern(ensureString(req.query.q, 'q', { max: 100 }));
    filters.push('(Nombre_Corto LIKE ? OR Descripcion LIKE ? OR Marca LIKE ?)');
    params.push(pattern, pattern, pattern);
  }

  if (!isBlank(req.query.tipo)) {
    filters.push('Tipo = ?');
    params.push(ensureEnum(req.query.tipo, 'tipo', TIPOS));
  }

  if (!isBlank(req.query.marca)) {
    filters.push('Marca = ?');
    params.push(ensureString(req.query.marca, 'marca', { max: 80 }));
  }

  if (!isBlank(req.query.precioMin)) {
    filters.push('Precio >= ?');
    params.push(ensureDecimal(req.query.precioMin, 'precioMin'));
  }

  if (!isBlank(req.query.precioMax)) {
    filters.push('Precio <= ?');
    params.push(ensureDecimal(req.query.precioMax, 'precioMax'));
  }

  if (!isBlank(req.query.conStock)) {
    const conStock = ensureBoolean(req.query.conStock, 'conStock');
    filters.push(conStock ? 'Stock > 0' : 'Stock = 0');
  }

  const orderSql = parseSort(req.query.sort, SORTABLE, '`idProductos` ASC');
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
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Producto');
  res.json({ data: row });
}

function buildData(body, { partial = false } = {}) {
  if (!partial) {
    requireFields(body, ['Nombre_Corto', 'Precio', 'Marca', 'Tallas', 'Tipo']);
  }

  const data = {};

  if (has(body, 'Nombre_Corto')) {
    data.Nombre_Corto = ensureString(body.Nombre_Corto, 'Nombre_Corto', { max: 100 });
  }
  if (has(body, 'Descripcion')) {
    data.Descripcion = ensureOptionalString(body.Descripcion, 'Descripcion', { max: 65535 });
  }
  if (has(body, 'Precio')) {
    data.Precio = ensureDecimal(body.Precio, 'Precio');
  }
  if (has(body, 'Porcentaje_Oferta')) {
    data.Porcentaje_Oferta = ensureDecimal(body.Porcentaje_Oferta, 'Porcentaje_Oferta', {
      min: 0,
      max: 100,
    });
  }
  if (has(body, 'Stock')) {
    data.Stock = ensureInt(body.Stock, 'Stock');
  }
  if (has(body, 'Marca')) {
    data.Marca = ensureString(body.Marca, 'Marca', { max: 80 });
  }
  if (has(body, 'Tallas')) {
    data.Tallas = ensureString(body.Tallas, 'Tallas', { max: 50 });
  }
  if (has(body, 'Tipo')) {
    data.Tipo = ensureEnum(body.Tipo, 'Tipo', TIPOS);
  }

  // `Precio_Final` es una columna generada por MySQL: se ignora si se envía.
  return data;
}

async function create(req, res) {
  const data = buildData(req.body || {});

  const result = await query(`INSERT INTO \`${TABLE}\` SET ?`, [data]);
  const row = await findByIdOrFail(TABLE, ID, result.insertId, SELECT_COLUMNS, 'Producto');

  res.status(201).location(`/api/productos/${result.insertId}`).json({ data: row });
}

async function update(req, res) {
  const id = parseId(req.params.id, ID);
  await findByIdOrFail(TABLE, ID, id, ID, 'Producto');

  const data = buildData(req.body || {}, { partial: true });
  if (!Object.keys(data).length) {
    throw new ValidationError('No se envió ningún campo para actualizar.');
  }

  await query(`UPDATE \`${TABLE}\` SET ? WHERE \`${ID}\` = ?`, [data, id]);
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Producto');

  res.json({ data: row });
}

async function remove(req, res) {
  const id = parseId(req.params.id, ID);
  const result = await query(`DELETE FROM \`${TABLE}\` WHERE \`${ID}\` = ?`, [id]);

  if (!result.affectedRows) {
    throw new NotFoundError(`Producto con id ${id} no encontrado.`);
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
