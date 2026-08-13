const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_DIR = path.join(__dirname, "..", "db");
// Permite apuntar a una base aislada (ej. en los tests) sin tocar la de desarrollo.
const DB_PATH = process.env.GYG_DB_PATH || path.join(DB_DIR, "concesionaria.db");
const SCHEMA_PATH = path.join(DB_DIR, "schema.sql");

function openDatabase() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
  migrate(db);

  return db;
}

function columnasDe(db, tabla) {
  return db.prepare(`PRAGMA table_info(${tabla})`).all().map((col) => col.name);
}

function ensureColumn(db, tabla, columna, definicion) {
  if (!columnasDe(db, tabla).includes(columna)) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

function schemaVersion(db) {
  const row = db.prepare("SELECT valor FROM Meta WHERE clave = 'schema_version'").get();
  return Number(row && row.valor) || 0;
}

// CREATE TABLE IF NOT EXISTS no agrega columnas nuevas a una base ya creada.
// Las migraciones acá cubren PCs que ya tenían el stock cargado.
function migrate(db) {
  ensureColumn(db, "Vehiculos", "precio_oferta", "REAL");

  if (schemaVersion(db) < 5) {
    db.prepare("INSERT OR REPLACE INTO Meta (clave, valor) VALUES ('schema_version', '5')").run();
  }
}

const db = openDatabase();

module.exports = { db, DB_PATH };
