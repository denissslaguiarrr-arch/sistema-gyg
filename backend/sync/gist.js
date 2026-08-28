// Publica el stock (y la configuración del sitio) en el Gist que alimenta
// el catálogo público (ej. embebido en Blogger). Solo reemplaza "vehicles"
// y fusiona "site"; conserva "pages" tal cual estén en el Gist, ya que acá
// no hay una pantalla para editar la estructura de páginas.

const { fotosParaCatalogo, mediaParaCatalogo } = require("../utils/fotos");
const { reescribirMarca, reescribirMarcaEn } = require("../utils/marca");

const ESTADO_A_STATUS = {
  Disponible: "disponible",
  Reservado: "reservado",
  Vendido: "vendido",
};

const DEFAULT_PAGES = [
  {
    id: "home", slug: "", title: "Inicio", navLabel: "Inicio", type: "home",
    visible: true, order: 0, filter: {},
    content: {
      eyebrow: "Concesionaria", headline: "", subtitle: "",
      ctaPrimary: { label: "Ver stock", href: "#/stock" },
      ctaSecondary: { label: "Ver usados", href: "#/usados" },
      heroImage: "", highlights: [],
    },
  },
  {
    id: "0km", slug: "0km", title: "0 km", navLabel: "0 km", type: "stock",
    visible: true, order: 1, filter: { categoria: "0km" },
    content: { eyebrow: "Catálogo", headline: "0 km", subtitle: "Unidades nuevas." },
  },
  {
    id: "usados", slug: "usados", title: "Usados", navLabel: "Usados", type: "stock",
    visible: true, order: 2, filter: { categoria: "usado" },
    content: { eyebrow: "Catálogo", headline: "Usados", subtitle: "Selección revisada." },
  },
  {
    id: "stock", slug: "stock", title: "Stock", navLabel: "Stock", type: "stock",
    visible: true, order: 3, filter: {},
    content: { eyebrow: "Catálogo", headline: "Todo el stock", subtitle: "0 km y usados." },
  },
  {
    id: "vender", slug: "vender", title: "Vendé tu auto", navLabel: "Vendé tu auto", type: "vender",
    visible: true, order: 4, filter: {},
    content: {
      eyebrow: "Compra y consignación",
      headline: "Vendé tu auto",
      subtitle: "Lo tasamos, lo mostramos y te hacemos una propuesta. Compra directa o consignación.",
    },
  },
  {
    id: "contacto", slug: "contacto", title: "Contacto", navLabel: "Contacto", type: "content",
    visible: true, order: 5, filter: {},
    content: {
      eyebrow: "Contacto", headline: "Contactanos",
      subtitle: "Consultá disponibilidad, financiación o una visita al showroom.",
      showWhatsapp: true,
    },
  },
];

function mapearEstado(estado) {
  return ESTADO_A_STATUS[estado] || "disponible";
}

// Recibe un vehículo ya serializado (con imagenes_url/equipamiento como
// arreglos y destacado como booleano, tal como lo devuelve la API).
function mapearVehiculo(v) {
  const ingreso = (v.created_at || "").slice(0, 10);
  const updatedAtIso = v.updated_at
    ? new Date(`${String(v.updated_at).replace(" ", "T")}Z`).toISOString()
    : new Date().toISOString();
  const catalogo = mediaParaCatalogo(v.imagenes_url);
  const fotos =
    catalogo.fotos.length > 0
      ? catalogo.fotos
      : catalogo.videos.map((item) => item.thumbnail).filter(Boolean).slice(0, 1);

  return {
    id: `gyg-${String(v.id).padStart(3, "0")}`,
    status: mapearEstado(v.estado),
    categoria: v.kilometraje === 0 ? "0km" : "usado",
    marca: v.marca,
    modelo: v.modelo,
    version: v.version || "",
    anio: v.anio,
    km: v.kilometraje,
    precio: v.precio,
    precio_oferta: v.precio_oferta ?? null,
    moneda: v.moneda,
    combustible: v.combustible || "",
    transmision: v.transmision || "",
    traccion: v.traccion || "",
    puertas: v.puertas ?? null,
    color: v.color || "",
    motor: v.motor || "",
    potencia: v.potencia || "",
    carroceria: v.carroceria || "",
    patente: v.dominio,
    destacado: !!v.destacado,
    descripcion: v.notas || "",
    equipamiento: Array.isArray(v.equipamiento) ? v.equipamiento : [],
    fotos,
    videos: catalogo.videos,
    media: catalogo.media,
    ingreso,
    updatedAt: updatedAtIso,
  };
}

