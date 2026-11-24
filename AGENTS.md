# Pautas de trabajo para este proyecto

Guía obligatoria para cualquier persona o agente de IA que modifique este repositorio.
Si algo de lo que sigue entra en conflicto con una instrucción puntual, avisá antes de romper la pauta.

---

## 1. Contexto del proyecto

Ecommerce de golf compuesto por dos proyectos hermanos:

```
proyectoFinal/
├── frontendProyecto/tiendagolf/   # SPA en React 19 + Vite 8
└── backendProyecto/               # API REST en Node.js + Express 5 + MySQL/MariaDB
```

- El **frontend** se encuentra en la carpeta `frontendProyecto/tiendagolf` y está desarrollado en **React.js**.
- Las **bases de datos y las APIs** se encuentran en la carpeta `backendProyecto`, y las **bases reales** en el servidor de https://cursotesting.com.ar.

---

## 2. Sobre las bases de datos

- Las bases de datos y las APIs se encuentran en la carpeta `backendProyecto`; las bases reales en el servidor de https://cursotesting.com.ar.
- **Si modificás una tabla, hacé copia del archivo `.sql` en la carpeta local `backendProyecto`.**
- Los scripts de esquema viven en `backendProyecto/`: `database/00_crear_base.sql`, `Usuarios.sql`, `productos.sql`, `Proceso_Compra.sql` y `Administrador.sql`.
- Respetá los nombres reales de tablas y columnas (`Usuarios`, `productos`, `Proceso_Compra`, `Detalle_Compra`, `Administrador`; `Nombre_Corto`, `Precio_Final`, etc.). No los "normalices" a camelCase: el frontend y la API dependen de esos nombres.
- Los cambios de esquema se aplican con el orden de dependencias (primero la base, después las tablas con claves foráneas) y se documentan en el `.sql` correspondiente.
- Las bases de datos están en MySql.

---

## 3. Sobre las buenas prácticas

### Separación de responsabilidades
Nunca mezcles la lógica de la base de datos con las rutas de Express ni con los componentes visuales de React.

En la práctica:

- **Backend**: `routes/` solo declara endpoints y delega; `controllers/` valida, orquesta y responde; `src/config/db.js` es el **único** punto de acceso a MySQL; `utils/` concentra validaciones, errores y helpers reutilizables. Un controlador nunca arma conexiones ni conoce credenciales.
- **Frontend**: los componentes de `src/components/` se ocupan de presentación e interacción. El acceso a datos va en módulos dedicados (`src/api/` para HTTP, `src/auth/` para sesión, `src/hooks/` para estado de carga), nunca con `fetch` suelto dentro de un componente.
- Si una pantalla necesita lógica de negocio, esa lógica va al backend, no al componente.

### Consultas preparadas (Prepared Statements)
Prohibido concatenar variables directamente en las consultas SQL. Siempre usá parámetros seguros para evitar inyecciones SQL.

- Correcto: `query('SELECT * FROM productos WHERE idProductos = ?', [id])`.
- Incorrecto: ``query(`SELECT * FROM productos WHERE idProductos = ${id}`)``.
- Los identificadores que no se pueden parametrizar (por ejemplo `ORDER BY`) se validan contra una **lista blanca**, como ya se hace en `src/utils/http.js`.
- Toda operación de varios pasos que deba ser atómica usa `withTransaction()`.

### Manejo de secretos
Las credenciales de base de datos, puertos y claves secretas van en archivos `.env` y nunca se suben a Git (`.gitignore`).

- Versioná únicamente `.env.example`; jamás `.env`, tokens, contraseñas ni cadenas de conexión reales.
- En el frontend, solo pueden exponerse variables con prefijo `VITE_` y siempre que no sean secretas (todo lo que llega al navegador es público).

### Validación de entradas
Validá siempre lo que el usuario envía, tanto en el frontend como en el backend.

- El backend es la autoridad final: no confíes en el cliente. Reutilizá los helpers de `src/utils/validators.js` (`ensureString`, `ensureDecimal`, `ensureInt`, `ensureEnum`, `ensureBoolean`, etc.).
- Validá también los parámetros de ruta y de query (`page`, `limit`, `sort`, filtros), no solo el body.
- Respondé con los códigos y el formato de error ya establecidos: `400` datos inválidos, `404` inexistente, `409` conflicto de unicidad o FK, `500` inesperado, `503` base no disponible.

### Consistencia de estilos
Mantené clases de CSS limpias, semánticas y bien estructuradas en archivos dedicados.

