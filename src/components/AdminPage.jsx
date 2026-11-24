import { useState } from 'react'
import { actualizarProducto } from '../api/productos.js'
import { formatearPrecio } from '../utils/format.js'
import { TIPOS_PRODUCTO } from '../utils/producto.js'

function productoAFormulario(producto) {
  return {
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    marca: producto.marca,
    tallas: producto.tallas,
    tipo: producto.tipo,
    precio: String(producto.precio),
    descuento: String(producto.descuento),
    stock: String(producto.stock),
  }
}

function validar(form) {
  if (!form.nombre.trim() || form.nombre.trim().length > 100) {
    return 'El nombre debe tener entre 1 y 100 caracteres.'
  }
  if (form.descripcion.length > 65535) {
    return 'La descripción ampliada es demasiado larga.'
  }
  if (!form.marca.trim() || form.marca.trim().length > 80) {
    return 'La marca debe tener entre 1 y 80 caracteres.'
  }
  if (!form.tallas.trim() || form.tallas.trim().length > 50) {
    return 'Las tallas deben tener entre 1 y 50 caracteres.'
  }
  if (!TIPOS_PRODUCTO.includes(form.tipo)) {
    return 'Elegí una categoría válida.'
  }
  if (form.precio.trim() === '' || !Number.isFinite(Number(form.precio)) || Number(form.precio) < 0) {
    return 'El precio debe ser un número mayor o igual a 0.'
  }
  if (
    form.descuento.trim() === '' ||
    !Number.isFinite(Number(form.descuento)) ||
    Number(form.descuento) < 0 ||
    Number(form.descuento) > 100
  ) {
    return 'El descuento debe ser un número entre 0 y 100.'
  }
  if (
    form.stock.trim() === '' ||
    !Number.isInteger(Number(form.stock)) ||
    Number(form.stock) < 0
  ) {
    return 'El stock debe ser un número entero mayor o igual a 0.'
  }
  return ''
}

function AdminPage({
  user,
  productos,
  cargando,
  error,
  onReintentar,
  onProductoActualizado,
  onBackToStore,
  onLogout,
}) {
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const seleccionar = (producto) => {
    setSeleccionadoId(producto.id)
    setForm(productoAFormulario(producto))
    setMensaje({ tipo: '', texto: '' })
  }

  const update = (field) => (event) => {
    setForm((actual) => ({ ...actual, [field]: event.target.value }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    if (guardando || !form) return

    const errorValidacion = validar(form)
    if (errorValidacion) {
      setMensaje({ tipo: 'error', texto: errorValidacion })
      return
    }

    setGuardando(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      const actualizado = await actualizarProducto(seleccionadoId, {
        Nombre_Corto: form.nombre.trim(),
        Descripcion: form.descripcion.trim(),
        Marca: form.marca.trim(),
        Tallas: form.tallas.trim(),
        Tipo: form.tipo,
        Precio: Number(form.precio),
        Porcentaje_Oferta: Number(form.descuento),
        Stock: Number(form.stock),
      })

      onProductoActualizado(actualizado)
      setForm(productoAFormulario(actualizado))
      setMensaje({ tipo: 'ok', texto: 'Cambios guardados correctamente.' })
    } catch (fallo) {
      setMensaje({ tipo: 'error', texto: fallo.message })
    } finally {
      setGuardando(false)
    }
  }

  const precioEstimado =
    form && Number.isFinite(Number(form.precio))
      ? Math.round(
          Number(form.precio) * (1 - (Number(form.descuento) || 0) / 100) * 100,
        ) / 100
      : 0

  return (
    <main className="admin-panel">
      <header className="admin-panel__bar">
        <div>
          <span className="admin-page__tag">Panel de administración</span>
          <h1>Productos</h1>
          <p className="admin-panel__user">
            {user.nombre} · {user.email}
          </p>
        </div>
        <div className="admin-panel__actions">
          <button type="button" className="btn btn--outline" onClick={onBackToStore}>
            Volver a la tienda
          </button>
          <button type="button" className="btn btn--primary" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="container admin-panel__body">
        <section className="admin-panel__list" aria-label="Listado de productos">
          <div className="admin-panel__list-head">
            <h2>Catálogo ({productos.length})</h2>
            <button type="button" className="btn btn--ghost" onClick={onReintentar}>
              Actualizar
            </button>
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
            <p className="catalog-status">No hay productos cargados.</p>
          )}

          {!cargando && !error && productos.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Precio final</th>
                    <th scope="col">Stock</th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr
                      key={producto.id}
                      className={producto.id === seleccionadoId ? 'is-active' : ''}
                    >
                      <td>
                        <strong>{producto.nombre}</strong>
                        <small>{producto.marca}</small>
                      </td>
                      <td>{producto.tipo}</td>
                      <td>{formatearPrecio(producto.precioFinal)}</td>
                      <td>{producto.stock}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => seleccionar(producto)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel__editor" aria-label="Edición del producto">
          {!form ? (
            <p className="admin-panel__placeholder">
              Elegí un producto del listado para editar su descripción ampliada y sus
              características.
            </p>
          ) : (
            <form className="admin-form" onSubmit={guardar} noValidate>
              <h2>Editar producto</h2>

              <div className="admin-form__grid">
                <label className="field admin-form__full">
                  <span>Nombre corto</span>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.nombre}
                    onChange={update('nombre')}
                  />
                </label>

                <label className="field admin-form__full">
                  <span>Descripción ampliada</span>
                  <textarea
                    rows={6}
                    maxLength={65535}
                    placeholder="Contá las características del producto que verá el cliente en el detalle."
                    value={form.descripcion}
                    onChange={update('descripcion')}
                  />
                </label>

                <label className="field">
                  <span>Marca</span>
                  <input
                    type="text"
                    maxLength={80}
                    value={form.marca}
                    onChange={update('marca')}
                  />
                </label>

                <label className="field">
                  <span>Tallas</span>
                  <input
                    type="text"
                    maxLength={50}
                    value={form.tallas}
                    onChange={update('tallas')}
                  />
                </label>

                <label className="field">
                  <span>Categoría</span>
                  <select value={form.tipo} onChange={update('tipo')}>
                    {TIPOS_PRODUCTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Precio</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={update('precio')}
                  />
                </label>

                <label className="field">
                  <span>Descuento (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.descuento}
                    onChange={update('descuento')}
                  />
                </label>

                <label className="field">
                  <span>Stock</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={update('stock')}
                  />
                </label>
              </div>

              <p className="admin-form__hint">
                Precio final estimado: <strong>{formatearPrecio(precioEstimado)}</strong>. La
                base lo recalcula al guardar.
              </p>

              {mensaje.texto && (
                <p
                  className={`admin-form__message${
                    mensaje.tipo === 'ok' ? ' is-ok' : ' is-error'
                  }`}
                  role={mensaje.tipo === 'ok' ? 'status' : 'alert'}
                >
                  {mensaje.texto}
                </p>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--block"
                disabled={guardando}
              >
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default AdminPage
