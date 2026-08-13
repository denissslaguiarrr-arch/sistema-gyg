const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("import");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookie;

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

function csvComoArchivo(contenido, nombre = "import.csv") {
  return new File([contenido], nombre, { type: "text/csv" });
}

test("GET /api/vehiculos/plantilla.csv devuelve encabezados y una fila de ejemplo", async () => {
  const res = await fetch(`${baseUrl}/api/vehiculos/plantilla.csv`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  const texto = await res.text();
  const lineas = texto.trim().split("\n");
  assert.equal(lineas.length, 2);
  assert.match(lineas[0], /^marca,modelo,anio,dominio,kilometraje,precio,precio_oferta,moneda,estado,notas,imagenes_url/);
  assert.match(lineas[0], /version,combustible,transmision,traccion,puertas,color,motor,potencia,carroceria,destacado,equipamiento$/);
});

test("POST /api/vehiculos/import crea y actualiza vehículos, reportando errores por fila", async () => {
  const csv = [
    "marca,modelo,anio,patente,km,precio,moneda,estado,notas",
    "Toyota,Hilux,2024,IMP001,0,45000,USD,Disponible,Primer ingreso",
    "Ford,Focus,2019,IMP002,50000,8000000,ARS,Reservado,",
    ",ModeloSinMarca,2020,IMP003,0,1000,ARS,Disponible,", // fila inválida: falta marca
  ].join("\n");

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.creados, 2);
  assert.equal(body.actualizados, 0);
  assert.equal(body.errores.length, 1);
  assert.equal(body.errores[0].fila, 4);
  assert.match(body.errores[0].error, /marca/);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMP001`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(lista.items.length, 1);
  assert.equal(lista.items[0].kilometraje, 0);
  assert.equal(lista.items[0].dominio, "IMP001");

  // Reimportar con la misma patente actualiza en vez de duplicar.
  const csvActualizado = [
    "marca,modelo,anio,patente,km,precio,moneda,estado,notas",
    "Toyota,Hilux SRX,2024,IMP001,10,47000,USD,Reservado,Actualizado por reimportación",
  ].join("\n");

  const formData2 = new FormData();
  formData2.append("archivo", csvComoArchivo(csvActualizado));

  const res2 = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData2,
  });
  const body2 = await res2.json();
  assert.equal(body2.creados, 0);
  assert.equal(body2.actualizados, 1);

  const listaFinal = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMP001`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(listaFinal.items.length, 1);
  assert.equal(listaFinal.items[0].modelo, "Hilux SRX");
  assert.equal(listaFinal.items[0].estado, "Reservado");
});

test("POST /api/vehiculos/import acepta la columna oferta como precio_oferta", async () => {
  const csv = [
    "marca,modelo,anio,patente,km,precio,oferta,moneda,estado",
    "Honda,Civic,2020,IMP0FE,30000,18000,15000,USD,Disponible",
  ].join("\n");

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.creados, 1);
  assert.equal(body.errores.length, 0);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMP0FE`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(lista.items[0].precio, 18000);
  assert.equal(lista.items[0].precio_oferta, 15000);
});

test("POST /api/vehiculos/import sin archivo devuelve 400", async () => {
  const formData = new FormData();
  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 400);
});

test("POST /api/vehiculos/import requiere rol admin", async () => {
  const crearVendedor = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ username: "vendedorimport", password: "clave-123456", rol: "vendedor" }),
  });
  assert.equal(crearVendedor.status, 201);

  const loginVendedor = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "vendedorimport", password: "clave-123456" }),
  });
  const cookieVendedor = extraerCookie(loginVendedor);

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo("marca,modelo,anio,dominio,precio,moneda\nA,B,2020,V1,1,ARS"));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookieVendedor },
    body: formData,
  });
  assert.equal(res.status, 403);
});
