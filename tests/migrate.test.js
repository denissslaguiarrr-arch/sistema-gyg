const test = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { tmpDbPath, limpiarArchivosDb } = require("./helpers");
const { migrate, columnasDe } = require("../backend/migrate");

const SCHEMA_VIEJO = `
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
`;

test("migrate agrega las columnas nuevas a una base vieja y permite guardar fotos", () => {
  const dbPath = tmpDbPath("migrate");
  const db = new Database(dbPath);
  try {
    db.exec(SCHEMA_VIEJO);
    assert.equal(columnasDe(db, "Vehiculos").includes("version"), false);
    assert.equal(columnasDe(db, "Vehiculos").includes("precio_oferta"), false);

    migrate(db);

    const columnas = columnasDe(db, "Vehiculos");
    assert.ok(columnas.includes("version"));
    assert.ok(columnas.includes("precio_oferta"));
    assert.ok(columnas.includes("destacado"));
    assert.ok(columnas.includes("equipamiento"));
    assert.ok(columnas.includes("eliminado"));

    const version = db.prepare("SELECT valor FROM Meta WHERE clave = 'schema_version'").get();
    assert.equal(version.valor, "7");
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("instagram"));
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("facebook"));

    const insertado = db
      .prepare(
        `INSERT INTO Vehiculos (
           marca, modelo, anio, dominio, kilometraje, precio, precio_oferta, moneda, estado,
           imagenes_url, notas, version, combustible, transmision, traccion, puertas, color,
           motor, potencia, carroceria, destacado, equipamiento
         ) VALUES (
           @marca, @modelo, @anio, @dominio, @kilometraje, @precio, @precio_oferta, @moneda, @estado,
           @imagenes_url, @notas, @version, @combustible, @transmision, @traccion, @puertas, @color,
           @motor, @potencia, @carroceria, @destacado, @equipamiento
         )`
      )
      .run({
        marca: "Toyota",
        modelo: "Hilux",
        anio: 2024,
        dominio: "MIG001",
        kilometraje: 0,
        precio: 45000,
        precio_oferta: 42000,
        moneda: "USD",
        estado: "Disponible",
        imagenes_url: JSON.stringify(["https://ejemplo.com/foto.jpg"]),
        notas: "",
        version: "",
        combustible: "",
        transmision: "",
        traccion: "",
        puertas: null,
        color: "",
        motor: "",
        potencia: "",
        carroceria: "",
        destacado: 0,
        equipamiento: "[]",
      });

    assert.ok(insertado.lastInsertRowid);
    const row = db.prepare("SELECT * FROM Vehiculos WHERE id = ?").get(insertado.lastInsertRowid);
    assert.equal(row.precio_oferta, 42000);
    assert.equal(JSON.parse(row.imagenes_url)[0], "https://ejemplo.com/foto.jpg");
  } finally {
    db.close();
    limpiarArchivosDb(dbPath);
  }
});
