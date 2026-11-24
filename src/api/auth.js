import { apiRequest } from './client.js'

/** POST /api/auth/login — valida credenciales contra la base real. */
export async function iniciarSesion({ email, clave }) {
  const { data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, clave },
  })

  return data
}
