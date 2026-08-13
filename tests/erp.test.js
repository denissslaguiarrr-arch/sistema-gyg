const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("erp");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");
const { masMeses, hoyIso } = require("../backend/utils/fechas");

let server;
let baseUrl;
let cookie;
let vehiculoId;

test.before(async () => {
  ensureDefaultAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "clave-admin-123" }),
  });
  cookie = extraerCookie(loginRes);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

function headers() {
  return { "Content-Type": "application/json", Cookie: cookie };
}

async function post(path_, body) {
  return fetch(`${baseUrl}${path_}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
}
async function put(path_, body) {
  return fetch(`${baseUrl}${path_}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) });
}
async function get(path_) {
  return fetch(`${baseUrl}${path_}`, { headers: headers() });
}
async function del(path_) {
  return fetch(`${baseUrl}${path_}`, { method: "DELETE", headers: headers() });
}

test("POST /api/vehiculos guarda origen, precio de costo y fecha de ingreso", async () => {
  const res = await post("/api/vehiculos", {
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2022,
    dominio: "ERP001",
    kilometraje: 40000,
    precio: 28000,
    moneda: "USD",
    origen: "permuta",
    precio_compra: 22000,
    fecha_ingreso: "2026-01-10",
  });
  assert.equal(res.status, 201);
  const creado = await res.json();
  vehiculoId = creado.id;
  assert.equal(creado.origen, "Permuta");
  assert.equal(creado.precio_compra, 22000);
  assert.equal(creado.fecha_ingreso, "2026-01-10");
  assert.ok(Number.isInteger(creado.dias_en_stock));
  assert.ok(creado.dias_en_stock >= 0);
});

test("PUT sin precio_compra no borra el costo ya cargado", async () => {
  const res = await put(`/api/vehiculos/${vehiculoId}`, {
    marca: "Toyota",
    modelo: "Hilux SRX",
    anio: 2022,
    dominio: "ERP001",
    kilometraje: 40000,
    precio: 28500,
    moneda: "USD",
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.modelo, "Hilux SRX");
  assert.equal(body.precio_compra, 22000);
  assert.equal(body.origen, "Permuta");
  assert.equal(body.fecha_ingreso, "2026-01-10");
});

test("gastos: registrar, listar, borrar y verlos en la rentabilidad", async () => {
  const alta = await post(`/api/vehiculos/${vehiculoId}/gastos`, {
    concepto: "Cambio de correa",
    monto: 800,
    fecha: "2026-02-01",
  });
  assert.equal(alta.status, 201);
  const gasto = await alta.json();
  assert.equal(gasto.concepto, "Cambio de correa");
  assert.equal(gasto.monto, 800);

  await post(`/api/vehiculos/${vehiculoId}/gastos`, {
    concepto: "Gestoría",
    monto: 200,
  });

  const lista = await (await get(`/api/vehiculos/${vehiculoId}/gastos`)).json();
  assert.equal(lista.length, 2);

  const gestion = await (await get(`/api/vehiculos/${vehiculoId}/gestion`)).json();
  assert.equal(gestion.rentabilidad.precio_compra, 22000);
  assert.equal(gestion.rentabilidad.total_gastos, 1000);
  assert.equal(gestion.rentabilidad.costo_total, 23000);
  assert.equal(gestion.rentabilidad.precio_venta_estimado, 28500);
  assert.equal(gestion.rentabilidad.margen, 5500);
  assert.equal(gestion.dias_en_stock, gestion.vehiculo.dias_en_stock);

  const borrar = await del(`/api/vehiculos/${vehiculoId}/gastos/${gasto.id}`);
  assert.equal(borrar.status, 204);
  const listaDespues = await (await get(`/api/vehiculos/${vehiculoId}/gastos`)).json();
  assert.equal(listaDespues.length, 1);
  assert.equal(listaDespues[0].concepto, "Gestoría");
});

test("documentación: checklist y vencimiento de VTV", async () => {
  const vacia = await (await get(`/api/vehiculos/${vehiculoId}/documentacion`)).json();
  assert.equal(vacia.tiene_08, false);
  assert.equal(vacia.tiene_titulo, false);

  const res = await put(`/api/vehiculos/${vehiculoId}/documentacion`, {
    tiene_08: true,
    tiene_titulo: 1,
    vtv_vencimiento: "2026-11-30",
    verificacion_policial_vto: "",
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.tiene_08, true);
  assert.equal(body.tiene_titulo, true);
  assert.equal(body.vtv_vencimiento, "2026-11-30");
  assert.equal(body.verificacion_policial_vto, null);
});

test("venta: registra cliente, pasa a Vendido y calcula garantía a 3 meses", async () => {
  const res = await post(`/api/vehiculos/${vehiculoId}/venta`, {
    cliente_nombre: "Ana Pérez",
    cliente_telefono: "3735462914",
    precio_venta_final: 27000,
    fecha_venta: "2026-03-01",
  });
  assert.equal(res.status, 201);
  const venta = await res.json();
  assert.equal(venta.cliente_nombre, "Ana Pérez");
  assert.equal(venta.precio_venta_final, 27000);
  assert.equal(venta.fecha_venta, "2026-03-01");
  assert.equal(venta.fin_garantia, masMeses("2026-03-01", 3));
  assert.equal(venta.fin_garantia, "2026-06-01");

  const vehiculo = await (await get(`/api/vehiculos/${vehiculoId}`)).json();
  assert.equal(vehiculo.estado, "Vendido");

  const historial = await (await get(`/api/vehiculos/${vehiculoId}/historial`)).json();
  assert.equal(historial[0].estado_nuevo, "Vendido");

  const duplicada = await post(`/api/vehiculos/${vehiculoId}/venta`, {
    cliente_nombre: "Otro",
    precio_venta_final: 1,
  });
  assert.equal(duplicada.status, 409);
});

test("gastos y venta rechazan datos inválidos y un id inexistente", async () => {
  assert.equal((await get("/api/vehiculos/999999/gastos")).status, 404);
  assert.equal((await get("/api/vehiculos/999999/gestion")).status, 404);

  const gastoMalo = await post(`/api/vehiculos/${vehiculoId}/gastos`, { concepto: "", monto: -1 });
  assert.equal(gastoMalo.status, 400);

  const ventaMala = await post("/api/vehiculos/999999/venta", {
    cliente_nombre: "X",
    precio_venta_final: 1,
  });
  assert.equal(ventaMala.status, 404);
});

test("un vehículo nuevo sin costo usa origen Compra y fecha de hoy", async () => {
  const res = await post("/api/vehiculos", {
    marca: "Ford",
    modelo: "Ka",
    anio: 2018,
    dominio: "ERP002",
    precio: 5000,
    moneda: "USD",
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.origen, "Compra");
  assert.equal(body.precio_compra, null);
  assert.equal(body.fecha_ingreso, hoyIso());
});
