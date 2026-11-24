-- =====================================================================
-- Archivo: Proceso_Compra.sql
-- Motor   : InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Destino : MySQL 8.0+ / MariaDB 10.6+
-- Autor   : Arquitectura de Datos
-- Versión : 1.0.0
-- =====================================================================
-- !!! ADVERTENCIA DE DEPENDENCIAS !!!
-- Este script ASUME que las tablas `Usuarios` y `productos` YA EXISTEN
-- en la misma base de datos y con el mismo charset/collation:
--   * `Usuarios` (idUsuario INT UNSIGNED) → requerida por la FK
--     fk_proceso_compra_usuario.
--   * `productos` (idProductos INT UNSIGNED) → requerida por la FK
--     fk_detalle_compra_producto.
-- Si no existen, ejecutar primero Usuarios.sql y productos.sql.
-- =====================================================================
-- Notas de diseño:
--   * Se incluye `Detalle_Compra` porque el carrito NO puede modelarse
--     con una sola fila por transacción: un pedido contiene N productos
--     con cantidades y precios unitarios distintos. Guardar el detalle en
--     `Proceso_Compra` obligaría a desnormalizar (CSV/JSON), impidiendo
--     FKs, cálculo de subtotales y reportes por producto. `Importe` queda
--     como total consolidado del pedido.
--   * Los índices se declaran inline para mantener la idempotencia
--     (MySQL no soporta CREATE INDEX IF NOT EXISTS).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- DROP opcional — descomentar SOLO en entorno de pruebas/desarrollo.
-- Respetar el orden de dependencias: primero el detalle, luego la cabecera.
-- Destruye las tablas y todos sus datos.
-- ---------------------------------------------------------------------
-- DROP TABLE IF EXISTS `Detalle_Compra`;
-- DROP TABLE IF EXISTS `Proceso_Compra`;

