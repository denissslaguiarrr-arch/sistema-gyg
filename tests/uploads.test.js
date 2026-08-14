const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("uploads");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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

test("POST /api/uploads guarda una imagen y devuelve su URL", async () => {
  const formData = new FormData();
  formData.append("imagenes", new File([PNG_1X1], "foto.png", { type: "image/png" }));

  const res = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(Array.isArray(body.urls));
  assert.equal(body.urls.length, 1);
  assert.match(body.urls[0], /^\/uploads\/.+\.png$/);

  const archivo = await fetch(`${baseUrl}${body.urls[0]}`);
  assert.equal(archivo.status, 200);
});

test("POST /api/uploads rechaza un archivo que no es imagen", async () => {
  const formData = new FormData();
  formData.append("imagenes", new File(["no es una foto"], "notas.txt", { type: "text/plain" }));

  const res = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /JPG|imagen/i);
});

test("POST /api/vehiculos guarda un vehículo con foto por URL", async () => {
  const res = await fetch(`${baseUrl}/api/vehiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      marca: "Ford",
      modelo: "Ranger",
      anio: 2022,
      dominio: "FOT001",
      precio: 30000,
      moneda: "USD",
      imagenes_url: ["https://ejemplo.com/ranger.jpg"],
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.deepEqual(body.imagenes_url, ["https://ejemplo.com/ranger.jpg"]);
});

test("POST /api/uploads/imgur sin Client-ID configurado devuelve 400", async () => {
  const anterior = process.env.GYG_IMGUR_CLIENT_ID;
  delete process.env.GYG_IMGUR_CLIENT_ID;

  const formData = new FormData();
  formData.append("imagenes", new File([PNG_1X1], "foto.png", { type: "image/png" }));
  const res = await fetch(`${baseUrl}/api/uploads/imgur`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  if (anterior === undefined) delete process.env.GYG_IMGUR_CLIENT_ID;
  else process.env.GYG_IMGUR_CLIENT_ID = anterior;

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Imgur ya no registra Client ID/);
});

test("POST /api/uploads/imgur devuelve el link público de Imgur", async () => {
  const anterior = process.env.GYG_IMGUR_CLIENT_ID;
  process.env.GYG_IMGUR_CLIENT_ID = "client-de-test";
  const fetchOriginal = global.fetch;
  global.fetch = async (url, opciones) => {
    if (String(url).includes("api.imgur.com")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { link: "https://i.imgur.com/xyz.jpg" } }),
      };
    }
    return fetchOriginal(url, opciones);
  };

  try {
    const formData = new FormData();
    formData.append("imagenes", new File([PNG_1X1], "foto.png", { type: "image/png" }));
    const res = await fetch(`${baseUrl}/api/uploads/imgur`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: formData,
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.deepEqual(body.urls, ["https://i.imgur.com/xyz.jpg"]);
  } finally {
    global.fetch = fetchOriginal;
    if (anterior === undefined) delete process.env.GYG_IMGUR_CLIENT_ID;
    else process.env.GYG_IMGUR_CLIENT_ID = anterior;
  }
});
