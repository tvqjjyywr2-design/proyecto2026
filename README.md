# Tienda Golf

Frontend del proyecto Tienda Golf, construido con React y Vite.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
npm install
```

## Configuración de la API

El catálogo, el login y el registro se consumen desde la API de `backendProyecto`.
La URL se configura con `VITE_API_URL` y por defecto es `http://localhost:3000/api`.

```bash
cp .env.example .env   # ajustá VITE_API_URL si la API corre en otro host
```

El backend debe estar corriendo y su `DB_HOST` apuntando al servidor MySQL real
(`cursotesting.com.ar`). No hay usuarios, productos ni credenciales de prueba en el frontend.

## MCP de GitHub (OpenCode)

`opencode.json` declara el servidor MCP remoto de GitHub (`mcp.servers.github`,
endpoint `https://api.githubcopilot.com/mcp/`) y toma la credencial **del archivo
`.github_token`**, que no se versiona:

```powershell
Copy-Item .github_token.example .github_token   # y pegá el token dentro
```

El archivo debe contener **solo** el token: `opencode.json` inserta su contenido tal cual
en `Authorization: Bearer ...`.

¿Por qué un archivo y no `.env`? OpenCode **no** lee los `.env` del proyecto; resuelve
`{env:VAR}` contra el entorno del proceso que lo inicia, y la app de escritorio no lo
hereda del proyecto. Con la variable vacía el header queda en `Bearer ` y la API responde
`400 Authorization header is badly formatted`. `{file:...}` sí lo lee OpenCode en cada
carga de configuración.

El token se genera en <https://github.com/settings/tokens> (classic) con los scopes
`repo`, `read:org` y `read:user`. Para verificar:

```powershell
opencode mcp list          # esperado: ✓ github  connected
```

Si cambiás el token, recargá la configuración con `/reload` (o reconectá desde `/mcps`):
la referencia al archivo se resuelve al cargar la configuración, no en cada request.

## Funcionalidades

- Catálogo real desde `GET /api/productos`, con categorías y conteos derivados de cada producto.
- Cada tarjeta abre un modal con la descripción ampliada (`Descripcion`) y las características del producto (tallas, stock, marca, categoría y precio final).
- Registro e inicio de sesión contra la API (`/api/usuarios` y `/api/auth/login`).
- Panel de administración para sesiones con rol `admin`: edita nombre, descripción ampliada, marca, tallas, categoría, precio, descuento y stock. Cada guardado usa `PATCH /api/productos/:id` y se refleja en la tienda.

## Desarrollo

```bash
npm run dev
```

El servidor se inicia en [http://localhost:3005](http://localhost:3005) y abre el navegador automáticamente.

## Otros scripts

```bash
npm run build    # Compila la aplicación para producción
npm run preview  # Sirve la compilación de producción en el puerto 3005
npm run lint     # Ejecuta Oxlint
```
