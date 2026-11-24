import { useEffect, useRef, useState } from 'react'
import { formatearPrecio } from '../utils/format.js'
import { presentacionPorTipo } from '../utils/producto.js'

function ProductCard({ producto, onVerDetalle, onAddToCart }) {
  const [agregado, setAgregado] = useState(false)
  const timerRef = useRef(null)
  const presentacion = presentacionPorTipo(producto.tipo)
  const sinStock = producto.stock === 0
  const conOferta = producto.descuento > 0 && producto.precio > producto.precioFinal

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const agregar = () => {
    onAddToCart(producto)
    setAgregado(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAgregado(false), 1600)
  }

  let textoBoton = 'Agregar'
  if (sinStock) textoBoton = 'Agotado'
  else if (agregado) textoBoton = 'Agregado ✓'

  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card__open"
        onClick={() => onVerDetalle(producto)}
        aria-label={`Ver detalle de ${producto.nombre}`}
      />

      <div className={`product-card__art product-card__art--${presentacion.arte}`}>
        {sinStock ? (
          <span className="product-card__badge">Sin stock</span>
        ) : (
          conOferta && <span className="product-card__badge is-sale">Oferta</span>
        )}
        <span className="product-card__emoji" aria-hidden="true">
          {presentacion.emoji}
        </span>
      </div>

      <div className="product-card__body">
        <p className="product-card__meta">
          {producto.marca} · {producto.tipo}
        </p>
        <h3>{producto.nombre}</h3>
        <p className="product-card__stock">Tallas: {producto.tallas}</p>

        <div className="product-card__footer">
          <p className="product-card__price">
            <strong>{formatearPrecio(producto.precioFinal)}</strong>
            {conOferta && <s>{formatearPrecio(producto.precio)}</s>}
          </p>
          <button
            type="button"
            className={`product-card__add${agregado ? ' is-added' : ''}`}
            onClick={agregar}
            disabled={sinStock}
          >
            {textoBoton}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