- Nombres en kebab-case y descriptivos por bloque (`.product-card`, `.promo-banner`); evitá estilos inline salvo valores dinámicos.
- Los estilos nuevos van en el archivo CSS del componente o en `App.css`/`index.css` según corresponda, no dentro del JSX.
- Reutilizá las variables de color y espaciado existentes antes de inventar nuevas.


---

## 4. Stack y estructura

### Frontend (`frontendProyecto/tiendagolf`)

```
src/
├── App.jsx            # composición de la página y estado global simple
├── main.jsx           # punto de entrada
├── auth/auth.js       # sesión y roles (login/registro contra la API)
├── api/               # cliente HTTP y una función por endpoint
├── hooks/             # estado de datos del catálogo (carga, error, reintento)
├── utils/             # formato de precios y presentación derivada de la base
└── components/        # Navbar, Hero, Categories, ProductGrid, ProductCard,
                       # PromoBanner, AuthModal, AdminPage, Footer
```

- React 19 + Vite 8, con **React Compiler** habilitado: no agregues `useMemo`/`useCallback` preventivos, medí primero.
- Linting con **oxlint** (`.oxlintrc.json`).
- Roles existentes: `admin` y `cliente` (`ROL_ADMIN`, `ROL_CLIENTE` en `src/auth/auth.js`).
- Utilizá los íconos de lucide-react.

### Backend (`backendProyecto`)

```
index.js                    # servidor Express y montaje de rutas
database/                   # creación de la base
src/config/db.js            # pool mysql2, query(), withTransaction()
src/controllers/            # lógica de cada recurso
src/routes/                 # definición de endpoints
src/middlewares/            # 404 y manejo centralizado de errores
src/utils/                  # http, validators, password, records
scripts/                    # seed y tests de API
*.sql                       # esquema y copias de las tablas
```

- CommonJS, `'use strict'` al inicio de cada archivo.
- Rutas base: `/api/usuarios`, `/api/productos`, `/api/proceso-compra`, `/api/detalle-compra`, `/api/administradores`.
- Respuestas exitosas: `{ "data": ... }` (los listados agregan `meta`). Errores: `{ "error": "...", "details": "..." }`.
- Contraseñas siempre con `bcryptjs` mediante `src/utils/password.js`; nunca se devuelven en las respuestas.
- Bajas lógicas de usuarios y administradores con el campo `Activo`; el `DELETE` físico puede fallar por FK y eso es intencional.

---

## 5. Comandos

| Dónde | Comando | Para qué |
|---|---|---|
| frontend | `npm run dev` | servidor de desarrollo Vite |
| frontend | `npm run build` | build de producción |
| frontend | `npm run lint` | oxlint |
| frontend | `npm run preview` | previsualizar el build |
| backend | `npm run dev` | API con `node --watch` |
| backend | `npm run db:test` | probar conexión y tablas |
| backend | `npm run db:seed` | cargar datos de prueba |
| backend | `npm test` | suite completa de la API |

Antes de dar una tarea por terminada: `npm run lint` en el frontend y `npm test` en el backend si tocaste la API.

---

## 6. Convenciones de código

- **Idioma**: identificadores técnicos en inglés (`list`, `create`, `buildData`); nombres de dominio tal como están en la base y textos visibles al usuario en español rioplatense.
- **Componentes**: funciones con nombre en PascalCase, archivo `PascalCase.jsx`, props explícitas. Nada de componentes anónimos ni lógica de datos embebida.
- **Imports**: relativos con extensión (`./components/Navbar.jsx`), igual que el código existente.
- **Comentarios**: solo cuando explican el *por qué* de una decisión no obvia; no narren lo que el código ya dice.
- **Estilo general**: código corto, funciones con una sola responsabilidad, sin duplicar constantes (roles, tipos de producto, estados de pago) — definilas una vez y reutilizalas.
- **Dependencias**: no agregues librerías nuevas sin necesidad real; si lo hacés, justificá el motivo y mantené el `package.json` ordenado.
- **Archivos generados**: nunca edites `node_modules/`, `dist/` ni `package-lock.json` a mano.

---

## 7. Notas de estado actual

- El frontend consume la API real: el catálogo se lee de `productos`, el login valida contra `Administrador` y `Usuarios`, y el registro crea una fila nueva en `Usuarios`. No hay productos, cuentas ni credenciales de prueba embebidas en el código.
- No hay tests automatizados en el frontend; si agregás lógica nueva no trivial, se espera al menos un test unitario.
