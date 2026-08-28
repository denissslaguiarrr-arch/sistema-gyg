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
    assert.ok(columnas.includes("origen"));
    assert.ok(columnas.includes("precio_compra"));
    assert.ok(columnas.includes("fecha_ingreso"));

    const version = db.prepare("SELECT valor FROM Meta WHERE clave = 'schema_version'").get();
    assert.equal(version.valor, "8");
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("instagram"));
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("facebook"));
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("imgbb_api_key"));
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("gist_id"));
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("github_token"));
    assert.ok(columnasDe(db, "ConfiguracionSitio").includes("direccion"));

    const tablas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name);
    assert.ok(tablas.includes("Gastos"));
    assert.ok(tablas.includes("Documentacion"));
    assert.ok(tablas.includes("Ventas"));

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
    assert.equal(row.origen, "Compra");
    assert.ok(row.fecha_ingreso);
    assert.equal(JSON.parse(row.imagenes_url)[0], "https://ejemplo.com/foto.jpg");
  } finally {
    db.close();
    limpiarArchivosDb(dbPath);
  }
});

test("migrate rellena fecha_ingreso desde created_at y acepta gastos, papeles y ventas", () => {
  const dbPath = tmpDbPath("migrate-erp");
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  try {
    db.exec(SCHEMA_VIEJO);
    db.exec(`
      INSERT INTO Vehiculos (
        marca, modelo, anio, dominio, kilometraje, precio, moneda, estado, created_at
      ) VALUES (
        'Ford', 'Ka', 2015, 'OLD001', 80000, 5000, 'USD', 'Disponible', '2025-01-10 08:00:00'
      )
    `);

    migrate(db);

    const viejo = db.prepare("SELECT origen, fecha_ingreso FROM Vehiculos WHERE dominio = 'OLD001'").get();
    assert.equal(viejo.origen, "Compra");
    assert.equal(viejo.fecha_ingreso, "2025-01-10");

    const id = db.prepare("SELECT id FROM Vehiculos WHERE dominio = 'OLD001'").get().id;

    db.prepare(
      `INSERT INTO Gastos (vehiculo_id, concepto, monto, fecha)
       VALUES (?, 'Cambio de correa', 120000, '2025-02-01')`
    ).run(id);
    db.prepare(
      `INSERT INTO Documentacion (vehiculo_id, tiene_08, tiene_titulo, vtv_vencimiento)
       VALUES (?, 1, 0, '2026-06-30')`
    ).run(id);
    db.prepare(
      `INSERT INTO Ventas (vehiculo_id, cliente_nombre, cliente_telefono, precio_venta_final, fecha_venta, fin_garantia)
       VALUES (?, 'Ana Pérez', '3735462914', 7800, '2026-03-01', '2026-06-01')`
    ).run(id);

    const gasto = db.prepare("SELECT concepto, monto FROM Gastos WHERE vehiculo_id = ?").get(id);
    assert.equal(gasto.concepto, "Cambio de correa");
    assert.equal(gasto.monto, 120000);

    const papeles = db.prepare("SELECT tiene_08, tiene_titulo, vtv_vencimiento FROM Documentacion WHERE vehiculo_id = ?").get(id);
    assert.equal(papeles.tiene_08, 1);
    assert.equal(papeles.tiene_titulo, 0);
    assert.equal(papeles.vtv_vencimiento, "2026-06-30");

    const venta = db.prepare("SELECT cliente_nombre, precio_venta_final FROM Ventas WHERE vehiculo_id = ?").get(id);
    assert.equal(venta.cliente_nombre, "Ana Pérez");
    assert.equal(venta.precio_venta_final, 7800);

    assert.throws(() => {
      db.prepare(
        `INSERT INTO Documentacion (vehiculo_id, tiene_08) VALUES (?, 1)`
      ).run(id);
    });
  } finally {
    db.close();
    limpiarArchivosDb(dbPath);
  }
});
