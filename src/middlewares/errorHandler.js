'use strict';

const { HttpError } = require('../utils/http');

/** Respuesta uniforme para rutas inexistentes. */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/** Traduce errores de validación y de MySQL a respuestas HTTP claras. */
function errorHandler(error, req, res, _next) {
  let status = 500;
  let message = 'Error interno del servidor.';
  let details;

  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
    details = error.details;
  } else {
    switch (error.code) {
      case 'ER_DUP_ENTRY':
        status = 409;
        message = 'Ya existe un registro con ese valor único.';
        details = error.sqlMessage;
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        status = 409;
        message = 'No se puede eliminar el registro porque tiene datos relacionados.';
        details = error.sqlMessage;
        break;
      case 'ER_NO_SUCH_TABLE':
        status = 503;
        message = 'Falta una tabla requerida en la base de datos.';
        details = error.sqlMessage;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        status = 409;
        message = 'El registro relacionado indicado no existe.';
        details = error.sqlMessage;
        break;
      case 'ER_CHECK_CONSTRAINT_VIOLATED':
      case 'ER_CONSTRAINT_FAILED':
        status = 400;
        message = 'La operación viola una regla de validación de la base de datos.';
        details = error.sqlMessage;
        break;
      case 'ER_BAD_NULL_ERROR':
        status = 400;
        message = 'Falta un campo obligatorio.';
        details = error.sqlMessage;
        break;
      case 'ER_DATA_TOO_LONG':
      case 'ER_TRUNCATED_WRONG_VALUE':
      case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
      case 'WARN_DATA_TRUNCATED':
        status = 400;
        message = 'Alguno de los valores enviados no es válido para su columna.';
        details = error.sqlMessage;
        break;
      case 'ER_NO_DEFAULT_FOR_FIELD':
        status = 400;
        message = 'Falta un campo obligatorio sin valor por defecto.';
        details = error.sqlMessage;
        break;
      case 'ECONNREFUSED':
      case 'PROTOCOL_CONNECTION_LOST':
      case 'ER_ACCESS_DENIED_ERROR':
        status = 503;
        message = 'No se pudo conectar con la base de datos.';
        details = error.sqlMessage;
        break;
      default:
        if (error.type === 'entity.parse.failed') {
          status = 400;
          message = 'El cuerpo de la petición no es un JSON válido.';
        }
    }
  }

  if (status >= 500) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      // Caso esperado cuando una tabla opcional fue eliminada: log compacto.
      console.warn(`[API] ${message} ${error.sqlMessage || ''}`);
    } else {
      console.error(error);
    }
  }

  const payload = { error: message };
  if (details) payload.details = details;
  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    payload.stack = error.stack;
  }

  res.status(status).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
