const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mapearEstado,
  mapearVehiculo,
  mapearVehiculoDesdeGist,
  mergeSiteConfig,
  mergePages,
  construirStockJson,
  vehiculosParaCatalogo,
  obtenerGistActual,
  publicarEnGist,
  DEFAULT_PAGES,
  normalizarCopiaPagina,
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
  assert.deepEqual(vehiculo.videos, []);
  assert.equal(vehiculo.media[0].tipo, "foto");
  assert.equal(vehiculo.ingreso, "2026-01-15");
  assert.equal(vehiculo.updatedAt, "2026-02-01T12:30:00.000Z");
  assert.equal(vehiculo.precio, 45000);
  assert.equal(vehiculo.precio_oferta, 42000);
  assert.equal(vehiculo.mostrarPrecio, false);
});

test("mapearVehiculo publica mostrarPrecio solo si está tildado", () => {
  const oculto = mapearVehiculo({
    id: 1, marca: "A", modelo: "B", anio: 2020, kilometraje: 1,
    precio: 1, moneda: "ARS", dominio: "X", estado: "Disponible",
  });
  assert.equal(oculto.mostrarPrecio, false);
  const visible = mapearVehiculo({
    id: 2, marca: "A", modelo: "B", anio: 2020, kilometraje: 1,
    precio: 1, moneda: "ARS", dominio: "Y", estado: "Disponible",
    mostrar_precio: 1,
  });
  assert.equal(visible.mostrarPrecio, true);
});

test("mapearVehiculoDesdeGist reconstruye el vehículo local desde el catálogo", () => {
  const publicado = mapearVehiculo({
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
    equipamiento: ["Aire acondicionado"],
    imagenes_url: ["https://a.com/1.jpg"],
    estado: "Reservado",
    created_at: "2026-01-15 10:00:00",
    updated_at: "2026-02-01 12:30:00",
  });
  const local = mapearVehiculoDesdeGist(publicado);
  assert.equal(local.marca, "Toyota");
  assert.equal(local.modelo, "Hilux");
  assert.equal(local.dominio, "AB123CD");
  assert.equal(local.estado, "Reservado");
  assert.equal(local.kilometraje, 0);
  assert.equal(local.precio, 45000);
  assert.equal(local.mostrar_precio, false);
  assert.equal(local.fecha_ingreso, "2026-01-15");
  assert.deepEqual(local.imagenes_url, ["https://a.com/1.jpg"]);
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

test("mapearVehiculo no publica fotos locales /uploads, solo links https públicos", () => {
  const vehiculo = mapearVehiculo({
    id: 1, marca: "Ford", modelo: "Focus", anio: 2018, kilometraje: 1,
    precio: 8000, moneda: "USD", dominio: "X", estado: "Disponible",
    equipamiento: [], created_at: "2026-01-01", updated_at: "2026-01-01",
    imagenes_url: [
      "/uploads/foto-local.jpg",
      "https://ejemplo.com/hilux.jpg",
      "http://localhost:3000/uploads/otra.jpg",
    ],
  });
  assert.deepEqual(vehiculo.fotos, ["https://ejemplo.com/hilux.jpg"]);
});

test("mapearVehiculo publica videos de YouTube aparte y conserva el orden en media", () => {
  const vehiculo = mapearVehiculo({
    id: 2, marca: "Ford", modelo: "Ranger", anio: 2022, kilometraje: 1,
    precio: 8000, moneda: "USD", dominio: "X", estado: "Disponible",
    equipamiento: [], created_at: "2026-01-01", updated_at: "2026-01-01",
    imagenes_url: [
      "https://ejemplo.com/frente.jpg",
      "https://www.youtube.com/watch?v=abcdefghijk",
      "https://ejemplo.com/interior.jpg",
    ],
  });
  assert.deepEqual(vehiculo.fotos, [
    "https://ejemplo.com/frente.jpg",
    "https://ejemplo.com/interior.jpg",
  ]);
  assert.equal(vehiculo.videos.length, 1);
  assert.equal(vehiculo.videos[0].url, "https://www.youtube.com/watch?v=abcdefghijk");
  assert.deepEqual(vehiculo.media.map((item) => item.tipo), ["foto", "video", "foto"]);
});

test("mergeSiteConfig prioriza los valores locales, pero no pisa con vacíos", () => {
  const gistSite = { name: "GyG viejo", tagline: "Tagline viejo", whatsapp: "111", footerText: "pie", heroImage: "img.jpg" };

  const conDatosLocales = mergeSiteConfig(gistSite, { nombre: "GyG nuevo", tagline: "", whatsapp: "222" });
  assert.equal(conDatosLocales.name, "G&G nuevo");
  assert.equal(conDatosLocales.tagline, "Tagline viejo"); // vacío local no pisa
  assert.equal(conDatosLocales.whatsapp, "222");
  assert.equal(conDatosLocales.footerText, "pie");

  const sinConfigLocal = mergeSiteConfig(gistSite, {});
  assert.equal(sinConfigLocal.name, "G&G viejo");
  assert.equal(sinConfigLocal.instagram, "");
  assert.equal(sinConfigLocal.contactoTitulo, "Contactanos");
});

test("mergeSiteConfig puede vaciar Instagram/Facebook si el panel manda el campo vacío", () => {
  const gistSite = { instagram: "https://instagram.com/viejo", facebook: "https://facebook.com/viejo" };
  const limpio = mergeSiteConfig(gistSite, { instagram: "", facebook: "" });
  assert.equal(limpio.instagram, "");
  assert.equal(limpio.facebook, "");
});

test("mergeSiteConfig publica la dirección para el mapa de Contacto", () => {
  const conDir = mergeSiteConfig({}, { direccion: "Av. San Martín 100, Resistencia" });
  assert.equal(conDir.direccion, "Av. San Martín 100, Resistencia");
  const limpio = mergeSiteConfig({ direccion: "vieja" }, { direccion: "" });
  assert.equal(limpio.direccion, "");
  const gistGana = mergeSiteConfig({ direccion: "del gist" }, {});
  assert.equal(gistGana.direccion, "del gist");
});

test("construirStockJson no publica los vehículos vendidos", () => {
  const stock = construirStockJson({
    gistActual: null,
    vehiculos: [
      { id: 1, marca: "A", modelo: "Uno", anio: 2020, kilometraje: 1, precio: 1, moneda: "ARS", dominio: "AA", estado: "Disponible" },
      { id: 2, marca: "B", modelo: "Dos", anio: 2020, kilometraje: 1, precio: 1, moneda: "ARS", dominio: "BB", estado: "Vendido" },
      { id: 3, marca: "C", modelo: "Tres", anio: 2020, kilometraje: 1, precio: 1, moneda: "ARS", dominio: "CC", estado: "Reservado" },
    ],
    siteConfig: { nombre: "GyG" },
  });
  assert.deepEqual(stock.vehicles.map((v) => v.id), ["gyg-001", "gyg-003"]);
  assert.deepEqual(
    vehiculosParaCatalogo([{ estado: "Vendido" }, { status: "vendido" }, { estado: "Disponible" }]).map((v) => v.estado || "ok"),
    ["Disponible"]
  );
});

test("construirStockJson conserva las páginas existentes y usa DEFAULT_PAGES si no hay ninguna", () => {
  const conPaginasPropias = construirStockJson({
    gistActual: { site: {}, pages: [{ id: "custom", slug: "custom" }] },
    vehiculos: [],
    siteConfig: {},
  });
  assert.equal(conPaginasPropias.pages[0].id, "custom");
  assert.ok(conPaginasPropias.pages.some((p) => p.id === "vender"));

  const sinGistPrevio = construirStockJson({ gistActual: null, vehiculos: [], siteConfig: { nombre: "GyG" } });
  assert.deepEqual(sinGistPrevio.pages, DEFAULT_PAGES);
  assert.ok(sinGistPrevio.pages.some((p) => p.id === "vender"));
  assert.equal(sinGistPrevio.site.name, "G&G");
  assert.equal(sinGistPrevio.meta.concesionaria, "G&G");
  assert.ok(sinGistPrevio.meta.updatedAt);
});

test("mergePages pone Contactanos en la página de contacto y deja las demás igual", () => {
  const pages = mergePages(
    [
      { id: "custom", slug: "custom", content: { headline: "X" } },
      { id: "contacto", slug: "contacto", content: { headline: "Hablemos" } },
    ],
    { contactoTitulo: "Contactanos", contactoTexto: "Escribinos." }
  );
  assert.equal(pages[0].content.headline, "X");
  const vender = pages.find((p) => p.id === "vender");
  assert.ok(vender);
  const contacto = pages.find((p) => p.id === "contacto");
  assert.equal(contacto.content.headline, "Contactanos");
  assert.equal(contacto.content.subtitle, "Escribinos.");
});

test("normalizarCopiaPagina acorta 0 km y Usados para que no se corten en el celular", () => {
  const cero = normalizarCopiaPagina({
    id: "0km",
    slug: "0km",
    title: "0 kilómetros",
    navLabel: "0km",
    content: { headline: "0 kilómetros" },
  });
  assert.equal(cero.title, "0 km");
  assert.equal(cero.navLabel, "0 km");
  assert.equal(cero.content.headline, "0 km");

  const usados = normalizarCopiaPagina({
    id: "usados",
    slug: "usados",
    content: { headline: "Usados seleccionados" },
  });
  assert.equal(usados.content.headline, "Usados");

  const home = normalizarCopiaPagina({
    id: "home",
    slug: "",
    type: "home",
    content: {
      ctaPrimary: { label: "Ver 0km", href: "#/0km" },
      highlights: [
        { title: "0 kilómetros", href: "#/0km" },
        { title: "Usados seleccionados", href: "#/usados" },
      ],
    },
  });
  assert.equal(home.content.ctaPrimary.label, "Ver 0 km");
  assert.equal(home.content.highlights[0].title, "0 km");
  assert.equal(home.content.highlights[1].title, "Usados");
});

test("construirStockJson pisa la foto de inicio del Gist con la del panel", () => {
  const publicado = construirStockJson({
    gistActual: {
      site: { heroImage: "https://images.unsplash.com/vieja.jpg" },
      pages: [
        {
          id: "home",
          slug: "",
          type: "home",
          content: { heroImage: "https://images.unsplash.com/vieja.jpg", headline: "G&G" },
        },
      ],
    },
    vehiculos: [],
    siteConfig: { heroImage: "https://i.ibb.co/nueva.jpg", nombre: "G&G" },
  });
  const home = publicado.pages.find((p) => p.id === "home");
  assert.equal(publicado.site.heroImage, "https://i.ibb.co/nueva.jpg");
  assert.equal(home.content.heroImage, "https://i.ibb.co/nueva.jpg");
});

test("normalizarCopiaPagina cambia GyG a G&G en títulos visibles", () => {
  const contacto = normalizarCopiaPagina({
    id: "contacto",
    slug: "contacto",
    content: { eyebrow: "GyG", headline: "Contactanos", body: "Escribile a GyG." },
  });
  assert.equal(contacto.content.eyebrow, "G&G");
  assert.equal(contacto.content.body, "Escribile a G&G.");
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

test("obtenerGistActual reintenta sin token si GitHub rechaza las credenciales", async () => {
  const fetchImpl = fetchFalso([
    { status: 401, body: {} },
    { status: 200, body: { files: { "stock.json": { content: JSON.stringify({ site: { name: "X" } }) } } } },
  ]);
  const data = await obtenerGistActual({ gistId: "abc", token: "token-falso", fetchImpl });
  assert.equal(data.site.name, "X");
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
  assert.equal(resultado.fotosLocalesOmitidas, 0);
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
    (err) => {
      assert.match(err.message, /token de GitHub es inválido/);
      assert.equal(err.status, 502);
      return true;
    }
  );
});

test("publicarEnGist traduce un 404 de GitHub al editar el Gist", async () => {
  const fetchImpl = fetchFalso([
    { status: 200, body: { files: {} } },
    { status: 404, body: {} },
  ]);

  await assert.rejects(
    () =>
      publicarEnGist({
        gistId: "abc",
        token: "token-de-otra-cuenta",
        vehiculos: [],
        siteConfig: {},
        fetchImpl,
      }),
    /misma cuenta/
  );
});
