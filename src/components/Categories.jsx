import CategoryIcon from './CategoryIcon.jsx'
import { agruparPorTipo } from '../utils/producto.js'

function Categories({ productos, cargando }) {
  const categorias = agruparPorTipo(productos)

  return (
    <section className="section categories" id="categorias">
      <div className="container">
        <header className="categories__head">
          <span className="eyebrow eyebrow--pill">Explorá la tienda</span>
          <div className="categories__head-row">
            <h2 className="categories__title">Categorías</h2>
            <p className="categories__note">
              Equipate de punta a punta, desde el tee hasta el green.
            </p>
          </div>
        </header>

        {cargando ? (
          <p className="catalog-status" role="status">
            Cargando categorías…
          </p>
        ) : categorias.length === 0 ? (
          <p className="catalog-status">No hay categorías para mostrar por ahora.</p>
        ) : (
          <ul className="category-grid">
            {categorias.map((categoria) => (
              <li key={categoria.tipo}>
                <a className="category-card" href="#destacados">
                  <span className="category-card__arrow" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>

                  <span className="category-card__icon">
                    <CategoryIcon tipo={categoria.tipo} />
                  </span>

                  <span className="category-card__body">
                    <span className="category-card__name">{categoria.tipo}</span>
                    <span className="category-card__count">
                      {categoria.cantidad}{' '}
                      {categoria.cantidad === 1 ? 'producto' : 'productos'}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default Categories