function tiene(obj, clave) {
  return obj && Object.prototype.hasOwnProperty.call(obj, clave);
}

// Nuestros campos ganan solo si tienen contenido; si todavía no configuraste
// "Configuración del sitio", no se pisa lo que ya hay publicado en el Gist.
// Instagram/Facebook sí se pueden vaciar: si el panel manda el campo vacío,
// la red deja de mostrarse en el catálogo.
function mergeSiteConfig(gistSite, config) {
  const gs = gistSite && typeof gistSite === "object" ? gistSite : {};
  const cfg = config || {};
  return {
    name: reescribirMarca(cfg.nombre || gs.name || ""),
    tagline: reescribirMarca(cfg.tagline || gs.tagline || ""),
    whatsapp: cfg.whatsapp || gs.whatsapp || "",
    instagram: tiene(cfg, "instagram") ? cfg.instagram || "" : gs.instagram || "",
    facebook: tiene(cfg, "facebook") ? cfg.facebook || "" : gs.facebook || "",
    contactoTitulo: reescribirMarca(cfg.contactoTitulo || gs.contactoTitulo || "Contactanos"),
    contactoTexto: reescribirMarca(cfg.contactoTexto || gs.contactoTexto || ""),
    footerText: reescribirMarca(cfg.footerText || gs.footerText || ""),
    heroImage: cfg.heroImage || gs.heroImage || "",
  };
}

function esPaginaContacto(page) {
  return page && (page.id === "contacto" || page.slug === "contacto");
}

function esPaginaVender(page) {
  return page && (page.id === "vender" || page.slug === "vender");
}

function paginaVenderPorDefecto() {
  return {
    id: "vender",
    slug: "vender",
    title: "Vendé tu auto",
    navLabel: "Vendé tu auto",
    type: "vender",
    visible: true,
    order: 4,
    filter: {},
    content: {
      eyebrow: "Compra y consignación",
      headline: "Vendé tu auto",
      subtitle: "Lo tasamos, lo mostramos y te hacemos una propuesta. Compra directa o consignación.",
    },
  };
}

function esPaginaCeroKm(page) {
  return page && (page.id === "0km" || page.slug === "0km");
}

function esPaginaUsados(page) {
  return page && (page.id === "usados" || page.slug === "usados");
}

function esPaginaHome(page) {
  return page && (page.id === "home" || page.slug === "" || page.type === "home");
}

function normalizarCopiaPagina(page, site) {
  if (!page || typeof page !== "object") return page;
  const next = { ...page };
  const content = page.content && typeof page.content === "object" ? { ...page.content } : {};

  if (esPaginaCeroKm(next)) {
    next.title = "0 km";
    next.navLabel = "0 km";
    content.headline = "0 km";
  }

  if (esPaginaUsados(next)) {
    const largo = /seleccion/i.test(String(content.headline || next.title || ""));
    if (largo || !content.headline) content.headline = "Usados";
    next.navLabel = next.navLabel || "Usados";
  }

  if (esPaginaHome(next)) {
    // El panel guarda la portada en site.heroImage; el showroom lee primero
    // pages.home.content.heroImage. Sin esto, una foto vieja del Gist no se pisa.
    const hero = site && String(site.heroImage || "").trim();
    if (hero) content.heroImage = hero;
    if (Array.isArray(content.highlights)) {
      content.highlights = content.highlights.map((h) => {
        if (!h || typeof h !== "object") return h;
        const title = String(h.title || "");
        if (/0\s*kil/i.test(title) || /^0\s*km$/i.test(title) || /^0km$/i.test(title)) {
          return { ...h, title: "0 km" };
        }
        if (/usados seleccion/i.test(title)) return { ...h, title: "Usados" };
        return h;
      });
    }
  }
  if (content.ctaPrimary && /ver\s*0km/i.test(String(content.ctaPrimary.label || ""))) {
    content.ctaPrimary = { ...content.ctaPrimary, label: "Ver 0 km" };
  }

  next.content = content;
  return reescribirMarcaEn(next);
}

