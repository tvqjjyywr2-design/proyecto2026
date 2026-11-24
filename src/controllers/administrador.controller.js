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
  ensureEmail,
  ensurePhone,
  ensureBoolean,
  ensureEnum,
  ensureInt,
  ensureDateTime,
  likePattern,
} = require('../utils/validators');
const { hashPassword } = require('../utils/password');
const { findByIdOrFail } = require('../utils/records');

const TABLE = 'Administrador';
const ID = 'idAdministrador';

const ROLES = ['SuperAdmin', 'Admin', 'Editor'];

const SELECT_COLUMNS = `
  idAdministrador, Apellido_y_Nombre, Email, N_Movil, Usuario, Rol,
  Activo, Ultimo_Login, Intentos_Fallidos, created_at, updated_at
`;

const SORTABLE = [
  'idAdministrador',
  'Apellido_y_Nombre',
  'Email',
  'Usuario',
  'Rol',
  'Activo',
  'Ultimo_Login',
  'Intentos_Fallidos',
  'created_at',
];

async function list(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const params = [];

  if (!isBlank(req.query.rol)) {
    filters.push('Rol = ?');
    params.push(ensureEnum(req.query.rol, 'rol', ROLES));
  }
  if (!isBlank(req.query.activo)) {
    filters.push('Activo = ?');
    params.push(ensureBoolean(req.query.activo, 'activo'));
  }
  if (!isBlank(req.query.q)) {
    const pattern = likePattern(ensureString(req.query.q, 'q', { max: 150 }));
    filters.push('(Apellido_y_Nombre LIKE ? OR Email LIKE ? OR Usuario LIKE ?)');
    params.push(pattern, pattern, pattern);
  }

  const orderSql = parseSort(req.query.sort, SORTABLE, '`idAdministrador` ASC');
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
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Administrador');
  res.json({ data: row });
}

async function buildData(body, { partial = false } = {}) {
  if (!partial) {
    requireFields(body, ['Apellido_y_Nombre', 'Email', 'N_Movil', 'Usuario', 'Clave']);
  }

  const data = {};

  if (has(body, 'Apellido_y_Nombre')) {
    data.Apellido_y_Nombre = ensureString(body.Apellido_y_Nombre, 'Apellido_y_Nombre', { max: 150 });
  }
  if (has(body, 'Email')) {
    data.Email = ensureEmail(body.Email);
  }
  if (has(body, 'N_Movil')) {
    data.N_Movil = ensurePhone(body.N_Movil);
  }
  if (has(body, 'Usuario')) {
    data.Usuario = ensureString(body.Usuario, 'Usuario', { max: 50 });
  }
  if (has(body, 'Clave')) {
    data.Clave = await hashPassword(body.Clave);
  }
  if (has(body, 'Rol')) {
    data.Rol = ensureEnum(body.Rol, 'Rol', ROLES);
  }
  if (has(body, 'Activo')) {
    data.Activo = ensureBoolean(body.Activo, 'Activo');
  }
  if (has(body, 'Ultimo_Login')) {
    data.Ultimo_Login = ensureDateTime(body.Ultimo_Login, 'Ultimo_Login');
  }
  if (has(body, 'Intentos_Fallidos')) {
    data.Intentos_Fallidos = ensureInt(body.Intentos_Fallidos, 'Intentos_Fallidos');
  }

  return data;
}

async function create(req, res) {
  const data = await buildData(req.body || {});

  const result = await query(`INSERT INTO \`${TABLE}\` SET ?`, [data]);
  const row = await findByIdOrFail(TABLE, ID, result.insertId, SELECT_COLUMNS, 'Administrador');

  res.status(201).location(`/api/administradores/${result.insertId}`).json({ data: row });
}

async function update(req, res) {
  const id = parseId(req.params.id, ID);
  await findByIdOrFail(TABLE, ID, id, ID, 'Administrador');

  const data = await buildData(req.body || {}, { partial: true });
  if (!Object.keys(data).length) {
    throw new ValidationError('No se envió ningún campo para actualizar.');
  }

  await query(`UPDATE \`${TABLE}\` SET ? WHERE \`${ID}\` = ?`, [data, id]);
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Administrador');

  res.json({ data: row });
}

async function remove(req, res) {
  const id = parseId(req.params.id, ID);
  const result = await query(`DELETE FROM \`${TABLE}\` WHERE \`${ID}\` = ?`, [id]);

  if (!result.affectedRows) {
    throw new NotFoundError(`Administrador con id ${id} no encontrado.`);
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
