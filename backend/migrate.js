// CREATE TABLE IF NOT EXISTS no agrega columnas a una base que ya existía.
// Estas migraciones cubren PCs que arrancaron con un esquema más viejo y
// después hicieron git pull.

function columnasDe(db, tabla) {
  return db.prepare(`PRAGMA table_info(${tabla})`).all().map((col) => col.name);
}

function tablasDe(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => row.name);
}

function ensureColumn(db, tabla, columna, definicion) {
  if (!tablasDe(db).includes(tabla)) return;
  if (!columnasDe(db, tabla).includes(columna)) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

function schemaVersion(db) {
  try {
    const row = db.prepare("SELECT valor FROM Meta WHERE clave = 'schema_version'").get();
    return Number(row && row.valor) || 0;
  } catch (_err) {
    return 0;
  }
}

const COLUMNAS_VEHICULOS = [
  ["precio_oferta", "REAL"],
  ["version", "TEXT NOT NULL DEFAULT ''"],
  ["combustible", "TEXT NOT NULL DEFAULT ''"],
  ["transmision", "TEXT NOT NULL DEFAULT ''"],
  ["traccion", "TEXT NOT NULL DEFAULT ''"],
  ["puertas", "INTEGER"],
  ["color", "TEXT NOT NULL DEFAULT ''"],
  ["motor", "TEXT NOT NULL DEFAULT ''"],
  ["potencia", "TEXT NOT NULL DEFAULT ''"],
  ["carroceria", "TEXT NOT NULL DEFAULT ''"],
  ["destacado", "INTEGER NOT NULL DEFAULT 0"],
  ["equipamiento", "TEXT NOT NULL DEFAULT '[]'"],
  ["eliminado", "INTEGER NOT NULL DEFAULT 0"],
  ["eliminado_en", "TEXT"],
  ["origen", "TEXT NOT NULL DEFAULT 'Compra'"],
  ["precio_compra", "REAL"],
  ["fecha_ingreso", "TEXT"],
];

function migrate(db) {
  for (const [columna, definicion] of COLUMNAS_VEHICULOS) {
    ensureColumn(db, "Vehiculos", columna, definicion);
  }
  ensureColumn(db, "Usuarios", "rol", "TEXT NOT NULL DEFAULT 'vendedor'");

  if (tablasDe(db).includes("Vehiculos")) {
    db.exec("CREATE INDEX IF NOT EXISTS idx_vehiculos_eliminado ON Vehiculos (eliminado)");
    if (columnasDe(db, "Vehiculos").includes("origen")) {
      db.exec("CREATE INDEX IF NOT EXISTS idx_vehiculos_origen ON Vehiculos (origen)");
    }
  }

  if (!tablasDe(db).includes("ConfiguracionSitio")) {
    db.exec(`
      CREATE TABLE ConfiguracionSitio (
        id          INTEGER PRIMARY KEY CHECK (id = 1),
        nombre      TEXT NOT NULL DEFAULT '',
        tagline     TEXT NOT NULL DEFAULT '',
        whatsapp    TEXT NOT NULL DEFAULT '',
        instagram   TEXT NOT NULL DEFAULT '',
        facebook    TEXT NOT NULL DEFAULT '',
        contacto_titulo TEXT NOT NULL DEFAULT 'Contactanos',
        contacto_texto  TEXT NOT NULL DEFAULT '',
        footer_text TEXT NOT NULL DEFAULT '',
        hero_image  TEXT NOT NULL DEFAULT '',
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO ConfiguracionSitio (id) VALUES (1);
    `);
  }

  ensureColumn(db, "ConfiguracionSitio", "instagram", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "ConfiguracionSitio", "facebook", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "ConfiguracionSitio", "contacto_titulo", "TEXT NOT NULL DEFAULT 'Contactanos'");
  ensureColumn(db, "ConfiguracionSitio", "contacto_texto", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "ConfiguracionSitio", "imgbb_api_key", "TEXT NOT NULL DEFAULT ''");

  if (!tablasDe(db).includes("Gastos")) {
    db.exec(`
      CREATE TABLE Gastos (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        vehiculo_id  INTEGER NOT NULL REFERENCES Vehiculos(id) ON DELETE CASCADE,
        concepto     TEXT    NOT NULL,
        monto        REAL    NOT NULL CHECK (monto >= 0),
        fecha        TEXT    NOT NULL DEFAULT (date('now')),
        created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_gastos_vehiculo ON Gastos (vehiculo_id);
    `);
  }

  if (!tablasDe(db).includes("Documentacion")) {
    db.exec(`
      CREATE TABLE Documentacion (
        id                       INTEGER PRIMARY KEY AUTOINCREMENT,
        vehiculo_id              INTEGER NOT NULL UNIQUE REFERENCES Vehiculos(id) ON DELETE CASCADE,
        tiene_08                 INTEGER NOT NULL DEFAULT 0 CHECK (tiene_08 IN (0, 1)),
        tiene_titulo             INTEGER NOT NULL DEFAULT 0 CHECK (tiene_titulo IN (0, 1)),
        verificacion_policial_vto TEXT,
        vtv_vencimiento          TEXT,
        updated_at               TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  if (!tablasDe(db).includes("Ventas")) {
    db.exec(`
      CREATE TABLE Ventas (
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
    `);
  }

  if (tablasDe(db).includes("Vehiculos") && columnasDe(db, "Vehiculos").includes("fecha_ingreso")) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_vehiculos_fecha_ingreso
      AFTER INSERT ON Vehiculos
      FOR EACH ROW
      WHEN NEW.fecha_ingreso IS NULL OR NEW.fecha_ingreso = ''
      BEGIN
        UPDATE Vehiculos SET fecha_ingreso = date('now') WHERE id = NEW.id;
      END;
    `);
  }

  if (schemaVersion(db) < 8) {
    db.exec(`
      UPDATE Vehiculos
         SET fecha_ingreso = date(created_at)
       WHERE fecha_ingreso IS NULL OR fecha_ingreso = ''
    `);
    db.prepare("INSERT OR REPLACE INTO Meta (clave, valor) VALUES ('schema_version', '8')").run();
  }
}

module.exports = {
  columnasDe,
  ensureColumn,
  schemaVersion,
  migrate,
  COLUMNAS_VEHICULOS,
};