function insertarPaginaVender(pages) {
  const lista = Array.isArray(pages) ? pages.map((p) => ({ ...p })) : [];
  if (lista.some(esPaginaVender)) return lista;
  const page = paginaVenderPorDefecto();
  const idx = lista.findIndex(esPaginaContacto);
  if (idx === -1) {
    page.order = lista.length;
    lista.push(page);
    return lista;
  }
  page.order = Number.isFinite(Number(lista[idx].order)) ? Number(lista[idx].order) : idx;
  lista.splice(idx, 0, page);
  for (let i = idx + 1; i < lista.length; i += 1) {
    lista[i] = { ...lista[i], order: Number(lista[i].order || i) + 1 };
  }
  return lista;
}

function mergePages(gistPages, site) {
  const base = insertarPaginaVender(
    Array.isArray(gistPages) && gistPages.length ? gistPages : DEFAULT_PAGES
  );
  return base.map((page) => {
    const next = normalizarCopiaPagina(page, site);
    if (!esPaginaContacto(next)) return next;
    const content = next.content && typeof next.content === "object" ? { ...next.content } : {};
    content.headline = (site && site.contactoTitulo) || "Contactanos";
    if (site && site.contactoTexto) content.subtitle = site.contactoTexto;
    content.showWhatsapp = true;
    return { ...next, content };
  });
}

const STATUS_A_ESTADO = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

function mapearEstadoDesdeGist(status) {
  const clave = String(status || "").trim().toLowerCase();
  return STATUS_A_ESTADO[clave] || "Disponible";
}

function urlsDesdeGist(v) {
  if (Array.isArray(v.media) && v.media.length) {
    return v.media
      .map((item) => (typeof item === "string" ? item : item && item.url))
      .map((url) => String(url || "").trim())
      .filter(Boolean);
  }
  const fotos = Array.isArray(v.fotos) ? v.fotos : [];
  const videos = Array.isArray(v.videos)
    ? v.videos.map((item) => (typeof item === "string" ? item : item && item.url))
    : [];
  return [...fotos, ...videos].map((url) => String(url || "").trim()).filter(Boolean);
}

function mapearVehiculoDesdeGist(v = {}) {
  const moneda = String(v.moneda || "ARS").trim().toUpperCase() || "ARS";
  return {
    marca: String(v.marca || "").trim(),
    modelo: String(v.modelo || "").trim(),
    anio: v.anio,
    dominio: String(v.patente || v.dominio || "").trim(),
    kilometraje: v.km ?? v.kilometraje ?? 0,
    precio: v.precio,
    precio_oferta: v.precio_oferta,
    moneda: moneda === "USD" ? "USD" : "ARS",
    estado: mapearEstadoDesdeGist(v.status || v.estado),
    notas: String(v.descripcion || v.notas || "").trim(),
    imagenes_url: urlsDesdeGist(v),
    version: String(v.version || "").trim(),
    combustible: String(v.combustible || "").trim(),
    transmision: String(v.transmision || "").trim(),
    traccion: String(v.traccion || "").trim(),
    puertas: v.puertas,
    color: String(v.color || "").trim(),
    motor: String(v.motor || "").trim(),
    potencia: String(v.potencia || "").trim(),
    carroceria: String(v.carroceria || "").trim(),
    destacado: !!v.destacado,
    equipamiento: Array.isArray(v.equipamiento) ? v.equipamiento : [],
    fecha_ingreso: String(v.ingreso || v.fecha_ingreso || "").trim().slice(0, 10),
  };
}

async function parsearArchivoStock(archivo, fetchImpl = fetch) {
  if (!archivo) return {};
  let texto = archivo.content || "";
  if (archivo.truncated && archivo.raw_url) {
    const raw = await fetchImpl(archivo.raw_url);
    if (raw.ok) texto = await raw.text();
  }
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch (_err) {
    return {};
  }
}

