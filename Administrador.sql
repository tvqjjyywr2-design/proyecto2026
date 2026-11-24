-- =====================================================================
-- Archivo: Administrador.sql
-- Motor   : InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Destino : MySQL 8.0+ / MariaDB 10.6+
-- Autor   : Arquitectura de Datos
-- Versión : 1.0.0
-- =====================================================================
-- Notas de diseño:
--   * `Administrador` está separada de `Usuarios`: son superficies de
--     ataque y ciclos de vida distintos (un admin jamás compra y un
--     cliente jamás publica productos).
--   * Los índices se declaran inline para mantener la idempotencia
--     (MySQL no soporta CREATE INDEX IF NOT EXISTS).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- DROP opcional — descomentar SOLO en entorno de pruebas/desarrollo.
-- Destruye la tabla y todos sus datos.
-- ---------------------------------------------------------------------
-- DROP TABLE IF EXISTS `Administrador`;

-- ---------------------------------------------------------------------
-- Tabla: Administrador
-- Cuentas del panel de administración. Credenciales SIEMPRE hasheadas.
-- Intentos_Fallidos habilita bloqueo temporal por fuerza bruta; Ultimo_Login
-- y los timestamps permiten auditar accesos.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Administrador` (
  `idAdministrador`    INT UNSIGNED  NOT NULL AUTO_INCREMENT
                       COMMENT 'Identificador único del administrador (PK, autoincremental)',

  `Apellido_y_Nombre`  VARCHAR(150)  NOT NULL
                       COMMENT 'Apellido y nombre del administrador ("Apellido, Nombre")',

  `Email`              VARCHAR(150)  NOT NULL
                       COMMENT 'Correo institucional único del administrador (case-insensitive)',

  `N_Movil`            VARCHAR(20)   NOT NULL
                       COMMENT 'Teléfono móvil único; admite +, espacios, guiones y paréntesis',

  `Usuario`            VARCHAR(50)   NOT NULL
                       COMMENT 'Nombre de usuario de login del panel (único, case-insensitive)',

  `Clave`              VARCHAR(255)  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                       COMMENT 'Hash bcrypt/argon2 — NUNCA almacenar texto plano. Collation binaria: verificar con password_verify en la aplicación',

  `Rol`                ENUM('SuperAdmin','Admin','Editor') NOT NULL DEFAULT 'Admin'
                       COMMENT 'Nivel de privilegios: SuperAdmin (total), Admin (gestión), Editor (contenido)',

  `Activo`             TINYINT(1)    NOT NULL DEFAULT 1
                       COMMENT '1 = cuenta habilitada; 0 = suspendida (baja lógica, no se borra)',

  `Ultimo_Login`       DATETIME      NULL DEFAULT NULL
                       COMMENT 'Fecha y hora del último login exitoso; NULL si nunca ingresó',

  `Intentos_Fallidos`  INT UNSIGNED  NOT NULL DEFAULT 0
                       COMMENT 'Contador de intentos de login fallidos consecutivos (anti fuerza bruta)',

  `created_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de creación del registro (auditoría)',

  `updated_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                       COMMENT 'Fecha y hora de la última modificación del registro (auditoría)',

  -- ------------------------- Restricciones -------------------------
  PRIMARY KEY (`idAdministrador`),

  CONSTRAINT `chk_admin_email`
    CHECK (`Email` LIKE '%@%.%'),

  CONSTRAINT `chk_admin_movil_formato`
    CHECK (`N_Movil` REGEXP '^[+0-9 ()-]+$' AND CHAR_LENGTH(`N_Movil`) BETWEEN 6 AND 20),

  CONSTRAINT `chk_admin_clave_hash`
    CHECK (CHAR_LENGTH(`Clave`) >= 60),

  CONSTRAINT `chk_admin_activo`
    CHECK (`Activo` IN (0,1)),

  -- ---------------------------- Índices ----------------------------
  -- Unicidad + búsqueda de login sin duplicar índices:
  UNIQUE KEY `idx_admin_email`    (`Email`),
  UNIQUE KEY `idx_admin_usuario`  (`Usuario`),
  UNIQUE KEY `uk_admin_movil`     (`N_Movil`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Cuentas del panel de administración: rol, estado, bloqueo por intentos y último acceso';

-- ---------------------------------------------------------------------
-- Datos: este script solo define el esquema. Los registros reales viven
-- en la base del servidor (cursotesting.com.ar) y se gestionan por la API.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Verificación opcional (descomentar):
-- SELECT idAdministrador, Apellido_y_Nombre, Email, Rol, Activo
--   FROM Administrador
--  ORDER BY idAdministrador;
-- ---------------------------------------------------------------------
