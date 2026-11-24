import { apiRequest } from './client.js'

/** Convierte una fila de `Usuarios` al modelo de sesión de la UI. */
function normalizarUsuario(fila) {
  return {
    id: fila.idUsuario,
    nombre: fila.Apellido_y_Nombre,
    email: fila.Email,
  }
}

/** POST /api/usuarios — registra un cliente en la tabla `Usuarios`. */
export async function registrarUsuario(datos) {
  const { data } = await apiRequest('/usuarios', {
    method: 'POST',
    body: datos,
  })

  return normalizarUsuario(data)
}
