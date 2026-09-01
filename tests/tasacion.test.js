const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");
const {
  analizarUso,
  estimarPrecio,
  buscarEnGuia,
  leerConfig,
  CONFIG_DEFAULT,
} = require("../backend/utils/tasacion");

test("Hilux 2015 con 100 mil km queda más fresco que el promedio", () => {
  const uso = analizarUso({
    anio: 2015,
    km: 100000,
    anioActual: 2026,
    config: CONFIG_DEFAULT,
  });
  assert.equal(uso.banda, "fresco");
  assert.equal(uso.anios_uso, 11);
  assert.equal(uso.km_anio, 9091);
  assert.ok(uso.km_esperado > 100000);
});

test("muchos km por año marca el auto como más usado", () => {
  const uso = analizarUso({
    anio: 2020,
    km: 180000,
    anioActual: 2026,
    config: CONFIG_DEFAULT,
  });
  assert.equal(uso.banda, "usado");
});

test("el número para decirle queda debajo de revista y tiene rango", () => {
  const estimado = estimarPrecio({
    precioRevista: 20000,
    moneda: "USD",
    anio: 2015,
    km: 100000,
    estado: "Bueno",
    anioActual: 2026,
    config: CONFIG_DEFAULT,
  });
  assert.equal(estimado.uso.banda, "fresco");
  assert.ok(estimado.decirle < 20000);
  assert.ok(estimado.rango_min < estimado.decirle);
  assert.ok(estimado.rango_max > estimado.decirle);
  assert.equal(estimado.moneda, "USD");
});

test("buscarEnGuia pide versión si hay dos precios distintos", () => {
  const filas = [
    { marca: "Toyota", modelo: "Hilux", version: "DX", anio: 2015, precio_revista: 15000, moneda: "USD", edicion: "2026-08" },
    { marca: "Toyota", modelo: "Hilux", version: "SRV 4x4", anio: 2015, precio_revista: 18500, moneda: "USD", edicion: "2026-08" },
  ];
  const varias = buscarEnGuia(filas, { marca: "Toyota", modelo: "Hilux", anio: 2015, version: "" });
  assert.equal(varias.necesita_version, true);
  assert.equal(varias.encontrados.length, 2);

  const una = buscarEnGuia(filas, { marca: "Toyota", modelo: "Hilux SRV", anio: 2015, version: "" });
  assert.equal(una.necesita_version, false);
  assert.equal(una.encontrados[0].version, "SRV 4x4");
});

test("leerConfig acepta el porcentaje de revista en 90 o 0.9", () => {
  assert.equal(leerConfig({ margen_medio: 90 }).margen_medio, 0.9);
  assert.equal(leerConfig({ margen_medio: 0.88 }).margen_medio, 0.88);
});

const dbPath = tmpDbPath("tasacion");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookieAdmin;
let cookieVendedor;

async function login(username, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(res.status, 200);
  return extraerCookie(res);
}

function conCookie(cookie) {
  return { "Content-Type": "application/json", Cookie: cookie };
}

test.before(async () => {
  ensureDefaultAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  cookieAdmin = await login("admin", "clave-admin-123");

  const crearVendedor = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({ username: "vendedor-tasacion", password: "clave-vendedor-123", rol: "vendedor" }),
  });
  assert.equal(crearVendedor.status, 201);
  cookieVendedor = await login("vendedor-tasacion", "clave-vendedor-123");
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

test("sin guía el tasador avisa y no inventa un precio", async () => {
  const res = await fetch(`${baseUrl}/api/tasacion/estimar`, {
    method: "POST",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({ marca: "Toyota", modelo: "Hilux", anio: 2015, km: 100000, estado: "Bueno" }),
  });
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.match(data.error, /encargado/i);
});

test("el encargado carga un auto y el vendedor obtiene un número", async () => {
  const alta = await fetch(`${baseUrl}/api/tasacion/guia`, {
    method: "POST",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({
      marca: "Toyota",
      modelo: "Hilux",
      version: "SRV 4x4",
      anio: 2015,
      precio_revista: 18500,
      moneda: "USD",
      edicion: "2026-08",
    }),
  });
  assert.equal(alta.status, 201);

  const vendedorNoCarga = await fetch(`${baseUrl}/api/tasacion/guia`, {
    method: "POST",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({
      marca: "Ford", modelo: "Ranger", anio: 2018, precio_revista: 20000, moneda: "USD",
    }),
  });
  assert.equal(vendedorNoCarga.status, 403);

  const estimado = await fetch(`${baseUrl}/api/tasacion/estimar`, {
    method: "POST",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({
      marca: "Toyota",
      modelo: "Hilux",
      anio: 2015,
      km: 100000,
      estado: "Bueno",
    }),
  });
  assert.equal(estimado.status, 200);
  const data = await estimado.json();
  assert.equal(data.ok, true);
  assert.equal(data.estimado.moneda, "USD");
  assert.ok(data.estimado.decirle > 0);
  assert.ok(data.estimado.decirle < 18500);
  assert.equal(data.estimado.uso.banda, "fresco");
});

test("el CSV de la guía reemplaza el mes y el vendedor no puede importarlo", async () => {
  const csv = "marca,modelo,version,anio,precio_revista,moneda,edicion\nVolkswagen,Amarok,Highline,2018,22000,USD,2026-08\n";
  const form = new FormData();
  form.append("archivo", new Blob([csv], { type: "text/csv" }), "guia.csv");

  const vendedor = await fetch(`${baseUrl}/api/tasacion/guia/import`, {
    method: "POST",
    headers: { Cookie: cookieVendedor },
    body: form,
  });
  assert.equal(vendedor.status, 403);

  const adminForm = new FormData();
  adminForm.append("archivo", new Blob([csv], { type: "text/csv" }), "guia.csv");
  const admin = await fetch(`${baseUrl}/api/tasacion/guia/import`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
    body: adminForm,
  });
  assert.equal(admin.status, 200);
  const data = await admin.json();
  assert.equal(data.creados, 1);
  assert.equal(data.total, 1);

  const amarok = await fetch(`${baseUrl}/api/tasacion/estimar`, {
    method: "POST",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({ marca: "Volkswagen", modelo: "Amarok", anio: 2018, km: 90000 }),
  });
  assert.equal(amarok.status, 200);
  assert.equal((await amarok.json()).guia.modelo, "Amarok");
});
