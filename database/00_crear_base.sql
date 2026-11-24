-- =====================================================================
-- Archivo: 00_crear_base.sql
-- Crea la base de datos utilizada por el backend. Ejecutar UNA vez.
-- Luego importar, en este orden:
--   1) Usuarios.sql
--   2) productos.sql
--   3) Proceso_Compra.sql
--   4) Administrador.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `ecommerce_golf`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `ecommerce_golf`;
