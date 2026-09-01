const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

// Base de datos aislada por ejecución: no toca db/concesionaria.db de desarrollo.
const dbPath = tmpDbPath("api");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "test-password-123";

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
    body: JSON.stringify({ username: "admin", password: "test-password-123" }),
  });
  assert.equal(loginRes.status, 200);
  cookie = extraerCookie(loginRes);
  assert.ok(cookie, "debería recibir una cookie de sesión");
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
async function patch(path_, body) {
  return fetch(`${baseUrl}${path_}`, { method: "PATCH", headers: headers(), body: JSON.stringify(body) });
}
async function del(path_) {
  return fetch(`${baseUrl}${path_}`, { method: "DELETE", headers: headers() });
}
async function get(path_) {
  return fetch(`${baseUrl}${path_}`, { headers: headers() });
}
// GET /api/vehiculos devuelve { items, total, pagina, porPagina, totalPaginas }.
async function listar(path_) {
  return (await get(path_)).json();
}
async function listarItems(path_) {
  return (await listar(path_)).items;
}

test("GET /api/health responde ok con la base vacía (sin requerir sesión)", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.vehiculos, 0);
});

test("POST /api/vehiculos crea un vehículo y aparece en el listado", async () => {
  const res = await post("/api/vehiculos", {
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2024,
    dominio: "AB123CD",
    kilometraje: 0,
    precio: 45000,
    moneda: "USD",
  });
  assert.equal(res.status, 201);
  const creado = await res.json();
  assert.equal(creado.estado, "Disponible");
  assert.equal(creado.es_0km, true);
  assert.equal(creado.precio_oferta, null);
  assert.equal(creado.mostrar_precio, false);

  const lista = await listar("/api/vehiculos");
  assert.equal(lista.total, 1);
  assert.equal(lista.items.length, 1);
  assert.equal(lista.items[0].dominio, "AB123CD");
});

test("POST con dominio duplicado (sin distinguir mayúsculas) devuelve 409", async () => {
  const res = await post("/api/vehiculos", {
    marca: "Toyota",
    modelo: "Hilux 2",
    anio: 2024,
    dominio: "ab123cd",
    precio: 1,
    moneda: "USD",
  });
  assert.equal(res.status, 409);
});

test("POST con datos inválidos devuelve 400 con detalle", async () => {
  const res = await post("/api/vehiculos", { marca: "", moneda: "EUR" });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(Array.isArray(body.detalles));
  assert.ok(body.detalles.length > 0);
});

test("GET /api/vehiculos filtra por texto, estado y km", async () => {
  await post("/api/vehiculos", {
    marca: "Ford",
    modelo: "Focus",
    anio: 2018,
    dominio: "XYZ789",
    kilometraje: 80000,
    precio: 8000000,
    moneda: "ARS",
    estado: "Reservado",
  });

  const porTexto = await listarItems("/api/vehiculos?q=focus");
  assert.equal(porTexto.length, 1);
  assert.equal(porTexto[0].modelo, "Focus");

  const porEstado = await listarItems("/api/vehiculos?estado=Reservado");
  assert.equal(porEstado.length, 1);

  const soloUsados = await listarItems("/api/vehiculos?km=usado");
  assert.equal(soloUsados.length, 1);
  assert.equal(soloUsados[0].dominio, "XYZ789");

  const solo0km = await listarItems("/api/vehiculos?km=0km");
  assert.equal(solo0km.length, 1);
  assert.equal(solo0km[0].dominio, "AB123CD");
});

test("GET /api/vehiculos ordena server-side y pagina los resultados", async () => {
  const porPrecioAsc = await listarItems("/api/vehiculos?orden=precio&direccion=asc");
  assert.equal(porPrecioAsc[0].dominio, "AB123CD"); // 45000 < 8000000

  const porPrecioDesc = await listarItems("/api/vehiculos?orden=precio&direccion=desc");
  assert.equal(porPrecioDesc[0].dominio, "XYZ789");

  const paginaUno = await listar("/api/vehiculos?porPagina=1&pagina=1");
  assert.equal(paginaUno.items.length, 1);
  assert.equal(paginaUno.total, 2);
  assert.equal(paginaUno.totalPaginas, 2);

  const paginaDos = await listar("/api/vehiculos?porPagina=1&pagina=2");
  assert.equal(paginaDos.items.length, 1);
  assert.notEqual(paginaDos.items[0].id, paginaUno.items[0].id);
});

