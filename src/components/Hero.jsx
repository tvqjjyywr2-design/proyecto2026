function Hero({ productos, total, cargando }) {
  const descuentoMax = productos.reduce(
    (maximo, producto) => Math.max(maximo, producto.descuento),
    0,
  )

  return (
    <section className="hero" id="inicio">
      <div className="container hero__grid">
        <div className="hero__content">
          <span className="eyebrow">Nueva temporada 2026</span>
          <h1>
            Jugá mejor.
            <br />
            Llegá más lejos.
          </h1>
          <p className="hero__lead">
            Palos, pelotas e indumentaria de las mejores marcas, seleccionados
            por jugadores para jugadores. Todo lo que necesitás para bajar
            hándicap, en un solo lugar.
          </p>
          <div className="hero__cta">
            <a className="btn btn--primary btn--lg" href="#destacados">
              Ver productos
            </a>
            <a className="btn btn--outline btn--lg" href="#ofertas">
              Ofertas de la semana
            </a>
          </div>
          <dl className="hero__stats">
            <div>
              <dt>{cargando ? '—' : `+${total}`}</dt>
              <dd>productos en catálogo</dd>
            </div>
            <div>
              <dt>24/48 h</dt>
              <dd>envíos a todo el país</dd>
            </div>
            <div>
              <dt>30 días</dt>
              <dd>para devoluciones</dd>
            </div>
          </dl>
        </div>

        <div className="hero__visual">
          <svg
            viewBox="0 0 520 460"
            role="img"
            aria-label="Pelota de golf junto a un banderín en el green"
          >
            <defs>
              <radialGradient id="hero-ball" cx="35%" cy="26%" r="78%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#d9e2da" />
              </radialGradient>
              <pattern
                id="hero-dimples"
                width="17"
                height="17"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="4.2" cy="4.2" r="2.1" fill="#b9c7bc" opacity="0.45" />
                <circle cx="12.7" cy="12.7" r="2.1" fill="#b9c7bc" opacity="0.45" />
              </pattern>
              <linearGradient id="hero-green" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2a7a58" />
                <stop offset="55%" stopColor="#14503a" />
                <stop offset="100%" stopColor="#082a20" />
              </linearGradient>
              <linearGradient id="hero-flag" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f0cb7a" />
                <stop offset="100%" stopColor="#c8a45c" />
              </linearGradient>
            </defs>

            <circle cx="262" cy="226" r="206" fill="url(#hero-green)" />
            <ellipse cx="270" cy="368" rx="150" ry="24" fill="#061d16" opacity="0.5" />

            <g stroke="#e9e3d3" strokeWidth="3.4" strokeLinecap="round">
              <path d="M352 148v210" />
            </g>
            <path d="M352 150h78l-19 27 19 27h-78v-54Z" fill="url(#hero-flag)" />
            <ellipse cx="352" cy="360" rx="20" ry="7" fill="#061d16" opacity="0.55" />

            <circle cx="212" cy="232" r="88" fill="url(#hero-ball)" />
            <circle cx="212" cy="232" r="88" fill="url(#hero-dimples)" />
            <circle
              cx="212"
              cy="232"
              r="88"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.6"
            />
            <ellipse cx="184" cy="200" rx="26" ry="16" fill="#ffffff" opacity="0.75" />

            <g fill="#ffffff" opacity="0.16">
              <circle cx="110" cy="330" r="5" />
              <circle cx="412" cy="300" r="4" />
              <circle cx="390" cy="96" r="3" />
              <circle cx="132" cy="112" r="3" />
            </g>
          </svg>

          {!cargando && descuentoMax > 0 && (
            <div className="hero__badge">
              <span>Hasta</span>
              <strong>{Math.round(descuentoMax)}% OFF</strong>
              <span>en productos seleccionados</span>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <ul className="services">
          <li>
            <span aria-hidden="true">🚚</span>
            <div>
              <strong>Envío gratis</strong>
              <small>En compras desde 150 €</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">💳</span>
            <div>
              <strong>Cuotas sin interés</strong>
              <small>Con tarjetas seleccionadas</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">↩️</span>
            <div>
              <strong>Devolución fácil</strong>
              <small>30 días para cambiarlo</small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">🛡️</span>
            <div>
              <strong>Garantía oficial</strong>
              <small>Todos los productos</small>
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}

export default Hero
