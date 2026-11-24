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
  ConflictError,
} = require('../utils/http');
const {
  has,
  isBlank,
  requireFields,
  ensureString,
  ensureEmail,
  ensurePhone,
  ensureBoolean,
  ensureDateTime,
  likePattern,
} = require('../utils/validators');
const { hashPassword } = require('../utils/password');
const { findByIdOrFail } = require('../utils/records');

const TABLE = 'Usuarios';
const ID = 'idUsuario';

// `Clave` nunca se devuelve en las respuestas.
const SELECT_COLUMNS = `
  idUsuario, Apellido_y_Nombre, Residencia, N_Movil, Email, Usuario,
  Recibe_Publicidad, Fecha_Registracion, Email_Verificado, Activo,
  Ultimo_Acceso, created_at, updated_at
`;

const SORTABLE = [
  'idUsuario',
  'Apellido_y_Nombre',
  'Email',
  'Usuario',
  'Fecha_Registracion',
  'Ultimo_Acceso',
  'created_at',
];

async function list(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const filters = [];
  const params = [];

  if (req.query.activo !== undefined && req.query.activo !== '') {
    filters.push('Activo = ?');
    params.push(ensureBoolean(req.query.activo, 'activo'));
  }

  if (req.query.recibePublicidad !== undefined && req.query.recibePublicidad !== '') {
    filters.push('Recibe_Publicidad = ?');
    params.push(ensureBoolean(req.query.recibePublicidad, 'recibePublicidad'));
  }

  if (req.query.emailVerificado !== undefined && req.query.emailVerificado !== '') {
    filters.push('Email_Verificado = ?');
    params.push(ensureBoolean(req.query.emailVerificado, 'emailVerificado'));
  }

  if (!isBlank(req.query.q)) {
    const pattern = likePattern(ensureString(req.query.q, 'q', { max: 150 }));
    filters.push('(Apellido_y_Nombre LIKE ? OR Email LIKE ? OR Usuario LIKE ?)');
    params.push(pattern, pattern, pattern);
  }

  if (!isBlank(req.query.email)) {
    filters.push('Email = ?');
    params.push(ensureEmail(req.query.email));
  }

  if (!isBlank(req.query.usuario)) {
    filters.push('Usuario = ?');
    params.push(ensureString(req.query.usuario, 'usuario', { max: 50 }));
  }

  const orderSql = parseSort(req.query.sort, SORTABLE, '`idUsuario` ASC');
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
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Usuario');
  res.json({ data: row });
}

async function buildData(body, { partial = false } = {}) {
  if (!partial) {
    requireFields(body, ['Apellido_y_Nombre', 'Residencia', 'N_Movil', 'Email', 'Usuario', 'Clave']);
  }

  const data = {};

  if (has(body, 'Apellido_y_Nombre')) {
    data.Apellido_y_Nombre = ensureString(body.Apellido_y_Nombre, 'Apellido_y_Nombre', { max: 150 });
  }
  if (has(body, 'Residencia')) {
    data.Residencia = ensureString(body.Residencia, 'Residencia', { max: 150 });
  }
  if (has(body, 'N_Movil')) {
    data.N_Movil = ensurePhone(body.N_Movil);
  }
  if (has(body, 'Email')) {
    data.Email = ensureEmail(body.Email);
  }
  if (has(body, 'Usuario')) {
    data.Usuario = ensureString(body.Usuario, 'Usuario', { max: 50 });
  }
  if (has(body, 'Clave')) {
    data.Clave = await hashPassword(body.Clave);
  }
  if (has(body, 'Recibe_Publicidad')) {
    data.Recibe_Publicidad = ensureBoolean(body.Recibe_Publicidad, 'Recibe_Publicidad');
  }
  if (has(body, 'Fecha_Registracion')) {
    data.Fecha_Registracion = ensureDateTime(body.Fecha_Registracion, 'Fecha_Registracion', { nullable: false });
  }
  if (has(body, 'Email_Verificado')) {
    data.Email_Verificado = ensureBoolean(body.Email_Verificado, 'Email_Verificado');
  }
  if (has(body, 'Activo')) {
    data.Activo = ensureBoolean(body.Activo, 'Activo');
  }
  if (has(body, 'Ultimo_Acceso')) {
    data.Ultimo_Acceso = ensureDateTime(body.Ultimo_Acceso, 'Ultimo_Acceso');
  }

  return data;
}

// Claves únicas de `Usuarios` (nombre del índice + columna) con su mensaje.
const UNIQUE_FIELDS = [
  {
    indexes: ['idx_email', '`Email`', "'Email'"],
    mensaje: 'Ya existe una cuenta registrada con ese email.',
  },
  {
    indexes: ['idx_usuario', '`Usuario`', "'Usuario'"],
    mensaje: 'Ese nombre de usuario ya está en uso. Probá con otro.',
  },
  {
    indexes: ['uk_n_movil', '`N_Movil`', "'N_Movil'"],
    mensaje: 'Ese número de móvil ya está registrado.',
  },
];

/** Traduce el error de clave duplicada de MySQL a un 409 legible. */
function describeUniqueError(error) {
  if (error.code !== 'ER_DUP_ENTRY') return error;

  const sqlMessage = String(error.sqlMessage || '');
  const field = UNIQUE_FIELDS.find(({ indexes }) =>
    indexes.some((index) => sqlMessage.includes(index))
  );

  return new ConflictError(
    field ? field.mensaje : 'Ya existe un registro con esos datos.',
    error.sqlMessage
  );
}

async function create(req, res) {
  const data = await buildData(req.body || {});

  let result;
  try {
    result = await query(`INSERT INTO \`${TABLE}\` SET ?`, [data]);
  } catch (error) {
    throw describeUniqueError(error);
  }

  const row = await findByIdOrFail(TABLE, ID, result.insertId, SELECT_COLUMNS, 'Usuario');

  res.status(201).location(`/api/usuarios/${result.insertId}`).json({ data: row });
}

async function update(req, res) {
  const id = parseId(req.params.id, ID);
  await findByIdOrFail(TABLE, ID, id, ID, 'Usuario');

  const data = await buildData(req.body || {}, { partial: true });
  if (!Object.keys(data).length) {
    throw new ValidationError('No se envió ningún campo para actualizar.');
  }

  await query(`UPDATE \`${TABLE}\` SET ? WHERE \`${ID}\` = ?`, [data, id]);
  const row = await findByIdOrFail(TABLE, ID, id, SELECT_COLUMNS, 'Usuario');

  res.json({ data: row });
}

async function remove(req, res) {
  const id = parseId(req.params.id, ID);
  const result = await query(`DELETE FROM \`${TABLE}\` WHERE \`${ID}\` = ?`, [id]);

  if (!result.affectedRows) {
    throw new NotFoundError(`Usuario con id ${id} no encontrado.`);
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
