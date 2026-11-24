-- =====================================================================
-- Archivo: Usuarios.sql
-- Motor   : InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Destino : MySQL 8.0+ / MariaDB 10.6+
-- Autor   : Ingeniería de Bases de Datos
-- Versión : 1.0.0
-- Notas   : Script idempotente. Los índices se declaran dentro del
--           CREATE TABLE para que una re-ejecución no falle con
--           "Duplicate key name" (1061).
--           Los UNIQUE de Email y Usuario se nombran idx_email e
--           idx_usuario: cumplen la unicidad y sirven la búsqueda de
--           login sin crear índices duplicados.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- DROP opcional — descomentar SOLO en entorno de pruebas/desarrollo.
-- Destruye la tabla y todos sus datos.
-- ---------------------------------------------------------------------
-- DROP TABLE IF EXISTS `Usuarios`;

-- ---------------------------------------------------------------------
-- Tabla: Usuarios
-- Cuentas de acceso a la aplicación. Las credenciales se almacenan
-- exclusivamente como hash bcrypt/argon2; el soft delete se resuelve
-- con la bandera Activo y la segmentación de campañas con
-- Recibe_Publicidad.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Usuarios` (
  `idUsuario`          INT UNSIGNED  NOT NULL AUTO_INCREMENT
                       COMMENT 'Identificador único del usuario (PK, autoincremental)',

  `Apellido_y_Nombre`  VARCHAR(150)  NOT NULL
                       COMMENT 'Apellido y nombre completo en formato "Apellido, Nombre"',

  `Residencia`         VARCHAR(150)  NOT NULL
                       COMMENT 'Domicilio declarado por el usuario (calle, número, ciudad)',

  `N_Movil`            VARCHAR(20)   NOT NULL
                       COMMENT 'Teléfono móvil con prefijo; admite +, espacios, guiones y paréntesis',

  `Email`              VARCHAR(150)  NOT NULL
                       COMMENT 'Correo electrónico de contacto y recuperación (único, case-insensitive)',

  `Usuario`            VARCHAR(50)   NOT NULL
                       COMMENT 'Nombre de usuario de login (único, case-insensitive)',

  `Clave`              VARCHAR(255)  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                       COMMENT 'Hash bcrypt/argon2 — NUNCA almacenar texto plano. Collation binaria: la comparación debe hacerse en la aplicación (password_verify)',

  `Recibe_Publicidad`  TINYINT(1)    NOT NULL DEFAULT 0
                       COMMENT '1 = acepta recibir publicidad por correo; 0 = no acepta (opt-in)',

  `Fecha_Registracion` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de alta de la cuenta',

  `Email_Verificado`   TINYINT(1)    NOT NULL DEFAULT 0
                       COMMENT '1 = correo confirmado por el usuario; 0 = pendiente de verificación',

  `Activo`             TINYINT(1)    NOT NULL DEFAULT 1
                       COMMENT '1 = cuenta habilitada; 0 = baja lógica (soft delete), sin borrado físico',

  `Ultimo_Acceso`      DATETIME      NULL DEFAULT NULL
                       COMMENT 'Última autenticación exitosa; NULL si nunca ingresó',

  `created_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de creación del registro (auditoría)',

  `updated_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de la última modificación del registro (auditoría)',

  -- ------------------------- Restricciones -------------------------
  PRIMARY KEY (`idUsuario`),

  CONSTRAINT `chk_usuarios_email`
    CHECK (`Email` LIKE '%@%.%'),

  CONSTRAINT `chk_usuarios_movil_formato`
    CHECK (`N_Movil` REGEXP '^[+0-9 ()-]+$' AND CHAR_LENGTH(`N_Movil`) BETWEEN 6 AND 20),

  CONSTRAINT `chk_usuarios_clave_hash`
    CHECK (CHAR_LENGTH(`Clave`) >= 60),

  CONSTRAINT `chk_usuarios_recibe_publicidad`
    CHECK (`Recibe_Publicidad` IN (0,1)),

  CONSTRAINT `chk_usuarios_email_verificado`
    CHECK (`Email_Verificado` IN (0,1)),

  CONSTRAINT `chk_usuarios_activo`
    CHECK (`Activo` IN (0,1)),

  -- ---------------------------- Índices ----------------------------
  -- Unicidad + índice de búsqueda en una sola estructura:
  UNIQUE KEY `idx_email`    (`Email`),
  UNIQUE KEY `idx_usuario`  (`Usuario`),
  UNIQUE KEY `uk_n_movil`   (`N_Movil`),

  -- Segmentación de campañas:
  KEY `idx_recibe_publicidad`  (`Recibe_Publicidad`),
  KEY `idx_activo`             (`Activo`),
  KEY `idx_publicidad_activo`  (`Recibe_Publicidad`, `Activo`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Cuentas de usuario: credenciales hasheadas, contacto, opt-in de publicidad y baja lógica';

-- ---------------------------------------------------------------------
-- Datos: este script solo define el esquema. Los registros reales viven
-- en la base del servidor (cursotesting.com.ar) y se gestionan por la API.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Verificación opcional (descomentar):
-- SELECT idUsuario, Apellido_y_Nombre, Email, Recibe_Publicidad, Activo
--   FROM Usuarios
--  ORDER BY idUsuario;
--
-- SHOW INDEX FROM Usuarios;
-- ---------------------------------------------------------------------
