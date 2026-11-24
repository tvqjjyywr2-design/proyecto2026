import { useEffect, useRef, useState } from 'react'
import { ROL_ADMIN } from '../auth/auth.js'

function iniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function Navbar({
  user,
  cartCount,
  onOpenLogin,
  onOpenRegister,
  onGoHome,
  onGoAdmin,
  onLogout,
}) {
  const [navOpen, setNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const cerrarSesion = () => {
    setMenuOpen(false)
    setNavOpen(false)
    onLogout()
  }

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar__inner">
          <p>Envío sin cargo en compras superiores a 150 €</p>
          <p className="topbar__right">3 y 6 cuotas sin interés · Devoluciones gratis</p>
        </div>
      </div>

      <nav className="navbar" aria-label="Principal">
        <div className="container navbar__inner">
          <a
            className="brand"
            href="#inicio"
            aria-label="Tienda Golf"
            onClick={() => {
              onGoHome()
              setNavOpen(false)
            }}
          >
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M10 4v24"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path d="M10 5h13.5l-3.2 4.6 3.2 4.6H10V5Z" fill="currentColor" />
                <ellipse cx="10" cy="29" rx="5.5" ry="1.8" fill="currentColor" />
              </svg>
            </span>
            <span className="brand__text">
              <strong>Tienda</strong>Golf
            </span>
          </a>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-controls="nav-links"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className="nav-toggle__bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="nav-toggle__label">Menú</span>
          </button>

          <ul
            id="nav-links"
            className={`nav-links${navOpen ? ' is-open' : ''}`}
          >
            <li>
              <a href="#inicio" onClick={() => setNavOpen(false)}>
                Inicio
              </a>
            </li>
            <li>
              <a href="#categorias" onClick={() => setNavOpen(false)}>
                Categorías
              </a>
            </li>
            <li>
              <a href="#destacados" onClick={() => setNavOpen(false)}>
                Destacados
              </a>
            </li>
            <li>
              <a href="#ofertas" onClick={() => setNavOpen(false)}>
                Ofertas
              </a>
            </li>
          </ul>

          <div className="nav-actions">
            <button type="button" className="cart-button" aria-label={`Carrito (${cartCount} productos)`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 4h2.2l2.1 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="20" r="1.4" fill="currentColor" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {user ? (
              <div className="user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="user-chip"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="user-chip__avatar" aria-hidden="true">
                    {iniciales(user.nombre)}
                  </span>
                  <span className="user-chip__text">
                    <small>{user.rol === ROL_ADMIN ? 'Administrador' : 'Cliente'}</small>
                    <strong>{user.nombre}</strong>
                  </span>
                  <svg className="user-chip__chevron" viewBox="0 0 12 12" aria-hidden="true">
                    <path
                      d="m3 4.5 3 3 3-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="user-dropdown" role="menu">
                    <p className="user-dropdown__email">{user.email}</p>
                    {user.rol === ROL_ADMIN && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          onGoAdmin()
                        }}
                      >
                        Panel de administración
                      </button>
                    )}
                    <button type="button" role="menuitem" onClick={cerrarSesion}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-actions">
                <button type="button" className="btn btn--ghost" onClick={onOpenLogin}>
                  Ingresar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onOpenRegister}
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
