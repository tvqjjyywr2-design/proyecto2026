import { useEffect, useState } from 'react'
import { listarProductos } from '../api/productos.js'

const ESTADO_INICIAL = {
  productos: [],
  total: 0,
  cargando: true,
  error: '',
}

/** Trae el catálogo real una sola vez y expone estados de carga y error. */
export function useProductos() {
  const [estado, setEstado] = useState(ESTADO_INICIAL)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listarProductos({ signal: controller.signal })
      .then(({ productos, total }) => {
        if (controller.signal.aborted) return
        setEstado({ productos, total, cargando: false, error: '' })
      })
      .catch((fallo) => {
        if (controller.signal.aborted || fallo.name === 'AbortError') return
        setEstado((actual) => ({ ...actual, cargando: false, error: fallo.message }))
      })

    return () => controller.abort()
  }, [intento])

  const reintentar = () => {
    setEstado((actual) => ({ ...actual, cargando: true, error: '' }))
    setIntento((valor) => valor + 1)
  }

  /** Reemplaza un producto de la lista con la versión que devolvió la API. */
  const reemplazarProducto = (producto) => {
    setEstado((actual) => ({
      ...actual,
      productos: actual.productos.map((item) =>
        item.id === producto.id ? producto : item,
      ),
    }))
  }

  return { ...estado, reintentar, reemplazarProducto }
}
