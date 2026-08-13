const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("public");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookie;
let vehiculoId;
let vehiculoEliminadoId;

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

  const crear = await fetch(`${baseUrl}/api/vehiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      marca: "Toyota",
      modelo: "Corolla",
      anio: 2023,
      dominio: "PUB123",
      precio: 25000,
      precio_oferta: 22000,
      moneda: "USD",
      notas: "Único dueño",
      imagenes_url: ["https://example.com/foto1.jpg"],
    }),
  });
  vehiculoId = (await crear.json()).id;

  const crearEliminado = await fetch(`${baseUrl}/api/vehiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      marca: "Ford", modelo: "Ka", anio: 2015, dominio: "PUB456", precio: 5000, moneda: "USD",
    }),
  });
  vehiculoEliminadoId = (await crearEliminado.json()).id;
  await fetch(`${baseUrl}/api/vehiculos/${vehiculoEliminadoId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

test("GET /api/public/vehiculos/:id no requiere sesión y expone los datos del vehículo", async () => {
  const res = await fetch(`${baseUrl}/api/public/vehiculos/${vehiculoId}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.marca, "Toyota");
  assert.equal(body.modelo, "Corolla");
  assert.equal(body.notas, "Único dueño");
  assert.equal(body.precio, 25000);
  assert.equal(body.precio_oferta, 22000);
  assert.deepEqual(body.imagenes_url, ["https://example.com/foto1.jpg"]);
  assert.equal(body.eliminado, undefined); // no debe filtrar campos internos de auditoría
  assert.equal(body.dominio, undefined); // no expone la patente públicamente
});

test("GET /api/public/vehiculos/:id devuelve 404 para un vehículo eliminado o inexistente", async () => {
  const eliminado = await fetch(`${baseUrl}/api/public/vehiculos/${vehiculoEliminadoId}`);
  assert.equal(eliminado.status, 404);

  const inexistente = await fetch(`${baseUrl}/api/public/vehiculos/999999`);
  assert.equal(inexistente.status, 404);
});

test("/ficha.html y /ficha.js son accesibles sin sesión", async () => {
  const html = await fetch(`${baseUrl}/ficha.html`);
  assert.equal(html.status, 200);
  const markup = await html.text();
  assert.match(markup, /object-contain/);
  assert.doesNotMatch(markup, /id="foto-principal"[^>]*object-cover/);

  const js = await fetch(`${baseUrl}/ficha.js`);
  assert.equal(js.status, 200);
  const script = await js.text();
  assert.match(script, /abrirLightbox/);
});

test("/catalogo.html y /catalogo.js son accesibles sin sesión", async () => {
  const html = await fetch(`${baseUrl}/catalogo.html`);
  assert.equal(html.status, 200);
  const js = await fetch(`${baseUrl}/catalogo.js`);
  assert.equal(js.status, 200);
  assert.match(await js.text(), /Contactanos/);
});

test("logo, favicon y marca son públicos (login, ficha y catálogo)", async () => {
  const fav = await fetch(`${baseUrl}/favicon.png`);
  assert.equal(fav.status, 200);
  const logo = await fetch(`${baseUrl}/brand/logo-gg-automotores.png`);
  assert.equal(logo.status, 200);
  const marca = await fetch(`${baseUrl}/brand/marca-gg.png`);
  assert.equal(marca.status, 200);
});

test("GET /api/public/catalogo no requiere sesión y usa Contactanos", async () => {
  const res = await fetch(`${baseUrl}/api/public/catalogo`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.vehicles));
  assert.equal(body.site.contactoTitulo, "Contactanos");
  const contacto = body.pages.find((p) => p.id === "contacto");
  assert.equal(contacto.content.headline, "Contactanos");
});

test("/uploads/ es accesible sin sesión (fotos públicas de la ficha)", async () => {
  const res = await fetch(`${baseUrl}/uploads/archivo-inexistente.jpg`);
  // No debe ser 401 (bloqueado por el guard de sesión); un 404 de express.static es lo esperado.
  assert.notEqual(res.status, 401);
});
