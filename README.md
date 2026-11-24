# API Ecommerce Golf — Backend CRUD

API REST en **Node.js + Express 5 + MySQL/MariaDB** para las 5 tablas definidas en los scripts SQL del proyecto:

| Script SQL | Tablas |
|---|---|
| `Usuarios.sql` | `Usuarios` |
| `productos.sql` | `productos` |
| `Proceso_Compra.sql` | `Proceso_Compra`, `Detalle_Compra` |
| `Administrador.sql` | `Administrador` |

Cada tabla tiene su propio enrutador, controlador y conjunto de endpoints CRUD.

---

## 1. Estructura del proyecto

```
backendProyecto/
├── index.js                        # Servidor Express y montaje de rutas
├── database/00_crear_base.sql      # CREATE DATABASE
├── scripts/
│   ├── test-connection.js          # Test de conexión y conteo de tablas
│   ├── seed-test-data.js           # Carga de 10 registros de prueba por tabla
│   ├── test-utils.js               # Utilidades comunes de testing
│   ├── api-usuarios.test.js
│   ├── api-productos.test.js
│   ├── api-proceso-compra.test.js
│   ├── api-detalle-compra.test.js
│   ├── api-administrador.test.js
│   └── testing.txt                 # Alcance del suite de pruebas
├── src/
│   ├── config/db.js                # Pool de conexiones mysql2
│   ├── middlewares/errorHandler.js # 404 + traducción de errores MySQL
│   ├── utils/
│   │   ├── http.js                 # Errores, paginación, ORDER BY seguro
│   │   ├── validators.js           # Validaciones y normalización de datos
│   │   ├── password.js             # Hash bcrypt de contraseñas
│   │   └── records.js              # Búsqueda por PK / 404
│   ├── controllers/
│   │   ├── usuarios.controller.js
│   │   ├── productos.controller.js
│   │   ├── procesoCompra.controller.js
│   │   ├── detalleCompra.controller.js
│   │   └── administrador.controller.js
│   └── routes/
│       ├── usuarios.routes.js
│       ├── productos.routes.js
│       ├── procesoCompra.routes.js
│       ├── detalleCompra.routes.js
│       └── administrador.routes.js
├── .env                            # Configuración local (no subir a Git)
├── .env.example
└── package.json
```

---

## 2. Puesta en marcha

### Requisitos

- Node.js 18 o superior
- MySQL 8.0+ o MariaDB 10.6+

### Instalación

```bash
npm install
```

### Crear la base de datos e importar las tablas

Desde la raíz del proyecto, en el orden indicado (las FK dependen de ese orden):

```bash
mysql -u root -p -e "source database/00_crear_base.sql"
mysql -u root -p ecommerce_golf -e "source Usuarios.sql"
mysql -u root -p ecommerce_golf -e "source productos.sql"
mysql -u root -p ecommerce_golf -e "source Proceso_Compra.sql"
mysql -u root -p ecommerce_golf -e "source Administrador.sql"
```

> Si ya tenés la base creada con otro nombre, cambiá `DB_NAME` en `.env`.
> Los scripts son idempotentes y solo crean el esquema: los datos reales viven en el servidor de `cursotesting.com.ar`. Para generar datos de prueba locales usá `npm run db:seed`.

### Configurar `.env`

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ecommerce_golf
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
```

### Ejecutar

```bash
npm run dev     # node --watch (reinicio automático)
npm start       # producción
```

Comprobación rápida:

```bash
npm run db:test   # conexión + tablas + cantidad de registros
npm run db:seed   # carga 10 registros de prueba por tabla
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "database": "ecommerce_golf",
  "mysql": "8.0.xx",
  "timestamp": "2026-11-19T..."
}
```

---

## 3. Endpoints

| Recurso | Ruta base |
|---|---|
| Autenticación | `/api/auth` |
| Usuarios | `/api/usuarios` |
| Productos | `/api/productos` |
| Proceso de compra | `/api/proceso-compra` |
| Detalle de compra | `/api/detalle-compra` |
| Administradores | `/api/administradores` |

Cada recurso expone:

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/recurso` | Listar (paginado y con filtros) |
| `GET` | `/api/recurso/:id` | Obtener uno |
| `POST` | `/api/recurso` | Crear → `201` |
| `PUT` | `/api/recurso/:id` | Actualizar (campos enviados) |
| `PATCH` | `/api/recurso/:id` | Igual que `PUT` |
| `DELETE` | `/api/recurso/:id` | Eliminar → `204` |

### Autenticación

