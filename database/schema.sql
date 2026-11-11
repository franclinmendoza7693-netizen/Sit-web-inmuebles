-- =====================================================================
-- InmoPredict — esquema de base de datos — dueño: Dev A
-- Motor: MariaDB de XAMPP (compatible con MySQL). Probado en MariaDB 10.x.
-- Los 3 integrantes usan XAMPP, para tener el mismo motor.
--
-- Cómo ejecutarlo (única forma de crear la BD en las 3 PCs):
--   phpMyAdmin → http://localhost/phpmyadmin → pestaña "Importar"
--   (SIN seleccionar ninguna base a la izquierda) → elegir este archivo → "Importar".
--   O desde el "Shell" del panel de XAMPP:  mysql -u root < ruta/al/repo/database/schema.sql
--
-- Cualquier cambio posterior va como archivo nuevo en database/migraciones/
-- Los nombres de tablas y columnas son los del contrato (secciones 3 y 4 del plan).
-- =====================================================================

-- ATENCIÓN: borra la BD local inmo_predict y la crea de cero (luego: npm run seed).
DROP DATABASE IF EXISTS inmo_predict;
CREATE DATABASE inmo_predict
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inmo_predict;

CREATE TABLE usuarios (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  dni             CHAR(8)      NOT NULL UNIQUE,
  nombres         VARCHAR(80)  NOT NULL,
  apellidos       VARCHAR(80)  NOT NULL,
  telefono        CHAR(9)      NULL,
  email           VARCHAR(120) NULL,
  password_hash   VARCHAR(255) NOT NULL,
  rol             ENUM('propietario','admin') NOT NULL DEFAULT 'propietario',
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inmuebles (
  id_inmueble          INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario           INT NOT NULL,
  titulo               VARCHAR(120) NOT NULL,
  descripcion          TEXT NULL,
  tipo_inmueble        ENUM('casa','departamento') NOT NULL,
  zona                 ENUM('centro','suburbio','rural') NOT NULL,
  region               VARCHAR(60)  NOT NULL,   -- "region" y no "departamento": evita chocar con tipo_inmueble
  provincia            VARCHAR(60)  NOT NULL,
  distrito             VARCHAR(60)  NOT NULL,
  direccion            VARCHAR(150) NULL,
  superficie_m2        DECIMAL(8,2) NOT NULL,
  num_habitaciones     TINYINT UNSIGNED  NOT NULL,
  anio_construccion    SMALLINT UNSIGNED NOT NULL,
  precio_estimado_usd  DECIMAL(12,2) NULL,      -- lo que dijo el modelo al publicar
  precio_venta_usd     DECIMAL(12,2) NOT NULL,  -- lo que pide el propietario
  version_modelo       VARCHAR(10)  NULL,
  estado               ENUM('publicado','pausado','vendido') NOT NULL DEFAULT 'publicado',
  fecha_publicacion    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inmuebles_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  INDEX idx_inmuebles_filtros (estado, tipo_inmueble, zona, precio_venta_usd)
);

CREATE TABLE fotos_inmueble (
  id_foto      INT AUTO_INCREMENT PRIMARY KEY,
  id_inmueble  INT NOT NULL,
  ruta         VARCHAR(255) NOT NULL,           -- ruta pública: /uploads/inmuebles/<archivo>
  orden        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_fotos_inmuebles FOREIGN KEY (id_inmueble)
    REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE
);

CREATE TABLE predicciones (
  id_prediccion        INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario           INT NOT NULL,
  superficie_m2        DECIMAL(8,2) NOT NULL,
  num_habitaciones     TINYINT UNSIGNED  NOT NULL,
  zona                 ENUM('centro','suburbio','rural') NOT NULL,
  anio_construccion    SMALLINT UNSIGNED NOT NULL,
  precio_estimado_usd  DECIMAL(12,2) NOT NULL,
  version_modelo       VARCHAR(10)  NOT NULL,
  fecha_prediccion     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_predicciones_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
