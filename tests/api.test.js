const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Base de datos aislada por ejecución: no toca db/concesionaria.db de desarrollo.
const tmpDb = path.join(
  os.tmpdir(),
  `gyg-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
);
process.env.GYG_DB_PATH = tmpDb;

const app = require("../backend/app");

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  for (const suffix of ["", "-shm", "-wal"]) {
    fs.rmSync(tmpDb + suffix, { force: true });
  }
});

async function post(path_, body) {
  return fetch(`${baseUrl}${path_}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("GET /api/health responde ok con la base vacía", async () => {
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

  const lista = await (await fetch(`${baseUrl}/api/vehiculos`)).json();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].dominio, "AB123CD");
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

  const porTexto = await (await fetch(`${baseUrl}/api/vehiculos?q=focus`)).json();
  assert.equal(porTexto.length, 1);
  assert.equal(porTexto[0].modelo, "Focus");

  const porEstado = await (
    await fetch(`${baseUrl}/api/vehiculos?estado=Reservado`)
  ).json();
  assert.equal(porEstado.length, 1);

  const soloUsados = await (await fetch(`${baseUrl}/api/vehiculos?km=usado`)).json();
  assert.equal(soloUsados.length, 1);
  assert.equal(soloUsados[0].dominio, "XYZ789");

  const solo0km = await (await fetch(`${baseUrl}/api/vehiculos?km=0km`)).json();
  assert.equal(solo0km.length, 1);
  assert.equal(solo0km[0].dominio, "AB123CD");
});

test("PUT /api/vehiculos/:id actualiza el vehículo", async () => {
  const lista = await (await fetch(`${baseUrl}/api/vehiculos?q=AB123CD`)).json();
  const id = lista[0].id;

  const res = await fetch(`${baseUrl}/api/vehiculos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      marca: "Toyota",
      modelo: "Hilux SRX",
      anio: 2024,
      dominio: "AB123CD",
      kilometraje: 10,
      precio: 47000,
      moneda: "USD",
      estado: "Disponible",
    }),
  });
  assert.equal(res.status, 200);
  const actualizado = await res.json();
  assert.equal(actualizado.modelo, "Hilux SRX");
  assert.equal(actualizado.es_0km, false);
});

test("PATCH /api/vehiculos/:id/estado cambia solo el estado", async () => {
  const lista = await (await fetch(`${baseUrl}/api/vehiculos?q=AB123CD`)).json();
  const id = lista[0].id;

  const res = await fetch(`${baseUrl}/api/vehiculos/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "Vendido" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.estado, "Vendido");
  assert.equal(body.modelo, "Hilux SRX"); // el resto de los campos no cambia
});

test("PATCH con estado inválido devuelve 400", async () => {
  const lista = await (await fetch(`${baseUrl}/api/vehiculos?q=AB123CD`)).json();
  const id = lista[0].id;

  const res = await fetch(`${baseUrl}/api/vehiculos/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "Perdido" }),
  });
  assert.equal(res.status, 400);
});

test("operaciones sobre un id inexistente devuelven 404", async () => {
  const getRes = await fetch(`${baseUrl}/api/vehiculos/999999`);
  assert.equal(getRes.status, 404);

  const putRes = await fetch(`${baseUrl}/api/vehiculos/999999`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      marca: "A",
      modelo: "B",
      anio: 2020,
      dominio: "ZZZ999",
      precio: 1,
      moneda: "ARS",
    }),
  });
  assert.equal(putRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/vehiculos/999999`, {
    method: "DELETE",
  });
  assert.equal(deleteRes.status, 404);
});

test("DELETE /api/vehiculos/:id elimina el vehículo", async () => {
  const lista = await (await fetch(`${baseUrl}/api/vehiculos?q=AB123CD`)).json();
  const id = lista[0].id;

  const res = await fetch(`${baseUrl}/api/vehiculos/${id}`, { method: "DELETE" });
  assert.equal(res.status, 204);

  const getRes = await fetch(`${baseUrl}/api/vehiculos/${id}`);
  assert.equal(getRes.status, 404);
});
