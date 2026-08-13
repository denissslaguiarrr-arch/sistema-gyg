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

  function displayBrandName(value) {
    const n = String(value == null ? "" : value).trim();
    if (!n) return "G\u0026G";
    return n.replace(/\bg\s*y\s*g\b/gi, "G\u0026G");
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

  function defaultSite() {
    return {
      name: cfg().DEALERSHIP_NAME || "G\u0026G",
      tagline: cfg().TAGLINE || "Selección premium de vehículos",
      whatsapp: cfg().WHATSAPP_NUMBER || "",
      instagram: "",
      facebook: "",
      contactoTitulo: "Contactanos",
      contactoTexto: "",
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
          subtitle: "Stock 0km y usados.",
          ctaPrimary: { label: "Ver 0km", href: "#/0km" },
          ctaSecondary: { label: "Ver usados", href: "#/usados" },
          heroImage: "",
          highlights: [],
        },
      },
      {
        id: "0km",
        slug: "0km",
        title: "0 kilómetros",
        navLabel: "0km",
        type: "stock",
        visible: true,
        order: 1,
        filter: { categoria: "0km" },
        content: { eyebrow: "Catálogo", headline: "0 kilómetros", subtitle: "Unidades nuevas." },
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
        content: { eyebrow: "Catálogo", headline: "Todo el stock", subtitle: "0km y usados." },
      },
      {
        id: "contacto",
        slug: "contacto",
        title: "Contacto",
        navLabel: "Contacto",
        type: "content",
        visible: true,
        order: 4,
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

  function normalizeData(data) {
    const raw = data && typeof data === "object" ? data : {};
    const site = { ...defaultSite(), ...(raw.site || {}) };
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

    const vehicles = Array.isArray(raw.vehicles)
      ? raw.vehicles.map((v) => ({
          ...v,
          categoria: v.categoria || (Number(v.km) <= 100 ? "0km" : "usado"),
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

  function findVehicle(data, id) {
    return ((data && data.vehicles) || []).find((v) => v.id === id) || null;
  }

  function whatsappPhone(data) {
    const fromSite = data && data.site && data.site.whatsapp;
    return String(fromSite || cfg().WHATSAPP_NUMBER || "").replace(/\D/g, "");
  }

  function whatsappUrl(data, vehicle) {
    const phone = whatsappPhone(data);
    const nameBrand = displayBrandName(
      (data && data.site && data.site.name) || cfg().DEALERSHIP_NAME || "G\u0026G"
    );
    if (vehicle) {
      const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ""} ${vehicle.anio}`.trim();
      const text = encodeURIComponent(
        `Hola ${nameBrand}, consulto por el ${name} (ref: ${vehicle.id}). ¿Sigue disponible?`
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
    loadStock,
    saveStock,
    createGist,
    downloadBackup,
    normalizeData,
    formatPrice,
    formatKm,
    navPages,
    findPageBySlug,
    pageHref,
    publicVehicles,
    findVehicle,
    whatsappPhone,
    whatsappUrl,
    createId,
    emptyVehicle,
    emptyPage,
    defaultSite,
    defaultPages,
    displayBrandName,
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
    return escapeHtml(displayBrandName(value)).replace(/G\u0026amp;G/g, "G<span>\u0026amp;</span>G");
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

  function route() {
    const r = parseRoute();
    if (r.kind === "auto") {
      renderDetail(r.id);
      updateNavActive("__auto__");
      return;
    }
    const page = GyGStock.findPageBySlug(data, r.slug);
    if (!page || page.visible === false) {
      app.innerHTML = `
        <section class="detail">
          <div class="empty-state">Página no encontrada. <a href="#/">Volver al inicio</a></div>
        </section>`;
      updateNavActive("");
      return;
    }
    updateNavActive(page.slug || "");
    if (page.type === "home") renderHome(page);
    else if (page.type === "stock") renderStockPage(page);
    else renderContentPage(page);
  }

  function updateChrome() {
    const site = data.site || {};
    const tag = document.getElementById("brandTag");
    if (tag) tag.textContent = site.tagline || GYG_CONFIG.TAGLINE || "";
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
    const footer = document.getElementById("footerUpdated");
    if (footer) {
      const bits = [];
      if (site.footerText) bits.push(site.footerText);
      if (data.meta && data.meta.updatedAt) {
        bits.push(`Actualizado ${new Date(data.meta.updatedAt).toLocaleString("es-AR")}`);
      }
      footer.textContent = bits.join(" · ") || "Stock en vivo";
    }
    document.title = `${displayBrandName(site.name)} — ${site.tagline || "Stock"}`;
    renderNav();
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

  function renderHome(page) {
    const c = page.content || {};
    const site = data.site || {};
    const hero = c.heroImage || site.heroImage || placeholderImg();
    const primary = c.ctaPrimary || { label: "Ver stock", href: "#/stock" };
    const secondary = c.ctaSecondary || null;
    const highlights = Array.isArray(c.highlights) ? c.highlights : [];

    app.innerHTML = `
      <section class="home-hero" style="--hero-image: url('${escapeAttr(hero)}')">
        <div class="home-hero__veil"></div>
        <div class="home-hero__content">
          <div class="home-hero__eyebrow">${escapeHtml(c.eyebrow || site.tagline || "")}</div>
          <h1 class="home-hero__brand">${brandMarkup(c.headline || site.name || "G\u0026G")}</h1>
          <p class="home-hero__sub">${escapeHtml(c.subtitle || "")}</p>
          <div class="home-hero__cta">
            <a class="btn btn--primary" href="${escapeAttr(primary.href || "#/stock")}">${escapeHtml(primary.label || "Ver stock")}</a>
            ${
              secondary && secondary.label
                ? `<a class="btn btn--ghost home-hero__ghost" href="${escapeAttr(secondary.href || "#/")}">${escapeHtml(secondary.label)}</a>`
                : ""
            }
          </div>
        </div>
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
          <div class="vehicle__price">${escapeHtml(GyGStock.formatPrice(v.precio_oferta || v.precio, v.moneda))}</div>
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
    location.hash = `#/auto/${encodeURIComponent(card.dataset.id)}`;
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

    app.innerHTML = `
      <section class="hero">
        <div class="hero__eyebrow">${escapeHtml(c.eyebrow || (isContacto ? "Contacto" : ""))}</div>
        <h1>${escapeHtml(titulo)}</h1>
        <p>${escapeHtml(texto)}</p>
      </section>
      <section class="content-page">
        ${c.body ? `<p class="content-page__body">${escapeHtml(c.body)}</p>` : ""}
        <div class="detail__cta content-page__cta">
          ${
            showWa
              ? `<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="${escapeAttr(GyGStock.whatsappUrl(data))}">WhatsApp</a>`
              : ""
          }
          ${ig ? `<a class="btn btn--instagram" target="_blank" rel="noopener" href="${escapeAttr(ig)}">Instagram</a>` : ""}
          ${fb ? `<a class="btn btn--facebook" target="_blank" rel="noopener" href="${escapeAttr(fb)}">Facebook</a>` : ""}
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

    const fotos = v.fotos && v.fotos.length ? v.fotos : [placeholderImg()];
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

    app.innerHTML = `
      <section class="detail">
        <button type="button" class="btn btn--ghost detail__back" id="backBtn">← Volver</button>
        <div class="detail__layout">
          <div class="gallery">
            <div class="gallery__main">
              <img id="mainPhoto" src="${escapeAttr(fotos[0])}" alt="${escapeAttr(v.marca + " " + v.modelo)}" />
            </div>
            <p class="gallery__hint">Tocá la foto para ampliar y hacer zoom</p>
            <div class="gallery__thumbs" id="thumbs">
              ${fotos
                .map(
                  (f, i) => `
                <button type="button" class="${i === 0 ? "is-active" : ""}" data-src="${escapeAttr(f)}">
                  <img src="${escapeAttr(f)}" alt="" />
                </button>`
                )
                .join("")}
            </div>
          </div>
          <aside class="detail__info">
            <div class="detail__status is-${escapeAttr(v.status)}">${escapeHtml(v.status)}</div>
            <h1>${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</h1>
            <div class="vehicle__version">${escapeHtml(v.version || "")} · ${escapeHtml(String(v.anio))} · ${escapeHtml(v.categoria || "")}</div>
            <div class="detail__price">${escapeHtml(GyGStock.formatPrice(v.precio_oferta || v.precio, v.moneda))}</div>
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
              <a class="btn btn--whatsapp" target="_blank" rel="noopener" href="${escapeAttr(GyGStock.whatsappUrl(data, v))}">
                Consultar por WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </section>
    `;

    document.getElementById("backBtn")?.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.hash = "#/stock";
    });

    const main = document.getElementById("mainPhoto");
    document.getElementById("thumbs")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-src]");
      if (!btn || !main) return;
      main.src = btn.dataset.src;
      document.querySelectorAll("#thumbs button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
    main?.addEventListener("click", () => openLightbox(main.src));
  }

  function renderGistSetup(err) {
    const missing = err && err.code === "MISSING_GIST_ID";
    const current = GyGStock.getGistId() || "";
    app.innerHTML = `
      <section class="hero" style="max-width:640px">
        <div class="hero__eyebrow">Configuración</div>
        <h1>Conectar Gist</h1>
        <p>${
          missing
            ? "El tema está online, pero falta el GIST_ID. Pegá el ID del Gist donde está el stock.json."
            : "No se pudo leer el Gist. Revisá el ID o que el archivo se llame stock.json y sea público."
        }</p>
        <p style="color:var(--muted);font-size:0.9rem">${escapeHtml(err && err.message && err.message !== "MISSING_GIST_ID" ? err.message : "")}</p>
        <div class="field" style="margin:1rem 0">
          <label for="setupGistId">GIST_ID</label>
          <input id="setupGistId" type="text" value="${escapeAttr(current)}" placeholder="ej: a1b2c3d4e5f6..." style="width:100%;padding:0.7rem;border:1px solid var(--line)" />
        </div>
        <div class="detail__cta">
          <button type="button" class="btn btn--primary" id="setupSaveBtn">Guardar y cargar</button>
          <a class="btn btn--ghost" href="https://gist.github.com" target="_blank" rel="noopener">Abrir Gists</a>
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
      toast(err.code === "MISSING_GIST_ID" ? "Falta configurar el Gist" : err.message || "Error al cargar", "error");
    }
  }

  window.addEventListener("hashchange", route);
  init();
})();
