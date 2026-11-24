import ProductCard from './ProductCard.jsx'

function ProductGrid({ productos, total, cargando, error, onReintentar, onAddToCart, onVerDetalle }) {
  return (
    <section className="section products" id="destacados">
      <div className="container">
        <div className="section__head">
          <div>
            <span className="eyebrow">Los más elegidos</span>
            <h2>Destacados de la semana</h2>
          </div>
          <a className="link-arrow" href="#categorias">
            Ver todo el catálogo <span aria-hidden="true">→</span>
          </a>
        </div>

        {cargando && (
          <p className="catalog-status" role="status">
            Cargando productos…
          </p>
        )}

        {!cargando && error && (
          <div className="catalog-status catalog-status--error" role="alert">
            <p>{error}</p>
            <button type="button" className="btn btn--outline" onClick={onReintentar}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && productos.length === 0 && (
          <p className="catalog-status">No hay productos disponibles por ahora.</p>
        )}

        {!cargando && !error && productos.length > 0 && (
          <>
            <div className="product-grid">
              {productos.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onVerDetalle={onVerDetalle}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
            <p className="product-grid__count">
              Mostrando {productos.length} de {total} productos.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export default ProductGrid
