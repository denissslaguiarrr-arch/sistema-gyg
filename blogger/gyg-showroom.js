(function () {
  var l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css?family=Syne:500,600,700,800|Manrope:400,500,600,700";
  document.head.appendChild(l);
})();

window.GYG_CONFIG = {
  GIST_ID: "74837d1c1f0a9a3a67e6dc5cc4fa5b6f",
  GIST_FILENAME: "stock.json",
  WHATSAPP_NUMBER: "+54 9 3735 46-2914",
  DEALERSHIP_NAME: "G\u0026G",
  TAGLINE: "Selección premium de vehículos",
  LOCAL_SAMPLE_PATH: "",
};

(function (global) {
  const TOKEN_KEY = "gyg_gh_token";
  const GIST_KEY = "gyg_gist_id";

  function cfg() {
    return global.GYG_CONFIG || {};
  }

  function reescribirMarca(texto) {
    return String(texto == null ? "" : texto).replace(/\bg\s*y\s*g\b(?![\w-])/gi, "G\u0026G");
  }

  function reescribirMarcaEn(valor) {
    const skip = { instagram: 1, facebook: 1, whatsapp: 1, heroImage: 1, href: 1, url: 1 };
    if (valor == null) return valor;
    if (typeof valor === "string") return reescribirMarca(valor);
    if (Array.isArray(valor)) return valor.map(reescribirMarcaEn);
    if (typeof valor === "object") {
      const out = { ...valor };
      Object.keys(valor).forEach((clave) => {
        out[clave] = skip[clave] ? valor[clave] : reescribirMarcaEn(valor[clave]);
      });
      return out;
    }
    return valor;
  }

  function displayBrandName(value) {
    const n = reescribirMarca(value).trim();
    if (!n) return "G\u0026G";
    return n;
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token.trim());
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function getGistId() {
    const fromStorage = (localStorage.getItem(GIST_KEY) || "").trim();
    if (fromStorage) return fromStorage;

    try {
      const params = new URLSearchParams(location.search || "");
      const fromQuery = (params.get("gist") || "").trim();
      if (fromQuery) {
        localStorage.setItem(GIST_KEY, fromQuery);
        return fromQuery;
      }
    } catch (_) {}

    return (cfg().GIST_ID || "").trim();
  }

  function setGistId(id) {
    const value = (id || "").trim();
    if (value) localStorage.setItem(GIST_KEY, value);
    else localStorage.removeItem(GIST_KEY);
    if (global.GYG_CONFIG) global.GYG_CONFIG.GIST_ID = value;
  }

  function clearStoredGistId() {
    try {
      localStorage.removeItem(GIST_KEY);
    } catch (_) {}
  }

  function defaultSite() {
    return {
      name: cfg().DEALERSHIP_NAME || "G\u0026G",
      tagline: cfg().TAGLINE || "Selección premium de vehículos",
      whatsapp: cfg().WHATSAPP_NUMBER || "",
      instagram: "",
      facebook: "",
      contactoTitulo: "Contactanos",
      contactoTexto: "",
      direccion: "",
      footerText: "G\u0026G Automotores",
      heroImage: "",
    };
  }

  function defaultPages() {
    return [
      {
        id: "home",
        slug: "",
        title: "Inicio",
        navLabel: "Inicio",
        type: "home",
        visible: true,
        order: 0,
        content: {
          eyebrow: "Concesionaria",
          headline: "G\u0026G",
          subtitle: "Stock 0 km y usados.",
          ctaPrimary: { label: "Ver 0 km", href: "#/0km" },
          ctaSecondary: { label: "Ver usados", href: "#/usados" },
          heroImage: "",
          highlights: [],
        },
      },
      {
        id: "0km",
        slug: "0km",
        title: "0 km",
        navLabel: "0 km",
        type: "stock",
        visible: true,
        order: 1,
        filter: { categoria: "0km" },
        content: { eyebrow: "Catálogo", headline: "0 km", subtitle: "Unidades nuevas." },
      },
      {
        id: "usados",
        slug: "usados",
        title: "Usados",
        navLabel: "Usados",
        type: "stock",
        visible: true,
        order: 2,
        filter: { categoria: "usado" },
        content: { eyebrow: "Catálogo", headline: "Usados", subtitle: "Selección revisada." },
      },
      {
        id: "stock",
        slug: "stock",
        title: "Stock",
        navLabel: "Stock",
        type: "stock",
        visible: true,
        order: 3,
        filter: {},
        content: { eyebrow: "Catálogo", headline: "Todo el stock", subtitle: "0 km y usados." },
      },
      {
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
      },
      {
        id: "contacto",
        slug: "contacto",
        title: "Contacto",
        navLabel: "Contacto",
        type: "content",
        visible: true,
        order: 5,
        filter: {},
        content: {
          eyebrow: "Contacto",
          headline: "Contactanos",
          subtitle: "Consultá disponibilidad, financiación o una visita al showroom.",
          showWhatsapp: true,
        },
      },
    ];
  }

  function ensureVenderPage(pages) {
    const lista = Array.isArray(pages) ? pages.slice() : [];
    if (lista.some((p) => p.id === "vender" || p.slug === "vender")) return lista;
    const page = {
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
    const idx = lista.findIndex((p) => p.id === "contacto" || p.slug === "contacto");
    if (idx === -1) {
      page.order = lista.length;
      lista.push(page);
      return lista;
    }
    page.order = Number(lista[idx].order) || idx;
    lista.splice(idx, 0, page);
    for (let i = idx + 1; i < lista.length; i += 1) {
      lista[i] = { ...lista[i], order: Number(lista[i].order || i) + 1 };
    }
    return lista;
  }

  function normalizePageCopy(page) {
    const next = { ...page };
    const content = page.content && typeof page.content === "object" ? { ...page.content } : {};
    const id = String(page.id || "");
    const slug = String(page.slug || "");

    if (id === "0km" || slug === "0km") {
      next.title = "0 km";
      next.navLabel = "0 km";
      content.headline = "0 km";
    }
    if (id === "usados" || slug === "usados") {
      if (!content.headline || /seleccion/i.test(String(content.headline))) {
        content.headline = "Usados";
      }
    }
    if ((id === "home" || slug === "" || page.type === "home") && Array.isArray(content.highlights)) {
      content.highlights = content.highlights.map((h) => {
        if (!h || typeof h !== "object") return h;
        const title = String(h.title || "");
        if (/0\s*kil/i.test(title) || /^0km$/i.test(title)) return { ...h, title: "0 km" };
        if (/usados seleccion/i.test(title)) return { ...h, title: "Usados" };
        return h;
      });
    }
    if (content.ctaPrimary && /ver\s*0km/i.test(String(content.ctaPrimary.label || ""))) {
      content.ctaPrimary = { ...content.ctaPrimary, label: "Ver 0 km" };
    }
    next.content = content;
    return reescribirMarcaEn(next);
  }

  function normalizeData(data) {
    const raw = data && typeof data === "object" ? data : {};
    const site = reescribirMarcaEn({ ...defaultSite(), ...(raw.site || {}) });
    if (!site.whatsapp && cfg().WHATSAPP_NUMBER) site.whatsapp = cfg().WHATSAPP_NUMBER;
    if (!site.contactoTitulo) site.contactoTitulo = "Contactanos";

    let pages = Array.isArray(raw.pages) && raw.pages.length ? raw.pages : defaultPages();
    pages = pages
      .map((p, i) => ({
        id: p.id || `page-${i}`,
        slug: p.slug == null ? String(p.id || "") : String(p.slug),
        title: p.title || p.navLabel || p.id || "Página",
        navLabel: p.navLabel || p.title || p.id || "Página",
        type: p.type || "stock",
        visible: p.visible !== false,
        order: Number.isFinite(Number(p.order)) ? Number(p.order) : i,
        filter: p.filter && typeof p.filter === "object" ? p.filter : {},
        content: p.content && typeof p.content === "object" ? p.content : {},
      }))
      .sort((a, b) => a.order - b.order);
    pages = ensureVenderPage(pages).map(normalizePageCopy);

    const vehicles = Array.isArray(raw.vehicles)
      ? raw.vehicles.map((v) => ({
          ...v,
          categoria: v.categoria || (Number(v.km) <= 100 ? "0km" : "usado"),
          mostrarPrecio: v.mostrarPrecio === true || v.mostrar_precio === true,
        }))
      : [];

    return { meta: raw.meta || {}, site, pages, vehicles };
  }

  async function fetchViaApi(gistId, filename) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`No se pudo leer el Gist (${res.status})`);
    const data = await res.json();
    const file = data.files && data.files[filename];
    if (!file) throw new Error(`No existe el archivo ${filename} en el Gist`);
    if (file.content && !file.truncated) return JSON.parse(file.content);
    const raw = file.raw_url;
    const rawRes = await fetch(`${raw}${raw.includes("?") ? "&" : "?"}t=${Date.now()}`);
    if (!rawRes.ok) throw new Error(`No se pudo descargar ${filename}`);
    return rawRes.json();
  }

  async function fetchLocalSample() {
    const path = cfg().LOCAL_SAMPLE_PATH || "data/stock.sample.json";
    const res = await fetch(`${path}?t=${Date.now()}`);
    if (!res.ok) throw new Error("No se encontró el stock de ejemplo local");
    return res.json();
  }

  function buildPayload(stock) {
    const normalized = normalizeData(stock);
    return {
      ...normalized,
      meta: {
        ...(normalized.meta || {}),
        concesionaria: normalized.site.name || cfg().DEALERSHIP_NAME || "G\u0026G",
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async function loadStock() {
    const gistId = getGistId();
    const filename = cfg().GIST_FILENAME || "stock.json";
    if (!gistId) {
      const err = new Error("MISSING_GIST_ID");
      err.code = "MISSING_GIST_ID";
      throw err;
    }
    try {
      return normalizeData(await fetchViaApi(gistId, filename));
    } catch (apiErr) {
      const localPath = (cfg().LOCAL_SAMPLE_PATH || "").trim();
      if (localPath) {
        console.warn("Gist falló, usando sample local:", apiErr);
        try {
          return normalizeData(await fetchLocalSample());
        } catch (_) {}
      }
      const err = new Error(apiErr.message || "No se pudo leer el Gist");
      err.code = "GIST_LOAD_FAILED";
      err.cause = apiErr;
      throw err;
    }
  }

  async function createGist(stock, tokenOverride) {
    const filename = cfg().GIST_FILENAME || "stock.json";
    const token = (tokenOverride || getToken() || "").trim();
    if (!token) throw new Error("Ingresá un Personal Access Token de GitHub con permiso gist.");
    const payload = buildPayload(stock);
    const res = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        description: "G\u0026G Automotores — sitio + stock",
        public: true,
        files: { [filename]: { content: JSON.stringify(payload, null, 2) } },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw new Error("Token inválido o sin permiso gist. Revisá el Personal Access Token.");
      }
      throw new Error(`No se pudo crear el Gist (${res.status}): ${errText.slice(0, 200)}`);
    }
    const created = await res.json();
    if (!created.id) throw new Error("GitHub no devolvió un ID de Gist.");
    setGistId(created.id);
    return { id: created.id, html_url: created.html_url, payload };
  }

  async function saveStock(stock, tokenOverride) {
    const gistId = getGistId();
    const filename = cfg().GIST_FILENAME || "stock.json";
    const token = (tokenOverride || getToken() || "").trim();
    if (!gistId) {
      throw new Error("Falta el GIST_ID. Pegá el ID arriba o usá «Crear Gist en la nube» con tu token.");
    }
    if (!token) throw new Error("Ingresá un Personal Access Token de GitHub con permiso gist.");
    const payload = buildPayload(stock);
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ files: { [filename]: { content: JSON.stringify(payload, null, 2) } } }),
    });
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw new Error("Token inválido o sin permiso gist. Revisá el Personal Access Token.");
      }
      throw new Error(`Error al guardar (${res.status}): ${errText.slice(0, 200)}`);
    }
    return payload;
  }

  function downloadBackup(stock, name) {
    const blob = new Blob([JSON.stringify(normalizeData(stock), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name || `gyg-site-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function muestraPrecio(v) {
    if (!v) return false;
    return v.mostrarPrecio === true || v.mostrar_precio === true;
  }

  function formatPrice(precio, moneda) {
    const m = moneda || "ARS";
    try {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: m === "USD" ? "USD" : "ARS",
        maximumFractionDigits: 0,
      }).format(Number(precio) || 0);
    } catch {
      return `${m} ${Number(precio || 0).toLocaleString("es-AR")}`;
    }
  }

  function formatKm(km) {
    return `${Number(km || 0).toLocaleString("es-AR")} km`;
  }

  function navPages(data) {
    return (data.pages || []).filter((p) => p.visible !== false);
  }

  function findPageBySlug(data, slug) {
    const s = slug == null ? "" : String(slug).replace(/^\/+|\/+$/g, "");
    return (data.pages || []).find((p) => String(p.slug || "") === s) || null;
  }

  function pageHref(page) {
    const slug = page && page.slug ? String(page.slug) : "";
    return slug ? `#/${slug}` : "#/";
  }

  function publicVehicles(data, pageFilter) {
    const list = (data && data.vehicles) || [];
    const filter = pageFilter || {};
    return list.filter((v) => {
      if (v.status !== "disponible" && v.status !== "reservado") return false;
      if (filter.categoria && v.categoria !== filter.categoria) return false;
      return true;
    });
  }

  function mapsEmbedUrl(direccion) {
    const q = String(direccion || "").trim();
    if (!q) return "";
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=es&z=15&output=embed`;
  }

  function mapsSearchUrl(direccion) {
    const q = String(direccion || "").trim();
    if (!q) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  function pickSimilarVehicles(data, vehicle, limit) {
    if (!vehicle) return [];
    const cap = Math.max(1, Math.min(8, Number(limit) || 3));
    const list = publicVehicles(data, {}).filter((v) => v && v.id !== vehicle.id);
    const marca = String(vehicle.marca || "").toLowerCase();
    const sameBrand = marca ? list.filter((v) => String(v.marca || "").toLowerCase() === marca) : [];
    const pool = sameBrand.length ? sameBrand : list;
    const precio = Number(vehicle.precio_oferta || vehicle.precio) || 0;
    return [...pool]
      .sort((a, b) => {
        const catA = a.categoria === vehicle.categoria ? 0 : 1;
        const catB = b.categoria === vehicle.categoria ? 0 : 1;
        const pa = Math.abs((Number(a.precio_oferta || a.precio) || 0) - precio);
        const pb = Math.abs((Number(b.precio_oferta || b.precio) || 0) - precio);
        return catA - catB || pa - pb;
      })
      .slice(0, cap);
  }

  // Destacados primero; completa con el resto del stock público (hasta `limit`).
  function pickCarouselVehicles(data, limit) {
    const cap = Math.max(1, Math.min(24, Number(limit) || 8));
    const list = publicVehicles(data, {});
    const peso = (v) => {
      if (v.destacado) return 2;
      if (v.status === "disponible") return 1;
      return 0;
    };
    return [...list]
      .sort((a, b) => peso(b) - peso(a) || Number(b.anio) - Number(a.anio))
      .slice(0, cap);
  }

  function findVehicle(data, id) {
    return ((data && data.vehicles) || []).find((v) => v.id === id) || null;
  }

  function whatsappPhone(data) {
    const fromSite = data && data.site && data.site.whatsapp;
    return String(fromSite || cfg().WHATSAPP_NUMBER || "").replace(/\D/g, "");
  }

  function whatsappUrl(data, vehicle, opts) {
    const phone = whatsappPhone(data);
    const nameBrand = displayBrandName(
      (data && data.site && data.site.name) || cfg().DEALERSHIP_NAME || "G\u0026G"
    );
    if (vehicle) {
      const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ""} ${vehicle.anio}`.trim();
      const consultarPrecio = opts && opts.consultarPrecio;
      const text = encodeURIComponent(
        consultarPrecio
          ? `Hola ${nameBrand}, consulto el precio del ${name} (ref: ${vehicle.id}). ¿Sigue disponible?`
          : `Hola ${nameBrand}, consulto por el ${name} (ref: ${vehicle.id}). ¿Sigue disponible?`
      );
      return `https://wa.me/${phone}?text=${text}`;
    }
    const text = encodeURIComponent(`Hola ${nameBrand}, quiero consultar por el stock.`);
    return `https://wa.me/${phone}?text=${text}`;
  }

  function createId(vehicles) {
    const n = (vehicles || []).length + 1;
    const stamp = Date.now().toString(36).slice(-4);
    return `gyg-${String(n).padStart(3, "0")}-${stamp}`;
  }

  function emptyVehicle() {
    const now = new Date().toISOString();
    return {
      id: "",
      status: "disponible",
      categoria: "usado",
      marca: "",
      modelo: "",
      version: "",
      anio: new Date().getFullYear(),
      km: 0,
      precio: 0,
      moneda: "ARS",
      combustible: "Nafta",
      transmision: "Manual",
      traccion: "Delantera",
      puertas: 4,
      color: "",
      motor: "",
      potencia: "",
      carroceria: "Sedán",
      patente: "",
      destacado: false,
      mostrarPrecio: false,
      descripcion: "",
      equipamiento: [],
      fotos: [],
      ingreso: now.slice(0, 10),
      updatedAt: now,
    };
  }

  function emptyPage() {
    return {
      id: `page-${Date.now().toString(36)}`,
      slug: "nueva",
      title: "Nueva página",
      navLabel: "Nueva",
      type: "content",
      visible: true,
      order: 99,
      filter: {},
      content: {
        eyebrow: "",
        headline: "Nueva página",
        subtitle: "",
        body: "",
        showWhatsapp: false,
        heroImage: "",
        ctaPrimary: { label: "", href: "" },
        ctaSecondary: { label: "", href: "" },
        highlights: [],
      },
    };
  }

  global.GyGStock = {
    getToken,
    setToken,
    clearToken,
    getGistId,
    setGistId,
    clearStoredGistId,
    loadStock,
    saveStock,
    createGist,
    downloadBackup,
    normalizeData,
    formatPrice,
    muestraPrecio,
    formatKm,
    navPages,
    findPageBySlug,
    pageHref,
    publicVehicles,
    pickCarouselVehicles,
    pickSimilarVehicles,
    mapsEmbedUrl,
    mapsSearchUrl,
    findVehicle,
    whatsappPhone,
    whatsappUrl,
    createId,
    emptyVehicle,
    emptyPage,
    defaultSite,
    defaultPages,
    displayBrandName,
    reescribirMarca,
  };
})(window);

