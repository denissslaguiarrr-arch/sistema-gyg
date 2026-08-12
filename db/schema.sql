-- Sistema GYG — Esquema local (SQLite)
-- Fase 1: stock de vehículos. Columnas created_at / updated_at y tabla Meta
-- quedan listas para sincronización JSON/Gist en una fase posterior.

PRAGMA foreign_keys = ON;

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
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Patente única (comparación sin distinguir mayúsculas/minúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehiculos_dominio
  ON Vehiculos (dominio COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON Vehiculos (estado);
CREATE INDEX IF NOT EXISTS idx_vehiculos_marca  ON Vehiculos (marca);
CREATE INDEX IF NOT EXISTS idx_vehiculos_modelo ON Vehiculos (modelo);

-- Clave/valor para configuración local y futura sync (gist_id, last_sync_at, etc.)
CREATE TABLE IF NOT EXISTS Meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT OR IGNORE INTO Meta (clave, valor) VALUES
  ('schema_version', '1'),
  ('last_sync_at', '');
