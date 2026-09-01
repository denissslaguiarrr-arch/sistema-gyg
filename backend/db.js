const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { migrate } = require("./migrate");

const DB_DIR = path.join(__dirname, "..", "db");
// Permite apuntar a una base aislada (ej. en los tests) sin tocar la de desarrollo.
const DB_PATH = process.env.GYG_DB_PATH || path.join(DB_DIR, "concesionaria.db");
const SCHEMA_PATH = path.join(DB_DIR, "schema.sql");

function tablaExiste(db, nombre) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(nombre)
  );
}

function openDatabase() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // CREATE TABLE IF NOT EXISTS no altera una tabla que ya existía. Si la PC
  // ya tenía concesionaria.db, hay que agregar columnas (origen, etc.) ANTES
  // de que schema.sql cree índices o triggers que las usan.
  if (tablaExiste(db, "Vehiculos")) {
    migrate(db);
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
  migrate(db);

  return db;
}

const db = openDatabase();

module.exports = { db, DB_PATH };
