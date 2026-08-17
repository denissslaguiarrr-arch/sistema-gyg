// Publica el stock (y la configuración del sitio) en el Gist que alimenta
// el catálogo público (ej. embebido en Blogger). Solo reemplaza "vehicles"
// y fusiona "site"; conserva "pages" tal cual estén en el Gist, ya que acá
// no hay una pantalla para editar la estructura de páginas.

const { fotosParaCatalogo, mediaParaCatalogo } = require("../utils/fotos");

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
    id: "0km", slug: "0km", title: "0 kilómetros", navLabel: "0km", type: "stock",
    visible: true, order: 1, filter: { categoria: "0km" },
    content: { eyebrow: "Catálogo", headline: "0 kilómetros", subtitle: "Unidades nuevas." },
  },
  {
    id: "usados", slug: "usados", title: "Usados", navLabel: "Usados", type: "stock",
    visible: true, order: 2, filter: { categoria: "usado" },
    content: { eyebrow: "Catálogo", headline: "Usados", subtitle: "Selección revisada." },
  },
  {
    id: "stock", slug: "stock", title: "Stock", navLabel: "Stock", type: "stock",
    visible: true, order: 3, filter: {},
    content: { eyebrow: "Catálogo", headline: "Todo el stock", subtitle: "0km y usados." },
  },
  {
    id: "contacto", slug: "contacto", title: "Contacto", navLabel: "Contacto", type: "content",
    visible: true, order: 4, filter: {},
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
    name: cfg.nombre || gs.name || "",
    tagline: cfg.tagline || gs.tagline || "",
    whatsapp: cfg.whatsapp || gs.whatsapp || "",
    instagram: tiene(cfg, "instagram") ? cfg.instagram || "" : gs.instagram || "",
    facebook: tiene(cfg, "facebook") ? cfg.facebook || "" : gs.facebook || "",
    contactoTitulo: cfg.contactoTitulo || gs.contactoTitulo || "Contactanos",
    contactoTexto: cfg.contactoTexto || gs.contactoTexto || "",
    footerText: cfg.footerText || gs.footerText || "",
    heroImage: cfg.heroImage || gs.heroImage || "",
  };
}

function esPaginaContacto(page) {
  return page && (page.id === "contacto" || page.slug === "contacto");
}

function mergePages(gistPages, site) {
  const base =
    Array.isArray(gistPages) && gistPages.length
      ? gistPages
      : DEFAULT_PAGES;
  return base.map((page) => {
    if (!esPaginaContacto(page)) return page;
    const content = page.content && typeof page.content === "object" ? { ...page.content } : {};
    content.headline = (site && site.contactoTitulo) || "Contactanos";
    if (site && site.contactoTexto) content.subtitle = site.contactoTexto;
    content.showWhatsapp = true;
    return { ...page, content };
  });
}

async function obtenerGistActual({ gistId, token, fetchImpl = fetch }) {
  const res = await fetchImpl(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 404) {
    const err = new Error("No se encontró el Gist. Revisá GYG_GIST_ID.");
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`No se pudo leer el Gist (código ${res.status})`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const archivo = data.files && data.files["stock.json"];
  if (!archivo || !archivo.content) return {};

  try {
    return JSON.parse(archivo.content);
  } catch (_err) {
    return {};
  }
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
    const err = new Error("El token de GitHub es inválido o no tiene permiso 'gist'.");
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    const err = new Error(
      `No se pudo publicar en el Gist (código ${res.status}): ${texto.slice(0, 200)}`
    );
    err.status = res.status;
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
  DEFAULT_PAGES,
  mapearEstado,
  mapearVehiculo,
  mergeSiteConfig,
  mergePages,
  construirStockJson,
  obtenerGistActual,
  publicarEnGist,
};
