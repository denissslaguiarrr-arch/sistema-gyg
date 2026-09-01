const test = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { tmpDbPath, limpiarArchivosDb } = require("./helpers");

const dbPath = tmpDbPath("db-open-old");
process.env.GYG_DB_PATH = dbPath;

const seed = new Database(dbPath);
seed.exec(`
CREATE TABLE Vehiculos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  marca         TEXT    NOT NULL,
  modelo        TEXT    NOT NULL,
  anio          INTEGER NOT NULL,
  dominio       TEXT    NOT NULL,
  kilometraje   INTEGER NOT NULL DEFAULT 0,
  precio        REAL    NOT NULL,
  moneda        TEXT    NOT NULL,
  estado        TEXT    NOT NULL DEFAULT 'Disponible',
  imagenes_url  TEXT    NOT NULL DEFAULT '[]',
  notas         TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE Meta (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
INSERT INTO Meta (clave, valor) VALUES ('schema_version', '1');
INSERT INTO Vehiculos (marca, modelo, anio, dominio, precio, moneda)
VALUES ('Ford', 'Ka', 2015, 'OLD001', 5000, 'USD');
`);
seed.close();

const { db } = require("../backend/db");

test.after(() => {
  db.close();
  limpiarArchivosDb(dbPath);
});

test("abrir una base vieja agrega origen sin SqliteError", () => {
  const columnas = db.prepare("PRAGMA table_info(Vehiculos)").all().map((col) => col.name);
  assert.ok(columnas.includes("origen"));
  assert.ok(columnas.includes("precio_compra"));
  assert.ok(columnas.includes("fecha_ingreso"));

  const row = db.prepare("SELECT origen, dominio FROM Vehiculos WHERE dominio = 'OLD001'").get();
  assert.equal(row.dominio, "OLD001");
  assert.equal(row.origen, "Compra");
});