-- ---------------------------------------------------------------------
-- Tabla: Proceso_Compra
-- Cabecera del carrito/pedido. Una fila por transacción:
--   Tipo='En proceso'  → carrito abierto (Estado_Pago='Pendiente', Entregado=0)
--   Tipo='Finalizada'  → checkout cerrado y pagado (con Fecha_Pago)
-- El soft state del carrito evita tablas temporales y permite auditar
-- carritos abandonados.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Proceso_Compra` (
  `idTransaccion`     INT UNSIGNED  NOT NULL AUTO_INCREMENT
                      COMMENT 'Identificador único de la transacción/pedido (PK, autoincremental)',

  `Tipo`              ENUM('Finalizada','En proceso') NOT NULL DEFAULT 'En proceso'
                      COMMENT 'Estado del flujo: "En proceso" = carrito abierto; "Finalizada" = checkout cerrado',

  `Importe`           DECIMAL(10,2) NOT NULL DEFAULT 0.00
                      COMMENT 'Importe total del pedido (suma de Detalle_Compra, ya con descuentos); >= 0',

  `idUsuario`         INT UNSIGNED  NOT NULL
                      COMMENT 'FK a Usuarios(idUsuario): dueño del carrito/pedido',

  `Entregado`         TINYINT(1)    NOT NULL DEFAULT 0
                      COMMENT '1 = pedido entregado; 0 = pendiente. Regla: solo un pedido "Finalizada" puede entregarse',

  `Estado_Pago`       ENUM('Pendiente','Pagado','Rechazado','Reembolsado') NOT NULL DEFAULT 'Pendiente'
                      COMMENT 'Situación del cobro: Pendiente, Pagado, Rechazado o Reembolsado',

  `Metodo_Pago`       ENUM('Tarjeta','Transferencia','Efectivo','MercadoPago') NULL DEFAULT NULL
                      COMMENT 'Medio de pago elegido; NULL mientras el carrito no llega al checkout',

  `Fecha_Transaccion` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                      COMMENT 'Fecha y hora de apertura del carrito / creación de la transacción',

  `Fecha_Pago`        DATETIME      NULL DEFAULT NULL
                      COMMENT 'Fecha y hora en que el pago fue confirmado; NULL si aún no se pagó',

  `Fecha_Entrega`     DATETIME      NULL DEFAULT NULL
                      COMMENT 'Fecha y hora de entrega efectiva; NULL si no se entregó',

  `Es_Black_Friday`   TINYINT(1)    NOT NULL DEFAULT 0
                      COMMENT '1 = la transacción aplicó campaña Black Friday; 0 = precio de lista',

  `Descuento_Aplicado` DECIMAL(10,2) NOT NULL DEFAULT 0.00
                      COMMENT 'Monto total descontado por campaña/oferta; >= 0 y nunca mayor que Importe',

  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                      COMMENT 'Fecha y hora de creación del registro (auditoría)',

  `updated_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                      COMMENT 'Fecha y hora de la última modificación del registro (auditoría)',

  -- ------------------------- Restricciones -------------------------
  PRIMARY KEY (`idTransaccion`),

  CONSTRAINT `chk_pc_importe`
    CHECK (`Importe` >= 0),

  CONSTRAINT `chk_pc_descuento`
    CHECK (`Descuento_Aplicado` >= 0 AND `Descuento_Aplicado` <= `Importe`),

  CONSTRAINT `chk_pc_entregado`
    CHECK (`Entregado` IN (0,1)),

  CONSTRAINT `chk_pc_black_friday`
    CHECK (`Es_Black_Friday` IN (0,1)),

  -- REGLA DE NEGOCIO: no se puede marcar Entregado=1 en un carrito
  -- todavía abierto (Tipo='En proceso'). Solo se entrega lo finalizado.
  CONSTRAINT `chk_pc_entrega_solo_finalizada`
    CHECK (`Tipo` = 'Finalizada' OR `Entregado` = 0),

  -- ---------------------------- Índices ----------------------------
  KEY `idx_usuario`         (`idUsuario`),
  KEY `idx_tipo`            (`Tipo`),
  KEY `idx_estado_pago`     (`Estado_Pago`),
  KEY `idx_entregado`       (`Entregado`),
  KEY `idx_black_friday`    (`Es_Black_Friday`),
  KEY `idx_usuario_tipo`    (`idUsuario`, `Tipo`),
  KEY `idx_tipo_entregado`  (`Tipo`, `Entregado`),

  -- ------------------------ Integridad referencial -----------------
  -- RESTRICT: nunca se borra físicamente un usuario con historial de compras
  -- (se usa la baja lógica Usuarios.Activo = 0).
  CONSTRAINT `fk_proceso_compra_usuario`
    FOREIGN KEY (`idUsuario`) REFERENCES `Usuarios` (`idUsuario`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Cabecera de carrito/compra: estado del flujo, pago, entrega, descuentos y Black Friday';

-- ---------------------------------------------------------------------
-- Tabla: Detalle_Compra
-- Líneas del carrito: qué producto, cuántas unidades y a qué precio.
-- Precio_Unitario se "congela" al momento de agregar/quitar del carrito
-- para no perder la foto histórica si el producto cambia de precio.
-- ON DELETE CASCADE: al eliminar una transacción (solo en pruebas) sus
-- líneas se eliminan para no dejar huérfanos.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Detalle_Compra` (
  `idDetalle`       INT UNSIGNED  NOT NULL AUTO_INCREMENT
                    COMMENT 'Identificador único de la línea de detalle (PK, autoincremental)',

  `idTransaccion`   INT UNSIGNED  NOT NULL
                    COMMENT 'FK a Proceso_Compra(idTransaccion): pedido al que pertenece la línea',

  `idProductos`     INT UNSIGNED  NOT NULL
                    COMMENT 'FK a productos(idProductos): artículo agregado al carrito',

  `Cantidad`        INT UNSIGNED  NOT NULL DEFAULT 1
                    COMMENT 'Unidades del producto en la línea; > 0',

  `Precio_Unitario` DECIMAL(10,2) NOT NULL
                    COMMENT 'Precio unitario congelado al momento de la compra (histórico, no se re-calcula)',

  `Subtotal`        DECIMAL(10,2) NOT NULL
                    COMMENT 'Cantidad * Precio_Unitario consolidado por la aplicación; >= 0',

  `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                    COMMENT 'Fecha y hora de creación de la línea (auditoría)',

  `updated_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    COMMENT 'Fecha y hora de la última modificación de la línea (auditoría)',

  -- ------------------------- Restricciones -------------------------
  PRIMARY KEY (`idDetalle`),

  CONSTRAINT `chk_dc_cantidad`
    CHECK (`Cantidad` > 0),

  CONSTRAINT `chk_dc_precio`
    CHECK (`Precio_Unitario` >= 0 AND `Subtotal` >= 0),

  -- ---------------------------- Índices ----------------------------
  KEY `idx_detalle_transaccion` (`idTransaccion`),
  KEY `idx_detalle_producto`    (`idProductos`),

  -- ------------------------ Integridad referencial -----------------
  CONSTRAINT `fk_detalle_compra_proceso`
    FOREIGN KEY (`idTransaccion`) REFERENCES `Proceso_Compra` (`idTransaccion`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT `fk_detalle_compra_producto`
    FOREIGN KEY (`idProductos`) REFERENCES `productos` (`idProductos`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Líneas de carrito/compra con precio unitario congelado y subtotal por producto';

-- ---------------------------------------------------------------------
-- Datos: este script solo define el esquema. Las compras y sus líneas
-- viven en la base del servidor (cursotesting.com.ar) y se gestionan
-- por la API.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Verificación opcional (descomentar):
-- SELECT pc.idTransaccion, pc.idUsuario, u.Apellido_y_Nombre, pc.Tipo,
--        pc.Importe, pc.Descuento_Aplicado, pc.Estado_Pago, pc.Entregado
--   FROM Proceso_Compra pc
--   JOIN Usuarios u ON u.idUsuario = pc.idUsuario
--  ORDER BY pc.idTransaccion;
--
-- SHOW INDEX FROM Proceso_Compra;
-- ---------------------------------------------------------------------
