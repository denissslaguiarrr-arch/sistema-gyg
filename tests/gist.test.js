const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mapearEstado,
  mapearVehiculo,
  mergeSiteConfig,
  construirStockJson,
  obtenerGistActual,
  publicarEnGist,
  DEFAULT_PAGES,
} = require("../backend/sync/gist");

test("mapearEstado traduce Disponible/Reservado/Vendido a minúsculas", () => {
  assert.equal(mapearEstado("Disponible"), "disponible");
  assert.equal(mapearEstado("Reservado"), "reservado");
  assert.equal(mapearEstado("Vendido"), "vendido");
  assert.equal(mapearEstado("Otro"), "disponible"); // fallback seguro
});

test("mapearVehiculo arma el objeto con el esquema del catálogo público", () => {
  const vehiculo = mapearVehiculo({
    id: 7,
    marca: "Toyota",
    modelo: "Hilux",
    version: "SRX",
    anio: 2024,
    kilometraje: 0,
    precio: 45000,
    precio_oferta: 42000,
    moneda: "USD",
    combustible: "Diesel",
    transmision: "Automática",
    traccion: "4x4",
    puertas: 4,
    color: "Blanco",
    motor: "2.8L",
    potencia: "204cv",
    carroceria: "Pickup",
    dominio: "AB123CD",
    destacado: true,
    notas: "Único dueño",
    equipamiento: ["Aire acondicionado", "Bluetooth"],
    imagenes_url: ["https://a.com/1.jpg"],
    estado: "Reservado",
    created_at: "2026-01-15 10:00:00",
    updated_at: "2026-02-01 12:30:00",
  });

  assert.equal(vehiculo.id, "gyg-007");
  assert.equal(vehiculo.status, "reservado");
  assert.equal(vehiculo.categoria, "0km");
  assert.equal(vehiculo.patente, "AB123CD");
  assert.equal(vehiculo.descripcion, "Único dueño");
  assert.equal(vehiculo.destacado, true);
  assert.deepEqual(vehiculo.equipamiento, ["Aire acondicionado", "Bluetooth"]);
  assert.deepEqual(vehiculo.fotos, ["https://a.com/1.jpg"]);
  assert.equal(vehiculo.ingreso, "2026-01-15");
  assert.equal(vehiculo.updatedAt, "2026-02-01T12:30:00.000Z");
  assert.equal(vehiculo.precio, 45000);
  assert.equal(vehiculo.precio_oferta, 42000);
});

test("mapearVehiculo marca categoria 'usado' cuando el kilometraje es mayor a 0", () => {
  const vehiculo = mapearVehiculo({
    id: 1, marca: "Ford", modelo: "Focus", anio: 2018, kilometraje: 80000,
    precio: 8000, moneda: "USD", dominio: "X", estado: "Disponible",
    equipamiento: [], imagenes_url: [], created_at: "2026-01-01", updated_at: "2026-01-01",
  });
  assert.equal(vehiculo.categoria, "usado");
  assert.equal(vehiculo.precio_oferta, null);
});

test("mergeSiteConfig prioriza los valores locales, pero no pisa con vacíos", () => {
  const gistSite = { name: "GyG viejo", tagline: "Tagline viejo", whatsapp: "111", footerText: "pie", heroImage: "img.jpg" };

  const conDatosLocales = mergeSiteConfig(gistSite, { nombre: "GyG nuevo", tagline: "", whatsapp: "222" });
  assert.equal(conDatosLocales.name, "GyG nuevo");
  assert.equal(conDatosLocales.tagline, "Tagline viejo"); // vacío local no pisa
  assert.equal(conDatosLocales.whatsapp, "222");
  assert.equal(conDatosLocales.footerText, "pie");

  const sinConfigLocal = mergeSiteConfig(gistSite, {});
  assert.deepEqual(sinConfigLocal, {
    name: "GyG viejo", tagline: "Tagline viejo", whatsapp: "111", footerText: "pie", heroImage: "img.jpg",
  });
});

test("construirStockJson conserva las páginas existentes y usa DEFAULT_PAGES si no hay ninguna", () => {
  const conPaginasPropias = construirStockJson({
    gistActual: { site: {}, pages: [{ id: "custom", slug: "custom" }] },
    vehiculos: [],
    siteConfig: {},
  });
  assert.deepEqual(conPaginasPropias.pages, [{ id: "custom", slug: "custom" }]);

  const sinGistPrevio = construirStockJson({ gistActual: null, vehiculos: [], siteConfig: { nombre: "GyG" } });
  assert.deepEqual(sinGistPrevio.pages, DEFAULT_PAGES);
  assert.equal(sinGistPrevio.site.name, "GyG");
  assert.equal(sinGistPrevio.meta.concesionaria, "GyG");
  assert.ok(sinGistPrevio.meta.updatedAt);
});

function fetchFalso(respuestas) {
  let llamada = 0;
  return async (url, opciones) => {
    const r = respuestas[llamada];
    llamada += 1;
    if (!r) throw new Error(`No se esperaba una llamada extra a fetch (#${llamada}): ${url}`);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    };
  };
}

test("obtenerGistActual parsea el contenido de stock.json", async () => {
  const fetchImpl = fetchFalso([
    { status: 200, body: { files: { "stock.json": { content: JSON.stringify({ site: { name: "X" } }) } } } },
  ]);
  const data = await obtenerGistActual({ gistId: "abc", token: "t", fetchImpl });
  assert.equal(data.site.name, "X");
});

test("obtenerGistActual lanza un error claro si el Gist no existe (404)", async () => {
  const fetchImpl = fetchFalso([{ status: 404, body: {} }]);
  await assert.rejects(
    () => obtenerGistActual({ gistId: "no-existe", token: "t", fetchImpl }),
    /No se encontró el Gist/
  );
});

test("publicarEnGist exige gistId y token configurados", async () => {
  await assert.rejects(
    () => publicarEnGist({ gistId: "", token: "t", vehiculos: [], siteConfig: {} }),
    /GYG_GIST_ID/
  );
  await assert.rejects(
    () => publicarEnGist({ gistId: "abc", token: "", vehiculos: [], siteConfig: {} }),
    /GYG_GITHUB_TOKEN/
  );
});

test("publicarEnGist arma y envía el payload, devolviendo la cantidad publicada", async () => {
  const fetchImpl = fetchFalso([
    { status: 200, body: { files: { "stock.json": { content: JSON.stringify({ site: { name: "GyG" }, pages: [] }) } } } },
    { status: 200, body: { html_url: "https://gist.github.com/x/abc" } },
  ]);

  const resultado = await publicarEnGist({
    gistId: "abc",
    token: "tok",
    vehiculos: [
      {
        id: 1, marca: "Toyota", modelo: "Hilux", anio: 2024, kilometraje: 0, precio: 45000,
        moneda: "USD", dominio: "AB123CD", estado: "Disponible", equipamiento: [], imagenes_url: [],
        created_at: "2026-01-01", updated_at: "2026-01-01",
      },
    ],
    siteConfig: { nombre: "GyG" },
    fetchImpl,
  });

  assert.equal(resultado.vehiculosPublicados, 1);
  assert.equal(resultado.htmlUrl, "https://gist.github.com/x/abc");
  assert.equal(resultado.payload.vehicles[0].patente, "AB123CD");
});

test("publicarEnGist traduce un 401/403 de GitHub en un mensaje claro", async () => {
  const fetchImpl = fetchFalso([
    { status: 200, body: { files: {} } },
    { status: 401, body: {} },
  ]);

  await assert.rejects(
    () =>
      publicarEnGist({
        gistId: "abc",
        token: "token-invalido",
        vehiculos: [],
        siteConfig: {},
        fetchImpl,
      }),
    /token de GitHub es inválido/
  );
});