`POST /api/auth/login` valida las credenciales contra `Administrador` y, si el email no existe ahí, contra `Usuarios`.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin.prueba01@golfstore.com", "clave": "Prueba2026!" }'
```

Respuesta:

```json
{
  "data": {
    "id": 1,
    "nombre": "Acosta, Lucía",
    "email": "admin.prueba01@golfstore.com",
    "rol": "admin"
  }
}
```

- `rol` es `admin` (tabla `Administrador`) o `cliente` (tabla `Usuarios`).
- La contraseña se compara con bcrypt y `Clave` nunca se devuelve.
- `400` datos mal formados, `401` credenciales inválidas, `403` cuenta desactivada.
- El registro de clientes sigue siendo `POST /api/usuarios`; las claves duplicadas responden `409` con un mensaje específico (email, usuario o móvil).

### Paginación y orden

Todos los listados aceptan:

| Parámetro | Descripción |
|---|---|
| `page` | Página (desde 1, por defecto 1) |
| `limit` | Registros por página (1–100, por defecto 20) |
| `sort` | `campo`, `-campo` o `campo:desc` |

Ejemplo: `GET /api/productos?page=1&limit=10&sort=-Precio`

Respuesta de listado:

```json
{
  "data": [ ... ],
  "meta": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### Filtros por tabla

**Usuarios** — `activo`, `recibePublicidad`, `emailVerificado`, `q` (busca en nombre/email/usuario), `email`, `usuario`, `sort`.

**Productos** — `q` (nombre/descripción/marca), `tipo`, `marca`, `precioMin`, `precioMax`, `conStock`, `sort`.

**Proceso de compra** — `idUsuario`, `tipo`, `estadoPago`, `entregado`, `esBlackFriday`, `fechaDesde`, `fechaHasta`, `sort`.

**Detalle de compra** — `idTransaccion`, `idProductos`, `sort`.

**Administradores** — `rol`, `activo`, `q`, `sort`.

---

## 4. Campos aceptados en cada POST/PUT

### Usuarios

Obligatorios al crear: `Apellido_y_Nombre`, `Residencia`, `N_Movil`, `Email`, `Usuario`, `Clave`.

Opcionales: `Recibe_Publicidad`, `Fecha_Registracion`, `Email_Verificado`, `Activo`, `Ultimo_Acceso`.

- `Clave` se recibe en texto plano y se guarda como hash bcrypt (mínimo 6 caracteres, máximo 72 bytes).
- **Nunca** se devuelve `Clave` en las respuestas.
- Para dar de baja lógicamente: `PATCH /api/usuarios/1` con `{ "Activo": 0 }`.

### Productos

Obligatorios al crear: `Nombre_Corto`, `Precio`, `Marca`, `Tallas`, `Tipo`.

Opcionales: `Descripcion`, `Porcentaje_Oferta`, `Stock`.

- `Tipo` solo admite: `Infantil Niños`, `Infantil Niñas`, `Adulto Femenino`, `Adulto Masculino`.
- `Precio_Final` es columna generada (`STORED`): la calcula MySQL y no debe enviarse.
- `Porcentaje_Oferta` admite `0`–`100`.

### Proceso de compra

Obligatorio al crear: `idUsuario`.

Opcionales: `Tipo`, `Importe`, `Entregado`, `Estado_Pago`, `Metodo_Pago`, `Fecha_Transaccion`, `Fecha_Pago`, `Fecha_Entrega`, `Es_Black_Friday`, `Descuento_Aplicado`.

Reglas aplicadas en la API y en la base:

- Un pedido `En proceso` no puede tener `Entregado = 1`.
- `Descuento_Aplicado` no puede superar `Importe`.
- `Tipo`: `Finalizada` | `En proceso`.
- `Estado_Pago`: `Pendiente` | `Pagado` | `Rechazado` | `Reembolsado`.
- `Metodo_Pago`: `Tarjeta` | `Transferencia` | `Efectivo` | `MercadoPago` | `null`.

### Detalle de compra

Obligatorios al crear: `idTransaccion`, `idProductos`, `Precio_Unitario`.

Opcional: `Cantidad` (por defecto 1).

- `Subtotal` se calcula siempre en el servidor: `Cantidad × Precio_Unitario`.
- `Cantidad` debe ser mayor que 0.

### Administradores

Obligatorios al crear: `Apellido_y_Nombre`, `Email`, `N_Movil`, `Usuario`, `Clave`.

Opcionales: `Rol`, `Activo`, `Ultimo_Login`, `Intentos_Fallidos`.

- `Rol`: `SuperAdmin` | `Admin` | `Editor`.
- `Clave` se hashea y nunca se devuelve.

---

## 5. Ejemplos

### Crear un usuario

```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "Apellido_y_Nombre": "García, Sofía",
    "Residencia": "Av. Siempre Viva 742, CABA",
    "N_Movil": "+54 11 5555-8888",
    "Email": "sofia.garcia@example.com",
    "Usuario": "sgarcia",
    "Clave": "Secreta123",
    "Recibe_Publicidad": 1
  }'
```

### Listar productos con oferta y stock, ordenados por precio

```bash
curl "http://localhost:3000/api/productos?conStock=true&sort=-Precio&limit=5"
```

### Actualizar stock de un producto

```bash
curl -X PATCH http://localhost:3000/api/productos/1 \
  -H "Content-Type: application/json" \
  -d '{ "Stock": 95 }'
```

### Crear una transacción finalizada

```bash
curl -X POST http://localhost:3000/api/proceso-compra \
  -H "Content-Type: application/json" \
  -d '{
    "idUsuario": 1,
    "Tipo": "Finalizada",
    "Importe": 249.90,
    "Estado_Pago": "Pagado",
    "Metodo_Pago": "Tarjeta",
    "Fecha_Pago": "2026-11-19 10:30:00"
  }'
```

### Agregar una línea de detalle

```bash
curl -X POST http://localhost:3000/api/detalle-compra \
  -H "Content-Type: application/json" \
  -d '{
    "idTransaccion": 5,
    "idProductos": 1,
    "Cantidad": 2,
    "Precio_Unitario": 249.90
  }'
```

---

## 6. Errores

Formato uniforme:

```json
{ "error": "Mensaje legible", "details": "Detalle opcional de MySQL" }
```

| Código | Situación |
|---|---|
| `400` | Datos inválidos, campo faltante, regla de negocio incumplida |
| `404` | Recurso o ruta inexistente |
| `409` | Valor único duplicado, FK inexistente o registro con dependencias |
| `500` | Error inesperado del servidor |
| `503` | Base de datos no disponible |

Los errores de FK se traducen a mensajes claros, por ejemplo:

- Borrar un usuario con compras → `409` (la FK usa `ON DELETE RESTRICT`).
- Crear una compra con `idUsuario` inexistente → `409`.
- Borrar un producto usado en un detalle o actividad → `409`.

---

## 7. Decisiones de implementación

- **SQL parametrizado** en todas las consultas; los nombres de columnas usados en `ORDER BY` se validan contra una lista blanca.
- **Contraseñas** con `bcryptjs` (10 rondas por defecto, configurable con `BCRYPT_ROUNDS`).
- **`dateStrings: true`** para devolver fechas como `YYYY-MM-DD HH:MM:SS` sin corrimientos de zona horaria.
- **Validación en dos capas**: la API valida antes de consultar y MySQL vuelve a validar con sus `CHECK`/`FK`/`UNIQUE`.
- **Soft delete** de usuarios y administradores mediante el campo `Activo` (los `DELETE` físicos pueden fallar por FK, y es intencional).
- `PUT` y `PATCH` se comportan igual: actualización parcial de los campos enviados.

---

## 8. Datos de prueba

El script `scripts/seed-test-data.js` insertó **10 registros nuevos por tabla** en las 5 tablas existentes, conservando los datos previos:

| Tabla | Registros nuevos | Total actual |
|---|---:|---:|
| Administrador | 10 | 10 |
| Usuarios | 10 | 13 |
| productos | 10 | 15 |
| Proceso_Compra | 10 | 14 |
| Detalle_Compra | 10 | 10 |

- Usuarios de prueba: `prueba01` a `prueba10`
- Administradores de prueba: `adminprueba01` a `adminprueba10`
- Contraseña común: `Prueba2026!` (guardada como hash bcrypt)
- Los productos de prueba tienen el prefijo `Test ` en `Nombre_Corto`.
- Las compras de prueba tienen IDs `5` a `14` y sus detalles están asociados a ellas.
- La carga es transaccional: si falla un `INSERT`, no se guarda ningún registro.
- El script se niega a ejecutarse si detecta datos de prueba previamente cargados, para evitar duplicados por claves únicas.

---

## 9. Testing

El suite usa el runner nativo `node:test` y `fetch`, sin dependencias adicionales. Cada archivo levanta la API en un puerto efímero y ejecuta operaciones CRUD reales contra la base configurada en `.env`.

```bash
npm test                  # todos los archivos, en secuencia

npm run test:auth
npm run test:usuarios
npm run test:productos
npm run test:proceso-compra
npm run test:detalle-compra
npm run test:administrador
```

Cobertura:

- Login contra `Administrador` y `Usuarios`, con rechazo de credenciales inválidas y cuentas desactivadas.
- CRUD completo de `Usuarios`, `productos`, `Proceso_Compra`, `Detalle_Compra` y `Administrador`.
- Códigos `200`, `201`, `204`, `400`, `404`, `409` y `503`.
- Paginación, filtros, búsqueda y orden.
- Reglas de negocio, FK, UNIQUE y columnas calculadas (`Precio_Final`, `Subtotal`).

Los tests generan datos temporales con sufijos únicos y los eliminan en el hook `after()`. El alcance detallado está en `scripts/testing.txt`.

Resultado de la última ejecución:

```
tests 57
pass 57
fail 0
skipped 0
```


