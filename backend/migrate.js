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
];

function migrate(db) {
  for (const [columna, definicion] of COLUMNAS_VEHICULOS) {
    ensureColumn(db, "Vehiculos", columna, definicion);
  }
  ensureColumn(db, "Usuarios", "rol", "TEXT NOT NULL DEFAULT 'vendedor'");

  db.exec("CREATE INDEX IF NOT EXISTS idx_vehiculos_eliminado ON Vehiculos (eliminado)");

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

  if (schemaVersion(db) < 7) {
    db.prepare("INSERT OR REPLACE INTO Meta (clave, valor) VALUES ('schema_version', '7')").run();
  }
}

module.exports = {
  columnasDe,
  ensureColumn,
  schemaVersion,
  migrate,
  COLUMNAS_VEHICULOS,
};
