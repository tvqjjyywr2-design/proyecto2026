-- =====================================================================
-- Archivo: productos.sql
-- Motor   : InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Destino : MySQL 8.0+ / MariaDB 10.6+
-- Autor   : Ingeniería de Bases de Datos
-- Versión : 1.0.0
-- Notas   : Script idempotente. Los índices se declaran dentro del
--           CREATE TABLE para que una re-ejecución no falle con
--           "Duplicate key name" (1061).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- DROP opcional — descomentar SOLO en entorno de pruebas/desarrollo.
-- Destruye la tabla y todos sus datos.
-- ---------------------------------------------------------------------
-- DROP TABLE IF EXISTS `productos`;

-- ---------------------------------------------------------------------
-- Tabla: productos
-- Catálogo de prendas de vestir con precio de venta, descuento vigente,
-- stock disponible, marca, tallas (CSV) y segmento demográfico (Tipo).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `idProductos`        INT UNSIGNED  NOT NULL AUTO_INCREMENT
                       COMMENT 'Identificador único del producto (PK, autoincremental)',

  `Nombre_Corto`       VARCHAR(100)  NOT NULL
                       COMMENT 'Nombre comercial breve para listados y tickets (máx. 100)',

  `Descripcion`        TEXT          NULL
                       COMMENT 'Descripción larga del producto; NULL si no se ha capturado',

  `Precio`             DECIMAL(10,2) NOT NULL
                       COMMENT 'Precio de lista sin descuento, en moneda local; >= 0',

  `Porcentaje_Oferta`  DECIMAL(5,2)  NOT NULL DEFAULT 0.00
                       COMMENT 'Descuento vigente en porcentaje (0.00 a 100.00)',

  `Stock`              INT UNSIGNED  NOT NULL DEFAULT 0
                       COMMENT 'Unidades disponibles en inventario; UNSIGNED evita negativos',

  `Marca`              VARCHAR(80)   NOT NULL
                       COMMENT 'Marca o fabricante de la prenda',

  `Tallas`             VARCHAR(50)   NOT NULL
                       COMMENT 'Tallas disponibles en formato CSV, ej. "S,M,L,XL"',

  `Tipo`               ENUM('Infantil Niños','Infantil Niñas','Adulto Femenino','Adulto Masculino') NOT NULL
                       COMMENT 'Segmento demográfico del producto (4 categorías cerradas)',

  `Precio_Final`       DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(`Precio` * (1 - `Porcentaje_Oferta` / 100), 2)) STORED
                       COMMENT 'Columna calculada (STORED): Precio con Porcentaje_Oferta aplicado',

  `created_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de alta del registro',

  `updated_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de la última modificación del registro',

  -- ------------------------- Restricciones -------------------------
  PRIMARY KEY (`idProductos`),

  CONSTRAINT `chk_productos_precio`
    CHECK (`Precio` >= 0),

  CONSTRAINT `chk_productos_porcentaje_oferta`
    CHECK (`Porcentaje_Oferta` >= 0.00 AND `Porcentaje_Oferta` <= 100.00),

  -- ---------------------------- Índices ----------------------------
  KEY `idx_marca`       (`Marca`),
  KEY `idx_tipo`        (`Tipo`),
  KEY `idx_precio`      (`Precio`),
  KEY `idx_tipo_marca`  (`Tipo`, `Marca`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de productos textiles: precio, oferta, stock, marca, tallas y segmento';

-- ---------------------------------------------------------------------
-- Datos: este script solo define el esquema. Los registros reales viven
-- en la base del servidor (cursotesting.com.ar) y se gestionan por la API.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Verificación opcional (descomentar para comprobar descuentos):
-- SELECT idProductos, Nombre_Corto, Precio, Porcentaje_Oferta,
--        Precio_Final, Tipo, Marca
--   FROM productos
--  ORDER BY idProductos;
-- ---------------------------------------------------------------------
