import { useEffect, useId, useRef, useState } from 'react'

const FORM_INICIAL = {
  nombre: '',
  email: '',
  usuario: '',
  telefono: '',
  residencia: '',
  password: '',
  publicidad: false,
}

function validarLogin(form) {
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Ingresá un email válido.'
  if (!form.password) return 'Ingresá tu contraseña.'
  return ''
}

function validarRegistro(form) {
  if (form.nombre.trim().length < 2) return 'Ingresá tu nombre completo.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Ingresá un email válido.'
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(form.usuario.trim())) {
    return 'El usuario debe tener entre 3 y 50 caracteres sin espacios.'
  }
  if (!/^[+0-9 ()-]{6,20}$/.test(form.telefono.trim())) {
    return 'Ingresá un teléfono válido (números, espacios, +, guiones o paréntesis).'
  }
  if (form.residencia.trim().length < 3) return 'Ingresá tu ciudad o dirección.'
  if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  return ''
}

function AuthModal({ mode, onClose, onSwitchMode, onLogin, onRegister }) {
  const isLogin = mode === 'login'
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const firstFieldRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (enviando) return

    setError('')
    const validacion = isLogin ? validarLogin(form) : validarRegistro(form)
    if (validacion) {
      setError(validacion)
      return
    }

    setEnviando(true)
    try {
      const respuesta = isLogin
        ? await onLogin(form.email.trim(), form.password)
        : await onRegister({
            nombre: form.nombre.trim(),
            email: form.email.trim(),
            usuario: form.usuario.trim(),
            telefono: form.telefono.trim(),
            residencia: form.residencia.trim(),
            clave: form.password,
            publicidad: form.publicidad,
          })

      if (respuesta) setError(respuesta)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <span className="eyebrow">{isLogin ? 'Bienvenido de nuevo' : 'Sumate al club'}</span>
        <h2 id={titleId}>{isLogin ? 'Ingresar a tu cuenta' : 'Crear una cuenta'}</h2>
        <p className="modal__subtitle">
          {isLogin
            ? 'Accedé para ver tus pedidos y finalizar compras más rápido.'
            : 'Registrate y obtené 10% OFF en tu primera compra.'}
        </p>

        <form className="auth-form" onSubmit={submit} aria-busy={enviando} noValidate>
          {!isLogin && (
            <label className="field">
              <span>Nombre completo</span>
              <input
                ref={firstFieldRef}
                type="text"
                name="nombre"
                autoComplete="name"
                maxLength={150}
                placeholder="Marco Pérez"
                value={form.nombre}
                onChange={update('nombre')}
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              ref={isLogin ? firstFieldRef : undefined}
              type="email"
              name="email"
              autoComplete="email"
              maxLength={150}
              placeholder="vos@email.com"
              value={form.email}
              onChange={update('email')}
            />
          </label>

          {!isLogin && (
            <>
              <label className="field">
                <span>Nombre de usuario</span>
                <input
                  type="text"
                  name="usuario"
                  autoComplete="username"
                  maxLength={50}
                  placeholder="marcoperez"
                  value={form.usuario}
                  onChange={update('usuario')}
                />
              </label>

              <label className="field">
                <span>Teléfono móvil</span>
                <input
                  type="tel"
                  name="telefono"
                  autoComplete="tel"
                  maxLength={20}
                  placeholder="+54 11 5555-1234"
                  value={form.telefono}
                  onChange={update('telefono')}
                />
              </label>

              <label className="field">
                <span>Ciudad o dirección</span>
                <input
                  type="text"
                  name="residencia"
                  autoComplete="street-address"
                  maxLength={150}
                  placeholder="Av. Siempre Viva 742, CABA"
                  value={form.residencia}
                  onChange={update('residencia')}
                />
              </label>
            </>
          )}

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              maxLength={72}
              placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
              value={form.password}
              onChange={update('password')}
            />
          </label>

          {!isLogin && (
            <label className="field field--check">
              <input
                type="checkbox"
                name="publicidad"
                checked={form.publicidad}
                onChange={(event) =>
                  setForm((current) => ({ ...current, publicidad: event.target.checked }))
                }
              />
              <span>Quiero recibir novedades y ofertas por email.</span>
            </label>
          )}

          {error && (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--block"
            disabled={enviando}
          >
            {enviando
              ? isLogin
                ? 'Ingresando…'
                : 'Creando cuenta…'
              : isLogin
                ? 'Ingresar'
                : 'Crear cuenta'}
          </button>
        </form>

        <p className="modal__switch">
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            type="button"
            onClick={() => onSwitchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? 'Registrate' : 'Ingresá'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthModal
