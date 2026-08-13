const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("config");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookieAdmin;
let cookieVendedor;

test.before(async () => {
  ensureDefaultAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  const loginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "clave-admin-123" }),
  });
  cookieAdmin = extraerCookie(loginAdmin);

  await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({ username: "vendedorconfig", password: "clave-123456", rol: "vendedor" }),
  });
  const loginVendedor = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "vendedorconfig", password: "clave-123456" }),
  });
  cookieVendedor = extraerCookie(loginVendedor);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

test("GET /api/config/sitio devuelve valores vacíos por defecto", async () => {
  const res = await fetch(`${baseUrl}/api/config/sitio`, { headers: { Cookie: cookieAdmin } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.nombre, "");
  assert.equal(body.whatsapp, "");
});

test("GET /api/config/sitio requiere sesión, pero no rol admin", async () => {
  assert.equal((await fetch(`${baseUrl}/api/config/sitio`)).status, 401);
  const res = await fetch(`${baseUrl}/api/config/sitio`, { headers: { Cookie: cookieVendedor } });
  assert.equal(res.status, 200);
});

test("PUT /api/config/sitio requiere rol admin", async () => {
  const res = await fetch(`${baseUrl}/api/config/sitio`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookieVendedor },
    body: JSON.stringify({ nombre: "Intento vendedor" }),
  });
  assert.equal(res.status, 403);
});

test("PUT /api/config/sitio (admin) actualiza y persiste la configuración", async () => {
  const res = await fetch(`${baseUrl}/api/config/sitio`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({
      nombre: "GyG",
      tagline: "Selección premium",
      whatsapp: "5491123456789",
      footerText: "Concesionaria GyG",
      heroImage: "https://ejemplo.com/hero.jpg",
    }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.nombre, "GyG");
  assert.equal(body.whatsapp, "5491123456789");

  const relectura = await (
    await fetch(`${baseUrl}/api/config/sitio`, { headers: { Cookie: cookieAdmin } })
  ).json();
  assert.equal(relectura.tagline, "Selección premium");
  assert.equal(relectura.heroImage, "https://ejemplo.com/hero.jpg");
});
