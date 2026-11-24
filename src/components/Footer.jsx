import { agruparPorTipo } from '../utils/producto.js'

function Footer({ productos = [] }) {
  const categorias = agruparPorTipo(productos)

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <p className="footer__logo">
            <strong>Tienda</strong>Golf
          </p>
          <p>
            Equipamiento de golf seleccionado por jugadores. Enviamos a todo el
            país y acompañamos cada swing.
          </p>
        </div>

        <div>
          <h3>Tienda</h3>
          <ul>
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <li key={categoria.tipo}>
                  <a href="#categorias">{categoria.tipo}</a>
                </li>
              ))
            ) : (
              <li><a href="#destacados">Catálogo</a></li>
            )}
            <li><a href="#destacados">Ofertas</a></li>
          </ul>
        </div>

        <div>
          <h3>Ayuda</h3>
          <ul>
            <li><a href="#inicio">Cómo comprar</a></li>
            <li><a href="#inicio">Envíos y entregas</a></li>
            <li><a href="#inicio">Cambios y devoluciones</a></li>
            <li><a href="#inicio">Preguntas frecuentes</a></li>
          </ul>
        </div>

        <div>
          <h3>Contacto</h3>
          <ul>
            <li>Av. del Golf 1420, Buenos Aires</li>
            <li>+54 11 5555-0198</li>
            <li>hola@tiendagolf.com</li>
            <li>Lun a Vie de 9 a 18 h</li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© 2026 Tienda Golf. Todos los derechos reservados.</p>
        <p>Términos y condiciones · Política de privacidad</p>
      </div>
    </footer>
  )
}

export default Footer
