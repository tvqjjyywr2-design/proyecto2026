import { iniciarSesion } from '../api/auth.js'
import { registrarUsuario } from '../api/usuarios.js'

const SESSION_KEY = 'tiendagolf:sesion'
const MENSAJE_ERROR_GENERICO = 'No pudimos completar la operación. Intentá nuevamente.'

export const ROL_ADMIN = 'admin'
export const ROL_CLIENTE = 'cliente'

function guardarSesion(usuario) {
  const sesion = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sesion))
  } catch {
    // Sin acceso a localStorage: la sesión solo vivirá en memoria.
  }

  return sesion
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const sesion = JSON.parse(raw)
    const valida = Number.isInteger(sesion?.id) && Boolean(sesion?.email) && Boolean(sesion?.rol)

    return valida ? sesion : null
  } catch {
    return null
  }
}

/** Inicia sesión contra la API (Administrador o Usuarios). */
export async function login(email, clave) {
  try {
    const usuario = await iniciarSesion({ email, clave })
    return { user: guardarSesion(usuario) }
  } catch (error) {
    return { error: error.message || MENSAJE_ERROR_GENERICO }
  }
}

/** Registra un cliente nuevo en la tabla `Usuarios` y abre su sesión. */
export async function register({ nombre, email, usuario, telefono, residencia, clave, publicidad }) {
  try {
    const creado = await registrarUsuario({
      Apellido_y_Nombre: nombre,
      Residencia: residencia,
      N_Movil: telefono,
      Email: email,
      Usuario: usuario,
      Clave: clave,
      Recibe_Publicidad: publicidad ? 1 : 0,
    })

    return { user: guardarSesion({ ...creado, rol: ROL_CLIENTE }) }
  } catch (error) {
    return { error: error.message || MENSAJE_ERROR_GENERICO }
  }
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Sin acceso a localStorage: no hay nada que limpiar.
  }
}
