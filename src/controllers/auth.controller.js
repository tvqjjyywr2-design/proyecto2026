'use strict';

const { query } = require('../config/db');
const { asyncHandler, HttpError, ValidationError } = require('../utils/http');
const { ensureEmail } = require('../utils/validators');
const { verifyPassword } = require('../utils/password');

const ROL_ADMIN = 'admin';
const ROL_CLIENTE = 'cliente';

const ADMIN_COLUMNS = `
  idAdministrador, Apellido_y_Nombre, Email, Clave, Activo
`;

const USUARIO_COLUMNS = `
  idUsuario, Apellido_y_Nombre, Email, Clave, Activo
`;

/** Busca un administrador por email (consulta parametrizada). */
async function findAdministrador(email) {
  const rows = await query(
    `SELECT ${ADMIN_COLUMNS} FROM Administrador WHERE Email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/** Busca un usuario (cliente) por email (consulta parametrizada). */
async function findUsuario(email) {
  const rows = await query(
    `SELECT ${USUARIO_COLUMNS} FROM Usuarios WHERE Email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function registrarIntentoFallido(idAdministrador) {
  await query(
    `UPDATE Administrador
      SET Intentos_Fallidos = Intentos_Fallidos + 1
      WHERE idAdministrador = ?`,
    [idAdministrador]
  );
}

async function registrarAccesoAdministrador(idAdministrador) {
  await query(
    `UPDATE Administrador
      SET Ultimo_Login = NOW(), Intentos_Fallidos = 0
      WHERE idAdministrador = ?`,
    [idAdministrador]
  );
}

async function registrarAccesoUsuario(idUsuario) {
  await query(
    'UPDATE Usuarios SET Ultimo_Acceso = NOW() WHERE idUsuario = ?',
    [idUsuario]
  );
}

/** La clave se valida sin recortar espacios: debe compararse tal cual se guardó. */
function ensureClave(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError('El campo "clave" es obligatorio.');
  }
  if (value.length > 100) {
    throw new ValidationError('El campo "clave" no puede superar los 100 caracteres.');
  }
  return value;
}

/**
 * POST /api/auth/login
 * Valida las credenciales contra `Administrador` y, si no coincide,
 * contra `Usuarios`. Devuelve los datos públicos de la sesión (sin `Clave`).
 */
async function login(req, res) {
  const body = req.body || {};
  const email = ensureEmail(body.email);
  const clave = ensureClave(body.clave);

  const administrador = await findAdministrador(email);

  if (administrador) {
    if (!administrador.Activo) {
      throw new HttpError(403, 'Esta cuenta de administrador está desactivada.');
    }

    const coincide = await verifyPassword(clave, administrador.Clave);
    if (!coincide) {
      await registrarIntentoFallido(administrador.idAdministrador);
      throw new HttpError(401, 'Email o contraseña incorrectos.');
    }

    await registrarAccesoAdministrador(administrador.idAdministrador);

    res.json({
      data: {
        id: administrador.idAdministrador,
        nombre: administrador.Apellido_y_Nombre,
        email: administrador.Email,
        rol: ROL_ADMIN,
      },
    });
    return;
  }

  const usuario = await findUsuario(email);

  if (!usuario) {
    throw new HttpError(401, 'Email o contraseña incorrectos.');
  }

  if (!usuario.Activo) {
    throw new HttpError(403, 'Tu cuenta está desactivada. Contactá a atención al cliente.');
  }

  const coincide = await verifyPassword(clave, usuario.Clave);
  if (!coincide) {
    throw new HttpError(401, 'Email o contraseña incorrectos.');
  }

  await registrarAccesoUsuario(usuario.idUsuario);

  res.json({
    data: {
      id: usuario.idUsuario,
      nombre: usuario.Apellido_y_Nombre,
      email: usuario.Email,
      rol: ROL_CLIENTE,
    },
  });
}

module.exports = {
  login: asyncHandler(login),
};
