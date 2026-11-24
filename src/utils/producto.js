// Presentación de cada `Tipo` de productos. El dato de negocio viene de la
// base; acá solo se define el emoji y el color de la tarjeta.
const PRESENTACION_POR_TIPO = {
  'Adulto Masculino': { emoji: '🏌️', arte: 'mint' },
  'Adulto Femenino': { emoji: '👕', arte: 'rose' },
  'Infantil Niños': { emoji: '⛳', arte: 'sky' },
  'Infantil Niñas': { emoji: '🌸', arte: 'sand' },
}

const PRESENTACION_DEFAULT = { emoji: '🛍️', arte: 'stone' }
const ORDEN_TIPOS = Object.keys(PRESENTACION_POR_TIPO)

/** Valores permitidos del ENUM `Tipo` de la tabla `productos`. */
export const TIPOS_PRODUCTO = ORDEN_TIPOS

export function presentacionPorTipo(tipo) {
  return PRESENTACION_POR_TIPO[tipo] || PRESENTACION_DEFAULT
}

/** Agrupa el catálogo por `Tipo` y cuenta cuántos productos hay en cada uno. */
export function agruparPorTipo(productos) {
  const grupos = new Map()

  productos.forEach((producto) => {
    const grupo = grupos.get(producto.tipo) || { tipo: producto.tipo, cantidad: 0 }
    grupo.cantidad += 1
    grupos.set(producto.tipo, grupo)
  })

  const peso = (tipo) => {
    const posicion = ORDEN_TIPOS.indexOf(tipo)
    return posicion === -1 ? ORDEN_TIPOS.length : posicion
  }

  return [...grupos.values()]
    .sort((a, b) => peso(a.tipo) - peso(b.tipo))
    .map((grupo) => ({ ...grupo, ...presentacionPorTipo(grupo.tipo) }))
}