test("GET /api/vehiculos/resumen calcula KPIs sobre los vehículos activos", async () => {
  const resumen = await (await get("/api/vehiculos/resumen")).json();
  assert.equal(resumen.total, 2);
  assert.equal(resumen.disponibles, 1);
  assert.equal(resumen.reservados, 1);
  assert.equal(resumen.vendidos, 0);
  assert.equal(resumen.valor_stock_usd, 45000);
  assert.equal(resumen.valor_stock_ars, 8000000);
  assert.equal(resumen.stock_sucio, true);
  assert.equal(resumen.last_sync_at, null);
});

test("POST /api/vehiculos guarda y limpia un precio_oferta", async () => {
  const res = await post("/api/vehiculos", {
    marca: "Chevrolet",
    modelo: "Cruze",
    anio: 2021,
    dominio: "OFE999",
    kilometraje: 10000,
    precio: 20000,
    precio_oferta: 17500,
    moneda: "USD",
  });
  assert.equal(res.status, 201);
  const creado = await res.json();
  assert.equal(creado.precio, 20000);
  assert.equal(creado.precio_oferta, 17500);

  const detalle = await (await get(`/api/vehiculos/${creado.id}`)).json();
  assert.equal(detalle.precio_oferta, 17500);

  const resumenConOferta = await (await get("/api/vehiculos/resumen")).json();
  assert.equal(resumenConOferta.valor_stock_usd, 45000 + 17500);

  const sinOferta = await put(`/api/vehiculos/${creado.id}`, {
    marca: "Chevrolet",
    modelo: "Cruze",
    anio: 2021,
    dominio: "OFE999",
    kilometraje: 10000,
    precio: 20000,
    precio_oferta: "",
    moneda: "USD",
  });
  assert.equal(sinOferta.status, 200);
  assert.equal((await sinOferta.json()).precio_oferta, null);

  await del(`/api/vehiculos/${creado.id}`);
  await del(`/api/vehiculos/${creado.id}/permanente`);
});

test("PUT /api/vehiculos/:id actualiza el vehículo y registra el cambio de estado", async () => {
  const lista = await listarItems("/api/vehiculos?q=AB123CD");
  const id = lista[0].id;

  const res = await put(`/api/vehiculos/${id}`, {
    marca: "Toyota",
    modelo: "Hilux SRX",
    anio: 2024,
    dominio: "AB123CD",
    kilometraje: 10,
    precio: 47000,
    moneda: "USD",
    estado: "Reservado",
  });
  assert.equal(res.status, 200);
  const actualizado = await res.json();
  assert.equal(actualizado.modelo, "Hilux SRX");
  assert.equal(actualizado.es_0km, false);

  const historial = await (await get(`/api/vehiculos/${id}/historial`)).json();
  assert.ok(historial.length >= 2); // alta + cambio de estado
  assert.equal(historial[0].estado_nuevo, "Reservado");
  assert.equal(historial[0].username, "admin");
});

test("PATCH /api/vehiculos/:id/estado cambia solo el estado", async () => {
  const lista = await listarItems("/api/vehiculos?q=AB123CD");
  const id = lista[0].id;

  const res = await patch(`/api/vehiculos/${id}/estado`, { estado: "Vendido" });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.estado, "Vendido");
  assert.equal(body.modelo, "Hilux SRX"); // el resto de los campos no cambia
});

test("PATCH con estado inválido devuelve 400", async () => {
  const lista = await listarItems("/api/vehiculos?q=AB123CD");
  const id = lista[0].id;

  const res = await patch(`/api/vehiculos/${id}/estado`, { estado: "Perdido" });
  assert.equal(res.status, 400);
});

test("operaciones sobre un id inexistente devuelven 404", async () => {
  assert.equal((await get("/api/vehiculos/999999")).status, 404);
  assert.equal(
    (
      await put("/api/vehiculos/999999", {
        marca: "A",
        modelo: "B",
        anio: 2020,
        dominio: "ZZZ999",
        precio: 1,
        moneda: "ARS",
      })
    ).status,
    404
  );
  assert.equal((await del("/api/vehiculos/999999")).status, 404);
});

