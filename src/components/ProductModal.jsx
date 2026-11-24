import { useEffect, useId, useRef, useState } from 'react'
import { formatearPrecio } from '../utils/format.js'
import { presentacionPorTipo } from '../utils/producto.js'

function ProductModal({ producto, onClose, onAddToCart }) {
  const [agregado, setAgregado] = useState(false)
  const closeRef = useRef(null)
  const timerRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      clearTimeout(timerRef.current)
    }
  }, [onClose])

  const agregar = () => {
    onAddToCart(producto)
    setAgregado(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAgregado(false), 1600)
  }

  const presentacion = presentacionPorTipo(producto.tipo)
  const sinStock = producto.stock === 0
  const conOferta = producto.descuento > 0 && producto.precio > producto.precioFinal

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--product"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={closeRef}
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Cerrar detalle del producto"
        >
          ×
        </button>

        <div
          className={`product-detail__art product-card__art--${presentacion.arte}`}
          aria-hidden="true"
        >
          <span className="product-detail__emoji">{presentacion.emoji}</span>
        </div>

        <span className="eyebrow">
          {producto.marca} · {producto.tipo}
        </span>
        <h2 id={titleId}>{producto.nombre}</h2>

        <p className="product-detail__description">
          {producto.descripcion?.trim() ||
            'Este producto todavía no tiene una descripción ampliada.'}
        </p>

        <dl className="product-detail__specs">
          <div>
            <dt>Tallas disponibles</dt>
            <dd>{producto.tallas}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>{sinStock ? 'Sin unidades' : `${producto.stock} unidades`}</dd>
          </div>
          <div>
            <dt>Marca</dt>
            <dd>{producto.marca}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{producto.tipo}</dd>
          </div>
        </dl>

        <div className="product-detail__footer">
          <p className="product-card__price">
            <strong>{formatearPrecio(producto.precioFinal)}</strong>
            {conOferta && (
              <>
                <s>{formatearPrecio(producto.precio)}</s>
                <small>{Math.round(producto.descuento)}% de descuento</small>
              </>
            )}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={agregar}
            disabled={sinStock}
          >
            {sinStock ? 'Sin stock' : agregado ? 'Agregado ✓' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductModal
