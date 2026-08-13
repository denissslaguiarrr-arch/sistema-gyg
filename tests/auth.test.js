const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("auth");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-inicial-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;

test.before(async () => {
  ensureDefaultAdmin();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

test("GET /api/auth/me sin sesión devuelve 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(res.status, 401);
});

test("POST /api/auth/login con credenciales incorrectas devuelve 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "incorrecta" }),
  });
  assert.equal(res.status, 401);
});

test("POST /api/auth/login sin usuario o contraseña devuelve 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin" }),
  });
  assert.equal(res.status, 400);
});

test("login correcto entrega una cookie de sesión y habilita /api/auth/me", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "clave-inicial-123" }),
  });
  assert.equal(loginRes.status, 200);

  const cookie = extraerCookie(loginRes);
  assert.ok(cookie);

  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(meRes.status, 200);
  const body = await meRes.json();
  assert.equal(body.usuario.username, "admin");
});

test("acceso a /api/vehiculos sin sesión devuelve 401", async () => {
  const res = await fetch(`${baseUrl}/api/vehiculos`);
  assert.equal(res.status, 401);
});

test("cambiar contraseña requiere la actual correcta y valida longitud mínima", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "clave-inicial-123" }),
  });
  const cookie = extraerCookie(loginRes);

  const passwordActualIncorrecta = await fetch(`${baseUrl}/api/auth/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ passwordActual: "incorrecta", passwordNueva: "nueva123" }),
  });
  assert.equal(passwordActualIncorrecta.status, 401);

  const passwordCorta = await fetch(`${baseUrl}/api/auth/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ passwordActual: "clave-inicial-123", passwordNueva: "abc" }),
  });
  assert.equal(passwordCorta.status, 400);

  const cambioOk = await fetch(`${baseUrl}/api/auth/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ passwordActual: "clave-inicial-123", passwordNueva: "nueva-clave-456" }),
  });
  assert.equal(cambioOk.status, 200);

  const loginConNueva = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "nueva-clave-456" }),
  });
  assert.equal(loginConNueva.status, 200);
});

test("logout invalida la sesión", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "nueva-clave-456" }),
  });
  const cookie = extraerCookie(loginRes);

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert.equal(logoutRes.status, 200);

  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(meRes.status, 401);
});