test("DELETE /api/vehiculos/:id es un borrado lógico: pasa a la papelera y se puede restaurar", async () => {
  const lista = await listarItems("/api/vehiculos?q=AB123CD");
  const id = lista[0].id;

  const res = await del(`/api/vehiculos/${id}`);
  assert.equal(res.status, 204);

  // Ya no aparece en el listado normal ni se puede obtener por id.
  assert.equal((await get(`/api/vehiculos/${id}`)).status, 404);
  const listaActiva = await listarItems("/api/vehiculos?q=AB123CD");
  assert.equal(listaActiva.length, 0);

  // Pero sí aparece en la papelera.
  const papelera = await listarItems("/api/vehiculos?papelera=1");
  assert.equal(papelera.length, 1);
  assert.equal(papelera[0].id, id);
  assert.equal(papelera[0].eliminado, true);

  // La patente vuelve a estar disponible para un vehículo nuevo mientras esté en la papelera.
  const nuevoConMismaPatente = await post("/api/vehiculos", {
    marca: "Chevrolet",
    modelo: "Onix",
    anio: 2023,
    dominio: "AB123CD",
    precio: 20000,
    moneda: "USD",
  });
  assert.equal(nuevoConMismaPatente.status, 201);

  // Restaurar el original ahora sí choca con la patente duplicada porque el nuevo ya la usa.
  const restaurarConflicto = await patch(`/api/vehiculos/${id}/restaurar`, {});
  assert.equal(restaurarConflicto.status, 409);

  // Se libera la patente borrando (lógicamente) el vehículo nuevo, para poder
  // restaurar el original en el siguiente test.
  const nuevoCreado = await nuevoConMismaPatente.json();
  await del(`/api/vehiculos/${nuevoCreado.id}`);
});

test("PATCH /api/vehiculos/:id/restaurar devuelve el vehículo a la lista activa", async () => {
  const papelera = await listarItems("/api/vehiculos?papelera=1");
  const id = papelera[0].id;

  const res = await patch(`/api/vehiculos/${id}/restaurar`, {});
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.eliminado, false);

  const listaActiva = await listarItems("/api/vehiculos?q=AB123CD");
  assert.equal(listaActiva.length, 1);
});

test("DELETE /api/vehiculos/:id/permanente borra definitivamente solo desde la papelera", async () => {
  const lista = await listarItems("/api/vehiculos?q=AB123CD");
  const id = lista[0].id;

  // Todavía está activo: no se puede purgar directamente.
  assert.equal((await del(`/api/vehiculos/${id}/permanente`)).status, 404);

  await del(`/api/vehiculos/${id}`);
  const purgar = await del(`/api/vehiculos/${id}/permanente`);
  assert.equal(purgar.status, 204);

  const papelera = await listarItems("/api/vehiculos?papelera=1");
  assert.equal(papelera.find((v) => v.id === id), undefined);
});

test("GET /api/vehiculos/export.csv incluye los links de las fotos", async () => {
  const creado = await post("/api/vehiculos", {
    marca: "VW",
    modelo: "Gol",
    anio: 2019,
    dominio: "FOT999",
    precio: 9000,
    moneda: "USD",
    imagenes_url: ["https://i.imgur.com/abc.jpg", "https://drive.google.com/file/d/xyz"],
  });
  assert.equal(creado.status, 201);

  const res = await get("/api/vehiculos/export.csv");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /text\/csv/);
  const texto = await res.text();
  const encabezado = texto.split("\n")[0];
  assert.match(encabezado, /^id,marca,modelo,anio,dominio/);
  assert.match(encabezado, /imagenes_url/);
  assert.match(texto, /https:\/\/i\.imgur\.com\/abc\.jpg/);
  assert.match(texto, /FOT999/);
  assert.match(texto, /abc\.jpg \| https:\/\/drive\.google\.com/);

  const body = await creado.json();
  await del(`/api/vehiculos/${body.id}`);
  await del(`/api/vehiculos/${body.id}/permanente`);
});
