const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("sync");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookieAdmin;
let cookieVendedor;
const fetchOriginal = global.fetch;

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

  await fetch(`${baseUrl}/api/vehiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({
      marca: "Toyota", modelo: "Hilux", anio: 2024, dominio: "SYNC001", precio: 45000, moneda: "USD",
    }),
  });

  await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({ username: "vendedorsync", password: "clave-123456", rol: "vendedor" }),
  });
  const loginVendedor = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "vendedorsync", password: "clave-123456" }),
  });
  cookieVendedor = extraerCookie(loginVendedor);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
  global.fetch = fetchOriginal;
  delete process.env.GYG_GIST_ID;
  delete process.env.GYG_GITHUB_TOKEN;
});

// Solo intercepta las llamadas a la API de GitHub; las llamadas del propio
// test contra nuestro servidor local siguen yendo por el fetch real.
function mockFetchGitHub() {
  let llamadasGitHub = 0;
  global.fetch = async (url, opciones) => {
    if (!String(url).includes("api.github.com")) {
      return fetchOriginal(url, opciones);
    }

    llamadasGitHub += 1;
    if (llamadasGitHub === 1) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          files: { "stock.json": { content: JSON.stringify({ site: { name: "GyG" }, pages: [] }) } },
        }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ html_url: "https://gist.github.com/x/abc" }),
      text: async () => "{}",
    };
  };
}

test("POST /api/sync/publicar requiere rol admin", async () => {
  const res = await fetch(`${baseUrl}/api/sync/publicar`, {
    method: "POST",
    headers: { Cookie: cookieVendedor },
  });
  assert.equal(res.status, 403);
});

test("POST /api/sync/publicar sin GYG_GIST_ID/GYG_GITHUB_TOKEN configurados devuelve 400", async () => {
  delete process.env.GYG_GIST_ID;
  delete process.env.GYG_GITHUB_TOKEN;
  const { db } = require("../backend/db");
  db.prepare("UPDATE ConfiguracionSitio SET github_token = '' WHERE id = 1").run();

  const res = await fetch(`${baseUrl}/api/sync/publicar`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /GYG_GIST_ID|GYG_GITHUB_TOKEN/);
});

test("POST /api/sync/publicar usa el token pegado en Configuración del sitio", async () => {
  delete process.env.GYG_GIST_ID;
  delete process.env.GYG_GITHUB_TOKEN;
  mockFetchGitHub();

  const guardar = await fetch(`${baseUrl}/api/config/sitio`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookieAdmin },
    body: JSON.stringify({
      nombre: "G&G",
      githubToken: "token-desde-el-panel",
    }),
  });
  assert.equal(guardar.status, 200);

  const res = await fetch(`${baseUrl}/api/sync/publicar`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.vehiculosPublicados, 1);
});

test("POST /api/sync/publicar publica el stock activo cuando está bien configurado", async () => {
  process.env.GYG_GIST_ID = "gist-de-prueba";
  process.env.GYG_GITHUB_TOKEN = "token-de-prueba";
  mockFetchGitHub();

  const res = await fetch(`${baseUrl}/api/sync/publicar`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.vehiculosPublicados, 1);
  assert.equal(body.url, "https://gist.github.com/x/abc");
});

test("POST /api/sync/traer requiere rol admin", async () => {
  const res = await fetch(`${baseUrl}/api/sync/traer`, {
    method: "POST",
    headers: { Cookie: cookieVendedor },
  });
  assert.equal(res.status, 403);
});

test("POST /api/sync/traer carga el stock del Gist en el panel", async () => {
  delete process.env.GYG_GIST_ID;
  delete process.env.GYG_GITHUB_TOKEN;
  global.fetch = async (url, opciones) => {
    if (!String(url).includes("api.github.com")) {
      return fetchOriginal(url, opciones);
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        files: {
          "stock.json": {
            content: JSON.stringify({
              site: { name: "G&G Automotores", whatsapp: "5491112345678" },
              vehicles: [
                {
                  marca: "Volkswagen",
                  modelo: "Taos",
                  anio: 2024,
                  km: 57000,
                  precio: 51500000,
                  moneda: "ARS",
                  status: "disponible",
                  patente: "AG440IZ",
                  fotos: ["https://i.ibb.co/foto.jpg"],
                  equipamiento: [],
                  ingreso: "2026-08-14",
                },
              ],
            }),
          },
        },
      }),
    };
  };

  const res = await fetch(`${baseUrl}/api/sync/traer`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.creados, 1, JSON.stringify(body));
  assert.equal(body.errores.length, 0);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=AG440IZ`, { headers: { Cookie: cookieAdmin } })
  ).json();
  assert.equal(lista.items[0].modelo, "Taos");
  assert.equal(lista.items[0].kilometraje, 57000);
  assert.deepEqual(lista.items[0].imagenes_url, ["https://i.ibb.co/foto.jpg"]);

  const deNuevo = await fetch(`${baseUrl}/api/sync/traer`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
  });
  const body2 = await deNuevo.json();
  assert.equal(body2.creados, 0);
  assert.equal(body2.actualizados, 1);
});

test("POST /api/sync/publicar con token de GitHub inválido no cierra la sesión", async () => {
  process.env.GYG_GIST_ID = "gist-de-prueba";
  process.env.GYG_GITHUB_TOKEN = "token-de-prueba";
  global.fetch = async (url, opciones) => {
    if (!String(url).includes("api.github.com")) {
      return fetchOriginal(url, opciones);
    }
    const method = opciones && opciones.method;
    if (method === "PATCH") {
      return { ok: false, status: 401, json: async () => ({}), text: async () => "{}" };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        files: { "stock.json": { content: JSON.stringify({ site: { name: "GyG" }, pages: [] }) } },
      }),
    };
  };

  const res = await fetch(`${baseUrl}/api/sync/publicar`, {
    method: "POST",
    headers: { Cookie: cookieAdmin },
  });
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.match(body.error, /token de GitHub/i);

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieAdmin } });
  assert.equal(me.status, 200);
});
