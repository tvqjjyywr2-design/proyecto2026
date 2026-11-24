const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Cliente HTTP único de la API. Centraliza la URL base, el JSON y el
 * manejo de errores para que ningún componente hable con `fetch` directo.
 */
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(
      'No pudimos conectarnos con el servidor. Verificá que la API esté disponible.',
    )
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      payload?.error || 'Ocurrió un error inesperado. Intentá nuevamente.',
      response.status,
    )
  }

  return payload
}
