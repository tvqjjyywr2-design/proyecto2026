function PromoBanner({ onOpenRegister }) {
  return (
    <section className="section promo" id="ofertas">
      <div className="container">
        <div className="promo__panel">
          <div className="promo__content">
            <span className="eyebrow eyebrow--light">Solo por esta semana</span>
            <h2>10% OFF en tu primera compra</h2>
            <p>
              Creá tu cuenta y usá el código en el checkout. Válido en todo el
              catálogo, sin mínimo de compra.
            </p>
            <div className="promo__actions">
              <button type="button" className="btn btn--gold btn--lg" onClick={onOpenRegister}>
                Crear mi cuenta
              </button>
              <span className="promo__code">
                Código: <strong>GOLF10</strong>
              </span>
            </div>
          </div>

          <div className="promo__art" aria-hidden="true">
            <span className="promo__ring" />
            <span className="promo__ball" />
            <span className="promo__flag">
              <i />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
