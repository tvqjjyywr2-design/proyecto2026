import { apiRequest } from './client.js'

const LIMITE_MAXIMO = 100

/** Convierte una fila de la tabla `productos` al modelo que usa la UI. */
function normalizarProducto(fila) {
  const precio = Number(fila.Precio)
  const precioFinal = Number(fila.Precio_Final)

  return {
    id: fila.idProductos,
    nombre: fila.Nombre_Corto,
    descripcion: fila.Descripcion ?? '',
    marca: fila.Marca,
    tipo: fila.Tipo,
    tallas: fila.Tallas,
    stock: Number(fila.Stock) || 0,
    precio: Number.isFinite(precio) ? precio : 0,
    precioFinal: Number.isFinite(precioFinal) ? precioFinal : precio,
    descuento: Number(fila.Porcentaje_Oferta) || 0,
  }
}

export async function listarProductos({
  limit = LIMITE_MAXIMO,
  sort = '-idProductos',
  signal,
} = {}) {
  const params = new URLSearchParams({ limit: String(limit), sort })
  const respuesta = await apiRequest(`/productos?${params}`, { signal })
  const filas = Array.isArray(respuesta?.data) ? respuesta.data : []

  return {
    productos: filas.map(normalizarProducto),
    total: Number(respuesta?.meta?.total ?? filas.length),
  }
}

/** PATCH /api/productos/:id — actualiza solo los campos enviados. */
export async function actualizarProducto(id, datos) {
  const { data } = await apiRequest(`/productos/${id}`, {
    method: 'PATCH',
    body: datos,
  })

  return normalizarProducto(data)
}