(function () {
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const navEl = document.getElementById("navLinks");

  let data = { meta: {}, site: {}, pages: [], vehicles: [] };
  let filters = blankFilters();
  let activeStockSlug = "stock";
  let lightboxZoom = 1;
  let carouselTimer = null;
  let carouselResize = null;

  function blankFilters() {
    return {
      q: "",
      marca: "",
      combustible: "",
      transmision: "",
      carroceria: "",
      anioMin: "",
      anioMax: "",
      precioMax: "",
      kmMax: "",
    };
  }

  function toast(message, type) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `toast is-visible ${type === "error" ? "is-error" : type === "ok" ? "is-ok" : ""}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function displayBrandName(value) {
    return GyGStock.displayBrandName(value);
  }

  function brandMarkup(value) {
    return escapeHtml(displayBrandName(value)).replace(
      /G\u0026amp;G/g,
      "G<span class=\"brand-sep\" aria-hidden=\"true\"></span>G"
    );
  }

  function isBrandWordmark(value) {
    const n = String(value || "")
      .replace(/\s/g, "")
      .replace(/&amp;/gi, "&")
      .toLowerCase();
    return n === "g&g" || n === "gyg" || n === "g+g";
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function parseRoute() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const path = hash.replace(/^\/+|\/+$/g, "");
    if (!path) return { kind: "page", slug: "" };
    const auto = path.match(/^auto\/([^/]+)$/);
    if (auto) return { kind: "auto", id: decodeURIComponent(auto[1]) };
    return { kind: "page", slug: decodeURIComponent(path) };
  }

  let scrollArribaTimers = [];

  function limpiarScrollArriba() {
    for (let i = 0; i < scrollArribaTimers.length; i += 1) {
      clearTimeout(scrollArribaTimers[i]);
    }
    scrollArribaTimers = [];
  }

  function forzarScrollCero() {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    try {
      window.scrollTo(0, 0);
    } catch (_err) {}
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (_err) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch (_e2) {}
    }
    html.scrollTop = 0;
    html.scrollLeft = 0;
    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }
    const se = document.scrollingElement;
    if (se) se.scrollTop = 0;
    let node = document.getElementById("app") || document.body;
    while (node) {
      try {
        node.scrollTop = 0;
        node.scrollLeft = 0;
      } catch (_err) {}
      node = node.parentElement;
    }
    const ancla = document.getElementById("gygTop");
    if (ancla && ancla.scrollIntoView) {
      try {
        ancla.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
      } catch (_err) {
        ancla.scrollIntoView(true);
      }
    }
  }

  function scrollPaginaArriba() {
    limpiarScrollArriba();
    const html = document.documentElement;
    html.style.overflowAnchor = "none";
    if (document.body) document.body.style.overflowAnchor = "none";
    if (document.activeElement && document.activeElement.blur) {
      try {
        document.activeElement.blur();
      } catch (_err) {}
    }
    forzarScrollCero();
    requestAnimationFrame(() => {
      forzarScrollCero();
      requestAnimationFrame(forzarScrollCero);
    });
    [50, 120, 250, 450].forEach((ms) => {
      scrollArribaTimers.push(setTimeout(forzarScrollCero, ms));
    });
  }

  function actualizarWhatsappBar(vehicle) {
    const wa = document.getElementById("waBar");
    if (!wa) return;
    const phone = GyGStock.whatsappPhone(data);
    if (!phone) {
      wa.classList.add("hidden");
      document.body.classList.remove("has-wa-bar");
      return;
    }
    wa.href = GyGStock.whatsappUrl(data, vehicle || null);
    wa.classList.remove("hidden");
    document.body.classList.add("has-wa-bar");
  }

  function route() {
    stopCarousel();
    const r = parseRoute();
    if (r.kind === "auto") {
      const v = GyGStock.findVehicle(data, r.id);
      renderDetail(r.id);
      updateNavActive("__auto__");
      actualizarWhatsappBar(v);
      scrollPaginaArriba();
      return;
    }
    if (r.slug === "privacidad") {
      renderPrivacidad();
      updateNavActive("");
      actualizarWhatsappBar(null);
      scrollPaginaArriba();
      return;
    }
    const page = GyGStock.findPageBySlug(data, r.slug);
    if (!page || page.visible === false) {
      app.innerHTML = `
        <section class="detail">
          <div class="empty-state">Página no encontrada. <a href="#/">Volver al inicio</a></div>
        </section>`;
      updateNavActive("");
      actualizarWhatsappBar(null);
      scrollPaginaArriba();
      return;
    }
    updateNavActive(page.slug || "");
    if (page.type === "home") renderHome(page);
    else if (page.type === "stock") renderStockPage(page);
    else if (page.type === "vender" || page.id === "vender" || page.slug === "vender") renderVenderPage(page);
    else renderContentPage(page);
    actualizarWhatsappBar(null);
    scrollPaginaArriba();
  }

  function updateChrome() {
    const site = data.site || {};
    const tag = document.getElementById("brandTag");
    if (tag) tag.textContent = GyGStock.reescribirMarca(site.tagline || GYG_CONFIG.TAGLINE || "");
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
    const footer = document.getElementById("footerUpdated");
    if (footer) {
      const bits = [];
      const pie = GyGStock.reescribirMarca(site.footerText || "");
      if (pie) bits.push(pie);
      if (data.meta && data.meta.updatedAt) {
        bits.push(`Actualizado ${new Date(data.meta.updatedAt).toLocaleString("es-AR")}`);
      }
      footer.textContent = bits.join(" · ") || "Stock en vivo";
    }
    document.title = `${displayBrandName(site.name)} — ${GyGStock.reescribirMarca(site.tagline || "Stock")}`;
    renderNav();
    actualizarWhatsappBar(null);
  }

  function renderNav() {
    if (!navEl) return;
    const pages = GyGStock.navPages(data);
    navEl.innerHTML = pages
      .map((p) => {
        const href = GyGStock.pageHref(p);
        return `<a href="${escapeAttr(href)}" data-slug="${escapeAttr(p.slug || "")}">${escapeHtml(p.navLabel)}</a>`;
      })
      .join("");
  }

  function updateNavActive(slug) {
    if (!navEl) return;
    navEl.querySelectorAll("a").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.slug === String(slug));
    });
  }

  function cerrarMenu() {
    const header = document.querySelector(".site-header");
    const btn = document.getElementById("navToggle");
    if (header) header.classList.remove("is-open");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Abrir menú");
    }
  }

  function setupNavToggle() {
    const header = document.querySelector(".site-header");
    const btn = document.getElementById("navToggle");
    if (!header || !btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const open = header.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    navEl?.addEventListener("click", (ev) => {
      if (ev.target.closest("a")) cerrarMenu();
    });
    window.addEventListener("hashchange", cerrarMenu);
  }

  function setupBackTop() {
    const btn = document.getElementById("backTop");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    const sync = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      btn.classList.toggle("is-visible", y > 420);
    };
    btn.addEventListener("click", () => scrollPaginaArriba());
    window.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  function placeholderImg() {
    return (
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#1a1f28"/><stop offset="1" stop-color="#0b3d6e"/>
        </linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="50%" fill="#c5ccd6" font-family="Arial" font-size="42"
          text-anchor="middle" dominant-baseline="middle">G\u0026amp;G</text>
      </svg>`
      )
    );
  }

  function stopCarousel() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
    if (carouselResize) {
      window.removeEventListener("resize", carouselResize);
      carouselResize = null;
    }
  }

  function carouselPageSize() {
    if (window.matchMedia("(max-width: 640px)").matches) return 1;
    if (window.matchMedia("(max-width: 980px)").matches) return 2;
    return 3;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function carouselMarkup(vehicles) {
    if (!vehicles.length) return "";
    const hayDestacados = vehicles.some((v) => v.destacado);
    const countClass =
      vehicles.length === 1 ? " carousel--solo" : vehicles.length === 2 ? " carousel--duo" : "";
    return `
      <section class="carousel${countClass}" id="homeCarousel" aria-roledescription="carousel" aria-label="Vehículos en vitrina">
        <div class="carousel__head">
          <div>
            <p class="carousel__eyebrow">${hayDestacados ? "Destacados" : "En vitrina"}</p>
            <h2>Selección del showroom</h2>
          </div>
          <div class="carousel__toolbar">
            <a class="btn btn--ghost btn--sm" href="#/stock">Ver stock</a>
            <div class="carousel__controls">
              <button type="button" class="carousel__nav" id="carouselPrev" aria-label="Vehículo anterior">‹</button>
              <button type="button" class="carousel__nav" id="carouselNext" aria-label="Vehículo siguiente">›</button>
            </div>
          </div>
        </div>
        <div class="carousel__viewport" id="carouselViewport" tabindex="0">
          <div class="carousel__track" id="carouselTrack">
            ${vehicles.map((v) => `<div class="carousel__slide">${vehicleCard(v, false)}</div>`).join("")}
          </div>
        </div>
        <div class="carousel__dots" id="carouselDots" role="tablist" aria-label="Elegir vehículo"></div>
      </section>
    `;
  }

  function bindCarousel(total) {
    const track = document.getElementById("carouselTrack");
    const viewport = document.getElementById("carouselViewport");
    const prev = document.getElementById("carouselPrev");
    const next = document.getElementById("carouselNext");
    const dotsEl = document.getElementById("carouselDots");
    if (!track || !viewport || total < 1) return;

    let index = 0;

    function maxIndex() {
      return Math.max(0, total - Math.min(carouselPageSize(), total));
    }

    function stepPx() {
      const slide = track.querySelector(".carousel__slide");
      if (!slide) return 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return slide.getBoundingClientRect().width + gap;
    }

    function renderDots() {
      if (!dotsEl) return;
      const pages = maxIndex() + 1;
      if (pages <= 1) {
        dotsEl.innerHTML = "";
        return;
      }
      dotsEl.innerHTML = Array.from({ length: pages }, (_, i) => {
        const active = i === index ? " is-active" : "";
        return `<button type="button" class="carousel__dot${active}" data-page="${i}" aria-label="Grupo ${i + 1} de ${pages}" ${i === index ? 'aria-current="true"' : ""}></button>`;
      }).join("");
    }

    function apply() {
      const max = maxIndex();
      if (index > max) index = max;
      track.style.transform = `translateX(-${index * stepPx()}px)`;
      const hide = max < 1;
      prev?.parentElement?.classList.toggle("hidden", hide);
      dotsEl?.classList.toggle("hidden", hide);
      renderDots();
    }

    function go(delta) {
      const pages = maxIndex() + 1;
      if (pages <= 1) return;
      index = (index + delta + pages) % pages;
      apply();
    }

    function startAutoplay() {
      if (carouselTimer) clearInterval(carouselTimer);
      if (prefersReducedMotion() || maxIndex() < 1) {
        carouselTimer = null;
        return;
      }
      carouselTimer = setInterval(() => go(1), 5200);
    }

    prev?.addEventListener("click", () => {
      go(-1);
      startAutoplay();
    });
    next?.addEventListener("click", () => {
      go(1);
      startAutoplay();
    });
    dotsEl?.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-page]");
      if (!btn) return;
      index = Number(btn.getAttribute("data-page")) || 0;
      apply();
      startAutoplay();
    });

    viewport.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        go(-1);
        startAutoplay();
      }
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        go(1);
        startAutoplay();
      }
    });

    let touchX = 0;
    viewport.addEventListener(
      "touchstart",
      (ev) => {
        touchX = ev.touches[0].clientX;
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      (ev) => {
        const dx = ev.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) < 40) return;
        go(dx > 0 ? -1 : 1);
        startAutoplay();
      },
      { passive: true }
    );

    viewport.addEventListener("mouseenter", () => {
      if (carouselTimer) {
        clearInterval(carouselTimer);
        carouselTimer = null;
      }
    });
    viewport.addEventListener("mouseleave", startAutoplay);

    track.addEventListener("click", onCardActivate);
    track.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardActivate(e);
      }
    });

    carouselResize = () => apply();
    window.addEventListener("resize", carouselResize);
    apply();
    startAutoplay();
  }

  function renderHome(page) {
    const c = page.content || {};
    const site = data.site || {};
    const hero = site.heroImage || c.heroImage || placeholderImg();
    const primary = c.ctaPrimary || { label: "Ver stock", href: "#/stock" };
    const secondary = c.ctaSecondary || null;
    const highlights = Array.isArray(c.highlights) ? c.highlights : [];
    const carouselVehicles = GyGStock.pickCarouselVehicles(data, 8);

    app.innerHTML = `
      <section class="home-hero">
        <img class="home-hero__photo" src="${escapeAttr(hero)}" alt="" />
        <div class="home-hero__veil"></div>
        <div class="home-hero__content">
          <div class="home-hero__eyebrow">${escapeHtml(c.eyebrow || site.tagline || "")}</div>
          ${
            isBrandWordmark(c.headline || site.name)
              ? `<h1 class="visually-hidden">${escapeHtml(displayBrandName(site.name || "G&G"))} Automotores</h1>`
              : `<h1 class="home-hero__brand">${brandMarkup(c.headline || site.name || "G&G")}</h1>`
          }
          <p class="home-hero__sub">${escapeHtml(c.subtitle || "")}</p>
          <div class="home-hero__cta">
            <a class="btn btn--primary" href="${escapeAttr(primary.href || "#/stock")}">${escapeHtml(primary.label || "Ver stock")}</a>
            ${
              secondary && secondary.label
                ? `<a class="btn btn--ghost home-hero__ghost" href="${escapeAttr(secondary.href || "#/")}">${escapeHtml(secondary.label)}</a>`
                : ""
            }
            <a class="btn btn--ghost home-hero__ghost" href="#/vender">Vendé tu auto</a>
          </div>
        </div>
      </section>
      ${carouselMarkup(carouselVehicles)}
      <section class="sell-band" aria-label="Vendé tu auto">
        <div class="sell-band__copy">
          <p class="sell-band__eyebrow">Compra directa o consignación</p>
          <h2>Vendé tu auto</h2>
          <p>Completá los datos, lo vemos en el showroom y te hacemos una propuesta. Sin vueltas.</p>
        </div>
        <a class="btn btn--primary" href="#/vender">Cotizar mi auto</a>
      </section>
      ${
        highlights.length
          ? `<section class="home-links" aria-label="Secciones">
              ${highlights
                .map(
                  (h) => `
                <a class="home-link" href="${escapeAttr(h.href || "#/")}">
                  <span class="home-link__title">${escapeHtml(h.title || "")}</span>
                  <span class="home-link__text">${escapeHtml(h.text || "")}</span>
                </a>`
                )
                .join("")}
            </section>`
          : ""
      }
    `;
    bindCarousel(carouselVehicles.length);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
  }

  function applyFilters(list) {
    return list.filter((v) => {
      if (filters.marca && v.marca !== filters.marca) return false;
      if (filters.combustible && v.combustible !== filters.combustible) return false;
      if (filters.transmision && v.transmision !== filters.transmision) return false;
      if (filters.carroceria && v.carroceria !== filters.carroceria) return false;
      if (filters.anioMin && Number(v.anio) < Number(filters.anioMin)) return false;
      if (filters.anioMax && Number(v.anio) > Number(filters.anioMax)) return false;
      if (filters.precioMax && Number(v.precio) > Number(filters.precioMax)) return false;
      if (filters.kmMax && Number(v.km) > Number(filters.kmMax)) return false;
      if (filters.q) {
        const hay = [
          v.marca, v.modelo, v.version, v.color, v.combustible, v.carroceria, v.categoria,
          ...(v.equipamiento || []), v.descripcion,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(filters.q.toLowerCase().trim())) return false;
      }
      return true;
    });
  }

  function sortVehicles(list) {
    return [...list].sort((a, b) => {
      if (!!b.destacado - !!a.destacado) return !!b.destacado - !!a.destacado;
      if ((a.status === "reservado") !== (b.status === "reservado")) {
        return a.status === "reservado" ? 1 : -1;
      }
      return Number(b.anio) - Number(a.anio);
    });
  }

  function formatCategoria(cat) {
    if (!cat) return "";
    const c = String(cat).toLowerCase();
    if (c === "0km") return "0 km";
    if (c === "usado") return "Usado";
    return cat;
  }

  function vehicleCard(v, featured) {
    const img = (v.fotos && v.fotos[0]) || placeholderImg();
    const cls = featured ? "vehicle vehicle--featured" : "vehicle";
    const catClass = String(v.categoria || "").toLowerCase() === "0km" ? "chip--0km" : "chip--usado";
    const statusClass = v.status === "reservado" ? "chip--reservado" : "chip--disponible";
    return `
      <article class="${cls}" data-id="${escapeAttr(v.id)}" tabindex="0" role="link"
        aria-label="${escapeAttr(v.marca + " " + v.modelo)}">
        <div class="vehicle__media">
          <img src="${escapeAttr(img)}" alt="${escapeAttr(v.marca + " " + v.modelo)}" loading="lazy" />
          <div class="vehicle__chips">
            ${v.categoria ? `<span class="chip ${catClass}">${escapeHtml(formatCategoria(v.categoria))}</span>` : ""}
            <span class="chip ${statusClass}">${escapeHtml(v.status)}</span>
          </div>
          ${v.destacado ? '<span class="chip chip--destacado">Destacado</span>' : ""}
        </div>
        <div class="vehicle__body">
          <h2 class="vehicle__title">${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</h2>
          <div class="vehicle__version">${escapeHtml(v.version || "")} · ${escapeHtml(String(v.anio))}</div>
          <div class="vehicle__specs">
            <span>${escapeHtml(GyGStock.formatKm(v.km))}</span>
            <span>${escapeHtml(v.combustible || "")}</span>
            <span>${escapeHtml(v.transmision || "")}</span>
            <span>${escapeHtml(v.carroceria || "")}</span>
          </div>
          ${
            GyGStock.muestraPrecio(v)
              ? `<div class="vehicle__price">${escapeHtml(GyGStock.formatPrice(v.precio_oferta || v.precio, v.moneda))}</div>`
              : `<div class="vehicle__price vehicle__price--consulta">Consultar</div>`
          }
        </div>
      </article>
    `;
  }

  function renderStockPage(page) {
    if (activeStockSlug !== page.slug) {
      filters = blankFilters();
      activeStockSlug = page.slug;
    }
    const c = page.content || {};
    const publicList = GyGStock.publicVehicles(data, page.filter || {});
    const filtered = sortVehicles(applyFilters(publicList));
    const marcas = unique(publicList.map((v) => v.marca));
    const combustibles = unique(publicList.map((v) => v.combustible));
    const transmisiones = unique(publicList.map((v) => v.transmision));
    const carrocerias = unique(publicList.map((v) => v.carroceria));
    const featuredIds = new Set(filtered.filter((v) => v.destacado).slice(0, 2).map((v) => v.id));

    app.innerHTML = `
      <section class="hero">
        <div class="hero__eyebrow">${escapeHtml(c.eyebrow || "Catálogo")}</div>
        <h1>${escapeHtml(c.headline || page.title)}</h1>
        <p>${escapeHtml(c.subtitle || "")}</p>
        <div class="hero__meta">
          <span><strong>${filtered.length}</strong> en vitrina</span>
        </div>
      </section>

      <section class="filters" aria-label="Filtros">
        <div class="filters__panel">
          <input id="f-q" type="search" placeholder="Buscar marca, modelo, equipamiento…" value="${escapeAttr(filters.q)}" />
          <select id="f-marca">
            <option value="">Marca</option>
            ${marcas.map((m) => `<option value="${escapeAttr(m)}" ${filters.marca === m ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
          <select id="f-combustible">
            <option value="">Combustible</option>
            ${combustibles.map((m) => `<option value="${escapeAttr(m)}" ${filters.combustible === m ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
          <select id="f-transmision">
            <option value="">Transmisión</option>
            ${transmisiones.map((m) => `<option value="${escapeAttr(m)}" ${filters.transmision === m ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
          <select id="f-carroceria">
            <option value="">Carrocería</option>
            ${carrocerias.map((m) => `<option value="${escapeAttr(m)}" ${filters.carroceria === m ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
        </div>
        <div class="filters__row">
          <input id="f-anioMin" type="number" placeholder="Año desde" value="${escapeAttr(filters.anioMin)}" />
          <input id="f-anioMax" type="number" placeholder="Año hasta" value="${escapeAttr(filters.anioMax)}" />
          <input id="f-precioMax" type="number" placeholder="Precio máx." value="${escapeAttr(filters.precioMax)}" />
          <input id="f-kmMax" type="number" placeholder="Km máx." value="${escapeAttr(filters.kmMax)}" />
        </div>
        <div class="filters__actions">
          <div class="results-count">${filtered.length} vehículo${filtered.length === 1 ? "" : "s"}</div>
          <button type="button" class="btn btn--ghost btn--sm" id="f-reset">Limpiar filtros</button>
        </div>
      </section>

      <section class="stock" aria-label="Stock">
        <div class="stock-grid" id="stockGrid">
          ${
            filtered.length
              ? filtered.map((v) => vehicleCard(v, featuredIds.has(v.id))).join("")
              : `<div class="empty-state">No hay vehículos en esta sección.</div>`
          }
        </div>
      </section>
    `;

    bindFilters();
    document.getElementById("stockGrid")?.addEventListener("click", onCardActivate);
    document.getElementById("stockGrid")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardActivate(e);
      }
    });
  }

  function bindFilters() {
    const map = {
      "f-q": "q",
      "f-marca": "marca",
      "f-combustible": "combustible",
      "f-transmision": "transmision",
      "f-carroceria": "carroceria",
      "f-anioMin": "anioMin",
      "f-anioMax": "anioMax",
      "f-precioMax": "precioMax",
      "f-kmMax": "kmMax",
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const evt = el.tagName === "INPUT" && el.type === "search" ? "input" : "change";
      el.addEventListener(evt, () => {
        filters[key] = el.value;
        const page = GyGStock.findPageBySlug(data, activeStockSlug);
        if (page) renderStockPage(page);
      });
    });
    document.getElementById("f-reset")?.addEventListener("click", () => {
      filters = blankFilters();
      const page = GyGStock.findPageBySlug(data, activeStockSlug);
      if (page) renderStockPage(page);
    });
  }

  function onCardActivate(e) {
    const card = e.target.closest(".vehicle");
    if (!card) return;
    scrollPaginaArriba();
    location.hash = `#/auto/${encodeURIComponent(card.dataset.id)}`;
  }

  function scrollToSellForm(ev) {
    ev.preventDefault();
    document.getElementById("sell-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderVenderPage(page) {
    const c = page.content || {};
    const site = data.site || {};
    const titulo = c.headline || page.title || "Vendé tu auto";
    const texto =
      c.subtitle ||
      "Lo tasamos, lo mostramos y te hacemos una propuesta. Compra directa o consignación.";
    const anioMax = new Date().getFullYear() + 1;
    const brand = displayBrandName(site.name || "G&G");

    app.innerHTML = `
      <section class="hero hero--sell">
        <div class="hero__eyebrow">${escapeHtml(c.eyebrow || "Compra y consignación")}</div>
        <h1>${escapeHtml(titulo)}</h1>
        <p>${escapeHtml(texto)}</p>
        <div class="hero__cta">
          <button type="button" class="btn btn--primary" id="sell-hero-cta">Cotizá tu usado</button>
        </div>
      </section>
      <section class="sell-page">
        <ol class="sell-steps">
          <li>
            <span class="sell-steps__n">01</span>
            <h3>Completá el formulario</h3>
            <p>Marca, modelo, año y kilómetros. En dos minutos armamos una primera idea de valor.</p>
          </li>
          <li>
            <span class="sell-steps__n">02</span>
            <h3>Visitanos en el showroom</h3>
            <p>Coordinamos una visita. Revisamos el auto y te confirmamos la propuesta el mismo día.</p>
          </li>
          <li>
            <span class="sell-steps__n">03</span>
            <h3>Recibí tu cotización</h3>
            <p>Compra directa si querés cerrar ya, o consignación si preferís que lo mostremos en el stock.</p>
          </li>
        </ol>
        <form id="sell-form" class="sell-form" novalidate>
          <h2>Cotizá tu vehículo</h2>
          <p class="sell-form__lead">Te respondemos por WhatsApp con una estimación. Sin compromiso.</p>
          <div class="sell-form__grid">
            <label>Marca
              <input name="marca" required placeholder="Toyota" autocomplete="off" />
            </label>
            <label>Modelo
              <input name="modelo" required placeholder="Hilux" autocomplete="off" />
            </label>
            <label>Año
              <input name="anio" type="number" required min="1990" max="${anioMax}" placeholder="2018" />
            </label>
            <label>Kilómetros
              <input name="km" type="number" required min="0" step="1" placeholder="80000" />
            </label>
            <label>Estado general
              <select name="estado">
                <option value="Excelente">Excelente</option>
                <option value="Muy bueno" selected>Muy bueno</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
              </select>
            </label>
            <label>¿Cómo preferís venderlo?
              <select name="modalidad">
                <option value="No sé todavía">No sé todavía</option>
                <option value="Compra directa">Que me lo compren</option>
                <option value="Consignación">Consignación (lo muestran ustedes)</option>
              </select>
            </label>
            <label>Tu nombre
              <input name="nombre" required placeholder="Nombre y apellido" autocomplete="name" />
            </label>
            <label>Teléfono
              <input name="telefono" required placeholder="Ej. 3735..." autocomplete="tel" />
            </label>
            <label class="sell-form__full">Comentario (opcional)
              <textarea name="comentario" rows="3" placeholder="Único dueño, service al día, permuta..."></textarea>
            </label>
          </div>
          <label class="sell-form__check">
            <input name="acepto" type="checkbox" required />
            <span>Acepto que me contacten por WhatsApp para esta cotización.</span>
          </label>
          <button type="submit" class="btn btn--primary">Enviar cotización</button>
          <p class="sell-form__hint">La cotización es orientativa. El valor final se confirma al ver el vehículo.</p>
        </form>
        <section class="sell-block" aria-labelledby="sell-how-title">
          <h2 class="sell-section-title" id="sell-how-title">¿Cómo vender tu auto?</h2>
          <div class="sell-modes">
            <button type="button" class="sell-mode" data-modalidad="Compra directa">
              <span class="sell-mode__tag">Opción 1</span>
              <h3>Compra directa</h3>
              <p>Te lo compramos nosotros. Tasamos, acordamos el valor y cobrás sin esperar a que aparezca un comprador.</p>
              <span class="sell-mode__cta">Elegir compra directa</span>
            </button>
            <button type="button" class="sell-mode" data-modalidad="Consignación">
              <span class="sell-mode__tag">Opción 2</span>
              <h3>Consignación</h3>
              <p>Lo mostramos en el showroom y en la web. Vos seguís siendo el dueño hasta que se vende, con nuestra exposición.</p>
              <span class="sell-mode__cta">Elegir consignación</span>
            </button>
          </div>
        </section>
        <section class="sell-block" aria-labelledby="sell-why-title">
          <h2 class="sell-section-title" id="sell-why-title">¿Por qué vender con nosotros?</h2>
          <div class="sell-why">
            <article>
              <h3>Tasación en el showroom</h3>
              <p>Vemos el auto en persona y te damos una propuesta el mismo día, sin formularios eternos.</p>
            </article>
            <article>
              <h3>Dos formas de vender</h3>
              <p>Compra directa si querés cerrar ya, o consignación si preferís apuntar a un mejor precio.</p>
            </article>
            <article>
              <h3>Exposición real</h3>
              <p>En consignación entra al stock, a la web y a las redes. No queda parado en un portón.</p>
            </article>
            <article>
              <h3>Papeles y trámites</h3>
              <p>Te orientamos con la documentación. El cierre se hace con todo en regla.</p>
            </article>
          </div>
        </section>
        <section class="sell-block" aria-labelledby="sell-faq-title">
          <h2 class="sell-section-title" id="sell-faq-title">Preguntas frecuentes</h2>
          <div class="sell-faq">
            <details>
              <summary>¿Cuánto tarda la cotización?</summary>
              <p>Con el formulario te damos una primera idea por WhatsApp. El valor final se confirma cuando vemos el auto en el showroom, generalmente el mismo día de la visita.</p>
            </details>
            <details>
              <summary>¿Tengo que dejar el auto?</summary>
              <p>No. Coordinamos una visita, lo revisamos y te hacemos la propuesta. Si cerrás compra directa o consignación, ahí vemos la entrega.</p>
            </details>
            <details>
              <summary>¿Qué diferencia hay entre compra directa y consignación?</summary>
              <p>En compra directa te lo compramos nosotros y cobrás al cerrar. En consignación lo exhibimos hasta que aparece un comprador; el precio de venta lo acordamos juntos.</p>
            </details>
            <details>
              <summary>¿Puedo permutar por otro auto del stock?</summary>
              <p>Sí. Indicá en el comentario qué unidad te interesa o pedilo por WhatsApp. Tomamos tu usado como parte de pago.</p>
            </details>
            <details>
              <summary>¿Qué documentación necesito?</summary>
              <p>Título, cédula, DNI y, si aplica, informe de dominio o prenda. Si falta algo, te decimos cómo completarlo antes del cierre.</p>
            </details>
          </div>
        </section>
        <section class="sell-cta-end" aria-label="Cotizar ahora">
          <div>
            <h2>¿Listo para vender tu auto?</h2>
            <p>Completá los datos y te respondemos por WhatsApp.</p>
          </div>
          <button type="button" class="btn btn--primary" id="sell-end-cta">Cotizá tu usado</button>
        </section>
      </section>
    `;

    document.getElementById("sell-hero-cta")?.addEventListener("click", scrollToSellForm);
    document.getElementById("sell-end-cta")?.addEventListener("click", scrollToSellForm);
    document.querySelectorAll(".sell-mode").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sel = document.querySelector("#sell-form select[name='modalidad']");
        if (sel) sel.value = btn.getAttribute("data-modalidad") || "No sé todavía";
        document.getElementById("sell-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        sel?.focus();
      });
    });

    document.getElementById("sell-form")?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const form = ev.currentTarget;
      const val = (name) => String((form.elements[name] && form.elements[name].value) || "").trim();
      const marca = val("marca");
      const modelo = val("modelo");
      const anio = val("anio");
      const km = val("km");
      const nombre = val("nombre");
      const telefono = val("telefono");
      if (!marca || !modelo || !anio || !km || !nombre || !telefono) {
        toast("Completá marca, modelo, año, kilómetros, nombre y teléfono.", "error");
        return;
      }
      if (!form.elements.acepto || !form.elements.acepto.checked) {
        toast("Marcá que aceptás el contacto por WhatsApp.", "error");
        return;
      }
      const phone = GyGStock.whatsappPhone(data);
      if (!phone) {
        toast("Falta el WhatsApp de la concesionaria en Configuración del sitio.", "error");
        return;
      }
      const lineas = [
        `Hola ${brand}, quiero vender mi auto:`,
        `${marca} ${modelo} ${anio}`,
        `Km: ${km}`,
        `Estado: ${val("estado")}`,
        `Modalidad: ${val("modalidad")}`,
        `Nombre: ${nombre}`,
        `Tel: ${telefono}`,
      ];
      if (val("comentario")) lineas.push(`Comentario: ${val("comentario")}`);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(lineas.join("\n"))}`;
      window.open(url, "_blank", "noopener");
    });
  }

  function renderContentPage(page) {
    const c = page.content || {};
    const site = data.site || {};
    const isContacto = page.id === "contacto" || page.slug === "contacto";
    const titulo = isContacto
      ? site.contactoTitulo || c.headline || "Contactanos"
      : c.headline || page.title;
    const texto = isContacto ? site.contactoTexto || c.subtitle || "" : c.subtitle || "";
    const ig = (site.instagram || "").trim();
    const fb = (site.facebook || "").trim();
    const showWa = c.showWhatsapp || isContacto;
    const direccion = isContacto ? String(site.direccion || "").trim() : "";
    const mapa = direccion ? GyGStock.mapsEmbedUrl(direccion) : "";
    const mapaLink = direccion ? GyGStock.mapsSearchUrl(direccion) : "";

    app.innerHTML = `
      <section class="hero">
        <div class="hero__eyebrow">${escapeHtml(c.eyebrow || (isContacto ? "Contacto" : ""))}</div>
        <h1>${escapeHtml(titulo)}</h1>
        <p>${escapeHtml(texto)}</p>
      </section>
      <section class="content-page">
        ${c.body ? `<p class="content-page__body">${escapeHtml(c.body)}</p>` : ""}
        ${
          direccion
            ? `<p class="contact-address">${escapeHtml(direccion)}${
                mapaLink
                  ? ` · <a href="${escapeAttr(mapaLink)}" target="_blank" rel="noopener">Abrir en Maps</a>`
                  : ""
              }</p>`
            : ""
        }
        <div class="detail__cta content-page__cta">
          ${
            showWa
              ? `<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="${escapeAttr(GyGStock.whatsappUrl(data))}">WhatsApp</a>`
              : ""
          }
          ${ig ? `<a class="btn btn--instagram" target="_blank" rel="noopener" href="${escapeAttr(ig)}">Instagram</a>` : ""}
          ${fb ? `<a class="btn btn--facebook" target="_blank" rel="noopener" href="${escapeAttr(fb)}">Facebook</a>` : ""}
        </div>
        ${
          mapa
            ? `<div class="contact-map"><iframe title="Mapa del local" src="${escapeAttr(mapa)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
            : ""
        }
      </section>
    `;
  }

  function renderPrivacidad() {
    const site = data.site || {};
    const marca = displayBrandName(site.name);
    const phone = GyGStock.whatsappPhone(data);
    document.title = `Privacidad — ${marca}`;
    app.innerHTML = `
      <section class="hero">
        <div class="hero__eyebrow">Legal</div>
        <h1>Privacidad</h1>
        <p>Cómo usamos los datos en este sitio.</p>
      </section>
      <section class="content-page privacy">
        <p>${escapeHtml(marca)} publica el stock de vehículos en este sitio y en un catálogo público en la nube.</p>
        <p>Si nos escribís por WhatsApp o el formulario “Vendé tu auto”, el mensaje llega a nuestro WhatsApp. No guardamos ese formulario en una base de datos de internet.</p>
        <p>En el navegador puede quedar un identificador técnico del catálogo para que el sitio cargue. No usamos publicidad de terceros.</p>
        <p>Las fotos de los autos se alojan en el servicio de imágenes que usa la concesionaria.</p>
        <p>Para consultas sobre tus datos, escribinos por WhatsApp.</p>
        <div class="detail__cta content-page__cta">
          <a class="btn btn--ghost" href="#/">Volver al inicio</a>
          ${
            phone
              ? `<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="${escapeAttr(GyGStock.whatsappUrl(data))}">WhatsApp</a>`
              : ""
          }
        </div>
      </section>
    `;
  }

  function applyLightboxZoom() {
    const img = document.querySelector("#gygLightbox img");
    if (img) img.style.transform = "scale(" + lightboxZoom + ")";
  }

  function closeLightbox() {
    document.getElementById("gygLightbox")?.remove();
    lightboxZoom = 1;
  }

  function openLightbox(src) {
    closeLightbox();
    lightboxZoom = 1;
    const box = document.createElement("div");
    box.id = "gygLightbox";
    box.className = "lightbox";
    box.innerHTML = `
      <div class="lightbox__bar">
        <div>
          <button type="button" class="btn btn--ghost btn--sm" data-z="out">−</button>
          <button type="button" class="btn btn--ghost btn--sm" data-z="in">+</button>
        </div>
        <button type="button" class="btn btn--dark btn--sm" data-z="close">Cerrar</button>
      </div>
      <div class="lightbox__stage"><img src="${escapeAttr(src)}" alt="Foto ampliada"></div>
    `;
    document.body.appendChild(box);

    function dist(a, b) {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    let startDist = 0;
    let startZoom = 1;

    box.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-z]");
      if (!btn) {
        if (ev.target.classList.contains("lightbox__stage")) closeLightbox();
        return;
      }
      const z = btn.getAttribute("data-z");
      if (z === "close") closeLightbox();
      if (z === "in") lightboxZoom = Math.min(4, lightboxZoom + 0.4);
      if (z === "out") lightboxZoom = Math.max(1, lightboxZoom - 0.4);
      applyLightboxZoom();
    });
    box.addEventListener(
      "touchstart",
      (ev) => {
        if (ev.touches.length === 2) {
          startDist = dist(ev.touches[0], ev.touches[1]);
          startZoom = lightboxZoom;
        }
      },
      { passive: true }
    );
    box.addEventListener(
      "touchmove",
      (ev) => {
        if (ev.touches.length === 2 && startDist) {
          ev.preventDefault();
          lightboxZoom = Math.min(4, Math.max(1, startZoom * (dist(ev.touches[0], ev.touches[1]) / startDist)));
          applyLightboxZoom();
        }
      },
      { passive: false }
    );
    box.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        lightboxZoom = Math.min(4, Math.max(1, lightboxZoom + (ev.deltaY < 0 ? 0.2 : -0.2)));
        applyLightboxZoom();
      },
      { passive: false }
    );
    document.addEventListener("keydown", function onEsc(ev) {
      if (ev.key === "Escape") {
        closeLightbox();
        document.removeEventListener("keydown", onEsc);
      }
    });
  }

  function youtubeId(url) {
    const match = String(url || "").match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  function vimeoId(url) {
    const match = String(url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  }

  function driveFileId(url) {
    const match = String(url || "").match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function galleryItems(v) {
    if (Array.isArray(v.media) && v.media.length) return v.media;
    const fotos = v.fotos && v.fotos.length ? v.fotos : [];
    const videos = Array.isArray(v.videos) ? v.videos : [];
    const items = fotos.map((url) => ({ tipo: "foto", url, thumbnail: url }));
    for (const vid of videos) {
      if (typeof vid === "string") items.push({ tipo: "video", url: vid, thumbnail: "" });
      else items.push({ tipo: "video", url: vid.url, thumbnail: vid.thumbnail || "", embed: vid.embed });
    }
    return items.length ? items : [{ tipo: "foto", url: placeholderImg(), thumbnail: placeholderImg() }];
  }

  function embedSrc(item) {
    if (item.embed) return item.embed;
    const yt = youtubeId(item.url);
    if (yt) return `https://www.youtube.com/embed/${yt}`;
    const vimeo = vimeoId(item.url);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
    const drive = driveFileId(item.url);
    if (drive && /preview|video/i.test(item.url || "")) {
      return `https://drive.google.com/file/d/${drive}/preview`;
    }
    return item.url;
  }

  function mainMediaHtml(item, alt) {
    if (!item) return "";
    if (item.tipo === "video") {
      const src = embedSrc(item);
      if (/youtube\.com\/embed|vimeo\.com\/video|drive\.google\.com/.test(src)) {
        return `<iframe id="mainPhoto" src="${escapeAttr(src)}" title="${escapeAttr(alt)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
      return `<video id="mainPhoto" src="${escapeAttr(src)}" controls playsinline></video>`;
    }
    return `<img id="mainPhoto" src="${escapeAttr(item.url)}" alt="${escapeAttr(alt)}" />`;
  }

  function renderDetail(id) {
    const v = GyGStock.findVehicle(data, id);
    if (!v || (v.status !== "disponible" && v.status !== "reservado")) {
      app.innerHTML = `
        <section class="detail">
          <button type="button" class="btn btn--ghost detail__back" id="backBtn">← Volver</button>
          <div class="empty-state">Este vehículo no está disponible.</div>
        </section>`;
      document.getElementById("backBtn")?.addEventListener("click", () => history.back());
      return;
    }

    const items = galleryItems(v);
    const specs = [
      ["Categoría", v.categoria],
      ["Año", v.anio],
      ["Kilómetros", GyGStock.formatKm(v.km)],
      ["Combustible", v.combustible],
      ["Transmisión", v.transmision],
      ["Tracción", v.traccion],
      ["Motor", v.motor],
      ["Potencia", v.potencia],
      ["Carrocería", v.carroceria],
      ["Puertas", v.puertas],
      ["Color", v.color],
      ["Versión", v.version],
      ["Referencia", v.id],
    ];

    const similares = GyGStock.pickSimilarVehicles(data, v, 3);
    const stockSlug =
      String(v.categoria || "").toLowerCase() === "0km"
        ? GyGStock.findPageBySlug(data, "0km")
          ? "0km"
          : "stock"
        : GyGStock.findPageBySlug(data, "usados")
          ? "usados"
          : "stock";
    const stockLabel = stockSlug === "0km" ? "0 km" : stockSlug === "usados" ? "Usados" : "Stock";
    const stockHref = `#/${stockSlug}`;
    const nombreAuto = `${v.marca} ${v.modelo}`.trim();

    app.innerHTML = `
      <section class="detail">
        <nav class="crumbs" aria-label="Ubicación">
          <a href="#/">Inicio</a>
          <span class="crumbs__sep" aria-hidden="true">/</span>
          <a href="${escapeAttr(stockHref)}">${escapeHtml(stockLabel)}</a>
          <span class="crumbs__sep" aria-hidden="true">/</span>
          <span class="crumbs__current">${escapeHtml(nombreAuto)}</span>
        </nav>
        <div class="detail__layout">
          <div class="gallery">
            <div class="gallery__main" id="galleryMain">
              ${mainMediaHtml(items[0], v.marca + " " + v.modelo)}
            </div>
            <p class="gallery__hint">${items[0] && items[0].tipo === "video" ? "Reproducí el video o elegí otra miniatura" : "Tocá la foto para ampliar y hacer zoom"}</p>
            <div class="gallery__thumbs" id="thumbs">
              ${items
                .map(
                  (item, i) => `
                <button type="button" class="${i === 0 ? "is-active" : ""} ${item.tipo === "video" ? "is-video" : ""}" data-i="${i}">
                  <img src="${escapeAttr(item.thumbnail || item.url || placeholderImg())}" alt="" />
                </button>`
                )
                .join("")}
            </div>
          </div>
          <aside class="detail__info">
            <div class="detail__status is-${escapeAttr(v.status)}">${escapeHtml(v.status)}</div>
            <h1>${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</h1>
            <div class="vehicle__version">${escapeHtml(v.version || "")} · ${escapeHtml(String(v.anio))} · ${escapeHtml(v.categoria || "")}</div>
            ${
              GyGStock.muestraPrecio(v)
                ? `<div class="detail__price">${escapeHtml(GyGStock.formatPrice(v.precio_oferta || v.precio, v.moneda))}</div>`
                : `<div class="detail__price detail__price--consulta">Precio a consultar</div>`
            }
            <p class="detail__desc">${escapeHtml(v.descripcion || "")}</p>
            <table class="specs-table">
              <tbody>
                ${specs
                  .filter(([, val]) => val !== "" && val != null)
                  .map(([k, val]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(val))}</td></tr>`)
                  .join("")}
              </tbody>
            </table>
            ${
              (v.equipamiento || []).length
                ? `<ul class="equip-list">${v.equipamiento.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
                : ""
            }
            <div class="detail__cta">
              <a class="btn btn--whatsapp" target="_blank" rel="noopener" href="${escapeAttr(GyGStock.whatsappUrl(data, v, { consultarPrecio: !GyGStock.muestraPrecio(v) }))}">
                ${GyGStock.muestraPrecio(v) ? "Consultar por WhatsApp" : "Consultar este vehículo"}
              </a>
            </div>
          </aside>
        </div>
      </section>
      ${
        similares.length
          ? `<section class="similar" aria-label="También te puede interesar">
              <h2 class="similar__title">También te puede interesar</h2>
              <div class="stock-grid" id="similarGrid">
                ${similares.map((item) => vehicleCard(item, false)).join("")}
              </div>
            </section>`
          : ""
      }
    `;

    document.getElementById("similarGrid")?.addEventListener("click", onCardActivate);
    document.getElementById("similarGrid")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardActivate(e);
      }
    });

    const galleryMain = document.getElementById("galleryMain");
    const hint = document.querySelector(".gallery__hint");
    document.getElementById("thumbs")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-i]");
      if (!btn || !galleryMain) return;
      const idx = Number(btn.getAttribute("data-i"));
      const item = items[idx];
      if (!item) return;
      galleryMain.innerHTML = mainMediaHtml(item, v.marca + " " + v.modelo);
      if (hint) {
        hint.textContent = item.tipo === "video" ? "Reproducí el video o elegí otra miniatura" : "Tocá la foto para ampliar y hacer zoom";
      }
      document.querySelectorAll("#thumbs button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const main = document.getElementById("mainPhoto");
      if (main && main.tagName === "IMG") {
        main.addEventListener("click", () => openLightbox(main.src));
      }
    });
    const main = document.getElementById("mainPhoto");
    if (main && main.tagName === "IMG") {
      main.addEventListener("click", () => openLightbox(main.src));
    }
  }

  function renderGistSetup(err) {
    const missing = err && err.code === "MISSING_GIST_ID";
    if (!missing) {
      app.innerHTML = `
        <section class="empty-state" style="margin:3rem 1.25rem;max-width:36rem">
          <h1>El catálogo no se pudo cargar</h1>
          <p>A veces tarda un momento. Recargá la página.</p>
          <p>
            <button type="button" class="btn btn--primary" id="gistRetryBtn">Reintentar</button>
          </p>
        </section>`;
      document.getElementById("gistRetryBtn")?.addEventListener("click", () => {
        GyGStock.clearStoredGistId();
        location.reload();
      });
      return;
    }
    const current = GyGStock.getGistId() || "";
    app.innerHTML = `
      <section class="hero" style="max-width:640px">
        <div class="hero__eyebrow">Configuración</div>
        <h1>Conectar Gist</h1>
        <p>El tema está online, pero falta el GIST_ID. Pegá el ID del Gist donde está el stock.json.</p>
        <div class="field" style="margin:1rem 0">
          <label for="setupGistId">GIST_ID</label>
          <input id="setupGistId" type="text" value="${escapeAttr(current)}" placeholder="ej: a1b2c3d4e5f6..." style="width:100%;padding:0.7rem;border:1px solid var(--line)" />
        </div>
        <div class="detail__cta">
          <button type="button" class="btn btn--primary" id="setupSaveBtn">Guardar y cargar</button>
        </div>
      </section>
    `;
    document.getElementById("setupSaveBtn")?.addEventListener("click", () => {
      let id = (document.getElementById("setupGistId").value || "").trim();
      const match = id.match(/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i);
      if (match) id = match[1];
      if (!id) {
        toast("Pegá un GIST_ID válido", "error");
        return;
      }
      GyGStock.setGistId(id);
      toast("GIST_ID guardado", "ok");
      init();
    });
  }

  async function init() {
    try {
      data = await GyGStock.loadStock();
      updateChrome();
      if (!location.hash || location.hash === "#") location.hash = "#/";
      route();
    } catch (err) {
      console.error(err);
      renderGistSetup(err);
      toast(
        err.code === "MISSING_GIST_ID"
          ? "Falta configurar el catálogo"
          : "No se pudo cargar el catálogo. Recargá en un momento.",
        "error"
      );
    }
  }

  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  } catch (_err) {}
  window.addEventListener("hashchange", route);
  setupNavToggle();
  setupBackTop();
  init();
})();