function errorTokenGithub() {
  const err = new Error(
    "El token de GitHub es inválido o no tiene permiso 'gist'. Creá uno nuevo (classic, tilde en gist) en la MISMA cuenta que creó el Gist y pegalo en Configuración del sitio."
  );
  // 502: no es la sesión del panel. Un 401 acá hacía que el navegador te mande al login.
  err.status = 502;
  return err;
}

async function pedirGist({ gistId, token, fetchImpl }) {
  return fetchImpl(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function obtenerGistActual({ gistId, token, fetchImpl = fetch }) {
  let res = await pedirGist({ gistId, token, fetchImpl });
  // Un token de ejemplo o vencido hace que GitHub rechace hasta un Gist público.
  if ((res.status === 401 || res.status === 403) && token) {
    res = await pedirGist({ gistId, token: "", fetchImpl });
    if (res.status === 401 || res.status === 403) throw errorTokenGithub();
  }

  if (res.status === 404) {
    const err = new Error("No se encontró el Gist. Revisá el ID en Configuración del sitio.");
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`No se pudo leer el Gist (código ${res.status})`);
    err.status = res.status === 401 || res.status === 403 ? 502 : res.status;
    throw err;
  }

  const data = await res.json();
  return parsearArchivoStock(data.files && data.files["stock.json"], fetchImpl);
}

function construirStockJson({ gistActual, vehiculos, siteConfig }) {
  const actual = gistActual && typeof gistActual === "object" ? gistActual : {};
  const site = mergeSiteConfig(actual.site, siteConfig);

  return {
    meta: {
      concesionaria: site.name || "Concesionaria",
      updatedAt: new Date().toISOString(),
    },
    site,
    pages: mergePages(actual.pages, site),
    vehicles: vehiculos.map(mapearVehiculo),
  };
}

async function publicarEnGist({ gistId, token, vehiculos, siteConfig, fetchImpl = fetch }) {
  if (!gistId) {
    const err = new Error(
      "Falta el ID del Gist. Pegalo en Configuración del sitio o en GYG_GIST_ID."
    );
    err.status = 400;
    throw err;
  }
  if (!token) {
    const err = new Error(
      "Falta el token de GitHub. Pegalo en Configuración del sitio (permiso gist) o en GYG_GITHUB_TOKEN."
    );
    err.status = 400;
    throw err;
  }

  const gistActual = await obtenerGistActual({ gistId, token, fetchImpl });
  const payload = construirStockJson({ gistActual, vehiculos, siteConfig });

  const res = await fetchImpl(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: { "stock.json": { content: JSON.stringify(payload, null, 2) } },
    }),
  });

  if (res.status === 401 || res.status === 403) {
    throw errorTokenGithub();
  }
  if (res.status === 404) {
    const err = new Error(
      "GitHub no dejó editar el Gist. El token es de otra cuenta o el ID está mal. Tiene que ser de la misma cuenta que creó el Gist."
    );
    err.status = 502;
    throw err;
  }
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    const err = new Error(
      `No se pudo publicar en el Gist (código ${res.status}): ${texto.slice(0, 200)}`
    );
    err.status = res.status === 401 || res.status === 403 ? 502 : res.status;
    throw err;
  }

  const data = await res.json();
  const fotosLocalesOmitidas = vehiculos.reduce(
    (total, v) => total + fotosParaCatalogo(v.imagenes_url).omitidasLocales,
    0
  );
  return {
    payload,
    htmlUrl: data.html_url,
    vehiculosPublicados: payload.vehicles.length,
    fotosLocalesOmitidas,
  };
}

module.exports = {
  ESTADO_A_STATUS,
  STATUS_A_ESTADO,
  DEFAULT_PAGES,
  mapearEstado,
  mapearEstadoDesdeGist,
  mapearVehiculo,
  mapearVehiculoDesdeGist,
  mergeSiteConfig,
  mergePages,
  insertarPaginaVender,
  normalizarCopiaPagina,
  reescribirMarca,
  construirStockJson,
  obtenerGistActual,
  publicarEnGist,
};
