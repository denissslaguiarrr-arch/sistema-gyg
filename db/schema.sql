-- Sistema G&G — Esquema local (SQLite)
-- Fase 1: stock + panel. Fase 2: sync Gist. schema_version 8: ERP
-- (origen/compra, gastos, documentación, ventas).
-- Fechas en TEXT ISO (YYYY-MM-DD o datetime('now')). Booleanos INTEGER 0/1.

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
  precio_oferta REAL    CHECK (precio_oferta IS NULL OR precio_oferta >= 0),
  moneda        TEXT    NOT NULL CHECK (moneda IN ('ARS', 'USD')),
  estado        TEXT    NOT NULL DEFAULT 'Disponible'
                  CHECK (estado IN ('Disponible', 'Reservado', 'Vendido')),
  imagenes_url  TEXT    NOT NULL DEFAULT '[]',
  notas         TEXT    NOT NULL DEFAULT '',
  -- Campos opcionales usados por la ficha pública / catálogo web (fase 2).
  version       TEXT    NOT NULL DEFAULT '',
  combustible   TEXT    NOT NULL DEFAULT '',
  transmision   TEXT    NOT NULL DEFAULT '',
  traccion      TEXT    NOT NULL DEFAULT '',
  puertas       INTEGER,
  color         TEXT    NOT NULL DEFAULT '',
  motor         TEXT    NOT NULL DEFAULT '',
  potencia      TEXT    NOT NULL DEFAULT '',
  carroceria    TEXT    NOT NULL DEFAULT '',
  destacado     INTEGER NOT NULL DEFAULT 0 CHECK (destacado IN (0, 1)),
  mostrar_precio INTEGER NOT NULL DEFAULT 0 CHECK (mostrar_precio IN (0, 1)),
  equipamiento  TEXT    NOT NULL DEFAULT '[]',
  -- Origen y costo de ingreso (ERP: compra / consignación / permuta).
  origen        TEXT    NOT NULL DEFAULT 'Compra'
                  CHECK (origen IN ('Compra', 'Consignación', 'Permuta')),
  precio_compra REAL    CHECK (precio_compra IS NULL OR precio_compra >= 0),
  fecha_ingreso TEXT    NOT NULL DEFAULT (date('now')),
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
-- idx_vehiculos_origen y el trigger de fecha_ingreso se crean en migrate.js
-- después de ALTER TABLE, para no romper bases que ya existían sin esas columnas.

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

-- Configuración del catálogo público (nombre, frase, WhatsApp, etc.),
-- publicada junto con los vehículos al sincronizar con el sitio web.
CREATE TABLE IF NOT EXISTS ConfiguracionSitio (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  nombre      TEXT NOT NULL DEFAULT '',
  tagline     TEXT NOT NULL DEFAULT '',
  whatsapp    TEXT NOT NULL DEFAULT '',
  instagram   TEXT NOT NULL DEFAULT '',
  facebook    TEXT NOT NULL DEFAULT '',
  contacto_titulo TEXT NOT NULL DEFAULT 'Contactanos',
  contacto_texto  TEXT NOT NULL DEFAULT '',
  direccion     TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '',
  hero_image  TEXT NOT NULL DEFAULT '',
  imgbb_api_key TEXT NOT NULL DEFAULT '',
  gist_id       TEXT NOT NULL DEFAULT '74837d1c1f0a9a3a67e6dc5cc4fa5b6f',
  github_token  TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO ConfiguracionSitio (id) VALUES (1);

-- Clave/valor para configuración local y futura sync (gist_id, last_sync_at, etc.)
CREATE TABLE IF NOT EXISTS Meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT OR IGNORE INTO Meta (clave, valor) VALUES
  ('schema_version', '8'),
  ('last_sync_at', '');

-- Reacondicionamiento y gestoría por unidad (ERP).
CREATE TABLE IF NOT EXISTS Gastos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculo_id  INTEGER NOT NULL REFERENCES Vehiculos(id) ON DELETE CASCADE,
  concepto     TEXT    NOT NULL,
  monto        REAL    NOT NULL CHECK (monto >= 0),
  fecha        TEXT    NOT NULL DEFAULT (date('now')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gastos_vehiculo ON Gastos (vehiculo_id);

-- Checklist de papeles y vencimientos (1 fila por vehículo).
CREATE TABLE IF NOT EXISTS Documentacion (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculo_id              INTEGER NOT NULL UNIQUE REFERENCES Vehiculos(id) ON DELETE CASCADE,
  tiene_08                 INTEGER NOT NULL DEFAULT 0 CHECK (tiene_08 IN (0, 1)),
  tiene_titulo             INTEGER NOT NULL DEFAULT 0 CHECK (tiene_titulo IN (0, 1)),
  verificacion_policial_vto TEXT,
  vtv_vencimiento          TEXT,
  updated_at               TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Cierre de venta: el estado del vehículo pasa a Vendido desde la API.
CREATE TABLE IF NOT EXISTS Ventas (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculo_id        INTEGER NOT NULL REFERENCES Vehiculos(id) ON DELETE CASCADE,
  cliente_nombre     TEXT    NOT NULL,
  cliente_telefono   TEXT    NOT NULL DEFAULT '',
  precio_venta_final REAL    NOT NULL CHECK (precio_venta_final >= 0),
  fecha_venta        TEXT    NOT NULL DEFAULT (date('now')),
  fin_garantia       TEXT,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ventas_vehiculo ON Ventas (vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON Ventas (fecha_venta);
