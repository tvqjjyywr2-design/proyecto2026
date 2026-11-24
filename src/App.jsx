import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Categories from './components/Categories.jsx'
import ProductGrid from './components/ProductGrid.jsx'
import PromoBanner from './components/PromoBanner.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'
import AdminPage from './components/AdminPage.jsx'
import ProductModal from './components/ProductModal.jsx'
import {
  ROL_ADMIN,
  getSession,
  login,
  logout,
  register,
} from './auth/auth.js'
import { useProductos } from './hooks/useProductos.js'
import './App.css'

function App() {
  const [user, setUser] = useState(() => getSession())
  const [page, setPage] = useState(() =>
    getSession()?.rol === ROL_ADMIN ? 'admin' : 'home',
  )
  const [authMode, setAuthMode] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState('')
  const [detalleProducto, setDetalleProducto] = useState(null)

  const { productos, total, cargando, error, reintentar, reemplazarProducto } =
    useProductos()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const handleLogin = async (email, password) => {
    const result = await login(email, password)
    if (result.error) return result.error

    setUser(result.user)
    setAuthMode(null)
    setPage(result.user.rol === ROL_ADMIN ? 'admin' : 'home')
    setToast(
      result.user.rol === ROL_ADMIN
        ? 'Bienvenido, Administrador.'
        : `Hola ${result.user.nombre}, ¡buen golf!`,
    )
    return null
  }

  const handleRegister = async (datos) => {
    const result = await register(datos)
    if (result.error) return result.error

    setUser(result.user)
    setAuthMode(null)
    setPage('home')
    setToast(`¡Bienvenido, ${result.user.nombre}!`)
    return null
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setPage('home')
    setAuthMode(null)
    setDetalleProducto(null)
    setToast('Cerraste sesión correctamente.')
  }

  const handleAddToCart = (producto) => {
    setCartCount((count) => count + 1)
    setToast(`${producto.nombre} se agregó al carrito.`)
  }

  const showAdmin = page === 'admin' && user?.rol === ROL_ADMIN

  return (
    <>
      {showAdmin ? (
        <AdminPage
          user={user}
          productos={productos}
          cargando={cargando}
          error={error}
          onReintentar={reintentar}
          onProductoActualizado={reemplazarProducto}
          onBackToStore={() => setPage('home')}
          onLogout={handleLogout}
        />
      ) : (
        <div className="page">
          <Navbar
            user={user}
            cartCount={cartCount}
            onOpenLogin={() => setAuthMode('login')}
            onOpenRegister={() => setAuthMode('register')}
            onGoHome={() => setPage('home')}
            onGoAdmin={() => setPage('admin')}
            onLogout={handleLogout}
          />

          <main>
            <Hero productos={productos} total={total} cargando={cargando} />
            <Categories productos={productos} cargando={cargando} />
            <ProductGrid
              productos={productos}
              total={total}
              cargando={cargando}
              error={error}
              onReintentar={reintentar}
              onAddToCart={handleAddToCart}
              onVerDetalle={setDetalleProducto}
            />
            <PromoBanner onOpenRegister={() => setAuthMode('register')} />
          </main>

          <Footer productos={productos} />
        </div>
      )}

      {authMode && (
        <AuthModal
          key={authMode}
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {detalleProducto && (
        <ProductModal
          producto={detalleProducto}
          onClose={() => setDetalleProducto(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}

export default App
