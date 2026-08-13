-- Sistema GYG — Esquema local (SQLite)
-- Fase 1: stock de vehículos + autenticación básica del panel.
-- Columnas created_at / updated_at y tabla Meta quedan listas para
-- sincronización JSON/Gist en una fase posterior.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  rol           TEXT    NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Sesiones (
  token       TEXT PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
  creado_en   TEXT    NOT NULL DEFAULT (datetime('now')),
  expira_en   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON Sesiones (usuario_id);

CREATE TABLE IF NOT EXISTS Vehiculos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  marca         TEXT    NOT NULL,
  modelo        TEXT    NOT NULL,
  anio          INTEGER NOT NULL CHECK (anio >= 1900 AND anio <= 2100),
  dominio       TEXT    NOT NULL COLLATE NOCASE,
  kilometraje   INTEGER NOT NULL DEFAULT 0 CHECK (kilometraje >= 0),
  precio        REAL    NOT NULL CHECK (precio >= 0),
  moneda        TEXT    NOT NULL CHECK (moneda IN ('ARS', 'USD')),
  estado        TEXT    NOT NULL DEFAULT 'Disponible'
                  CHECK (estado IN ('Disponible', 'Reservado', 'Vendido')),
  imagenes_url  TEXT    NOT NULL DEFAULT '[]',
  notas         TEXT    NOT NULL DEFAULT '',
  eliminado     INTEGER NOT NULL DEFAULT 0 CHECK (eliminado IN (0, 1)),
  eliminado_en  TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Patente única entre los vehículos activos (los eliminados no bloquean
-- reutilizar la patente), sin distinguir mayúsculas/minúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehiculos_dominio
  ON Vehiculos (dominio COLLATE NOCASE)
  WHERE eliminado = 0;

CREATE INDEX IF NOT EXISTS idx_vehiculos_estado    ON Vehiculos (estado);
CREATE INDEX IF NOT EXISTS idx_vehiculos_marca     ON Vehiculos (marca);
CREATE INDEX IF NOT EXISTS idx_vehiculos_modelo    ON Vehiculos (modelo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_eliminado ON Vehiculos (eliminado);

-- Auditoría de cambios de estado (Disponible/Reservado/Vendido) por vehículo.
CREATE TABLE IF NOT EXISTS HistorialEstados (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculo_id     INTEGER NOT NULL REFERENCES Vehiculos(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo    TEXT    NOT NULL,
  usuario_id      INTEGER REFERENCES Usuarios(id) ON DELETE SET NULL,
  creado_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_historial_vehiculo ON HistorialEstados (vehiculo_id);

-- Clave/valor para configuración local y futura sync (gist_id, last_sync_at, etc.)
CREATE TABLE IF NOT EXISTS Meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT OR IGNORE INTO Meta (clave, valor) VALUES
  ('schema_version', '3'),
  ('last_sync_at', '');
