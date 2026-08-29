/* Catálogo público G&G. Se usa en /catalogo.html (el sitio de Blogger usa blogger/tema.xml). */
(function () {
  var GIST_ID = window.GYG_GIST_ID || "74837d1c1f0a9a3a67e6dc5cc4fa5b6f";
  var root = document.getElementById("gyg-root") || document.body;
  var state = { data: null, error: "", fotoIdx: 0, zoom: 1 };

  function css() {
    var s = document.createElement("style");
    s.textContent = [
      ":root{--bg:#0f172a;--card:#fff;--muted:#64748b;--line:#e2e8f0;--ok:#16a34a;--pad:calc(28px + env(safe-area-inset-bottom,0px))}",
      "html,body{margin:0;padding:0;background:#f1f5f9;color:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}",
      "#gyg-root{min-height:100vh;display:flex;flex-direction:column}",
      ".gyg-top{background:#f7f8fa;color:#111;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 10px;border-bottom:1px solid #e8ecf1}",
      ".gyg-brand img{height:40px;width:auto;display:block;max-width:min(280px,82vw);object-fit:contain}",
      ".gyg-title{margin:6px 0 0;font-size:12px;line-height:1.3;letter-spacing:.12em;text-transform:uppercase;color:#5c6573;font-weight:600}",
      ".gyg-tag{margin:6px 0 0;color:#cbd5e1;font-size:14px}",
      ".gyg-nav{display:flex;gap:8px;overflow:auto;padding:10px 16px 12px;background:var(--bg);-webkit-overflow-scrolling:touch}",
      ".gyg-nav a{flex:0 0 auto;color:#e2e8f0;text-decoration:none;font-size:14px;padding:8px 12px;border-radius:999px}",
      ".gyg-nav a.on{background:#1e293b;color:#fff}",
      ".gyg-main{flex:1;width:min(1100px,100%);margin:0 auto;padding:16px 16px var(--pad)}",
      ".gyg-hero{border-radius:18px;overflow:hidden;min-height:180px;background:#1e293b;margin-bottom:18px}",
      ".gyg-hero img{width:100%;height:220px;object-fit:cover;display:block}",
      ".gyg-grid{display:grid;grid-template-columns:1fr;gap:14px}",
      "@media(min-width:700px){.gyg-grid{grid-template-columns:repeat(2,1fr)}.gyg-hero img{height:320px}.gyg-detail{grid-template-columns:1.1fr .9fr}}",
      "@media(min-width:1020px){.gyg-grid{grid-template-columns:repeat(3,1fr)}}",
      ".gyg-card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;display:block}",
      ".gyg-card img{width:100%;height:170px;object-fit:cover;background:#e2e8f0}",
      ".gyg-card .p{padding:12px 14px 16px}",
      ".gyg-badge{display:inline-flex;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:#dcfce7;color:#166534}",
      ".gyg-price{font-size:20px;font-weight:800;margin:6px 0 0}",
      ".gyg-muted{color:var(--muted);font-size:13px}",
      ".gyg-detail{display:grid;gap:16px}",
      ".gyg-photo{background:#0f172a;border-radius:16px;overflow:hidden}",
      ".gyg-photo img,.gyg-photo video{width:100%;max-height:min(70vh,520px);object-fit:contain;display:block;background:#0f172a}",
      ".gyg-photo img{cursor:zoom-in}",
      ".gyg-photo iframe{width:100%;aspect-ratio:16/9;border:0;display:block;background:#000}",
      ".gyg-thumbs{display:flex;gap:8px;overflow:auto;padding:10px}",
      ".gyg-thumbs img{width:64px;height:64px;object-fit:cover;border-radius:10px;cursor:pointer;border:2px solid transparent}",
      ".gyg-thumbs img.on{border-color:#38bdf8}",
      ".gyg-hint{color:#94a3b8;font-size:12px;padding:0 10px 10px}",
      ".gyg-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px}",
      ".gyg-specs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}",
      ".gyg-spec{background:#f8fafc;border-radius:10px;padding:8px 10px}",
      ".gyg-spec small{display:block;color:var(--muted);font-size:11px}",
      ".gyg-btn{display:block;text-align:center;text-decoration:none;border-radius:12px;padding:13px 16px;font-weight:700;margin-top:10px}",
      ".gyg-wa{background:#16a34a;color:#fff}",
      ".gyg-ig{background:#d62976;color:#fff}",
      ".gyg-fb{background:#1877f2;color:#fff}",
      ".gyg-contact{padding-bottom:calc(48px + env(safe-area-inset-bottom,0px))}",
      ".gyg-foot{color:var(--muted);font-size:12px;text-align:center;padding:8px 16px var(--pad)}",
      ".gyg-back{display:inline-block;margin-bottom:10px;color:#334155;text-decoration:none;font-size:14px}",
      ".gyg-lb{position:fixed;inset:0;background:rgba(2,6,23,.94);z-index:80;display:flex;flex-direction:column;touch-action:none}",
      ".gyg-lb-bar{display:flex;justify-content:space-between;align-items:center;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 8px;color:#fff}",
      ".gyg-lb-bar button{background:#1e293b;color:#fff;border:0;border-radius:10px;padding:8px 12px;font-size:16px}",
      ".gyg-lb-stage{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:8px;touch-action:none}",
      ".gyg-lb-stage img{max-width:100%;max-height:100%;object-fit:contain;transform-origin:center center}",
      ".hidden{display:none !important}",
    ].join("");
    document.head.appendChild(s);
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function waDigits(v) {
    return String(v || "").replace(/\D/g, "");
  }

  function dinero(v, moneda) {
    var n = Number(v);
    if (!isFinite(n)) return "";
    var sim = moneda === "USD" ? "US$" : "$";
    return sim + " " + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  }

  function pages() {
    var list = (state.data && state.data.pages) || [];
    return list
      .filter(function (p) { return p && p.visible !== false; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
      .map(function (p) {
        var c = p.content && typeof p.content === "object" ? Object.assign({}, p.content) : {};
        if (c.headline) c.headline = marca(c.headline);
        if (c.subtitle) c.subtitle = marca(c.subtitle);
        if (c.eyebrow) c.eyebrow = marca(c.eyebrow);
        if (c.body) c.body = marca(c.body);
        return Object.assign({}, p, {
          title: marca(p.title || ""),
          navLabel: marca(p.navLabel || p.title || ""),
          content: c,
        });
      });
  }

  function marca(t) {
    return String(t == null ? "" : t).replace(/\bg\s*y\s*g\b(?![\w-])/gi, "G&G");
  }

  function site() {
    var s = (state.data && state.data.site) || {};
    return {
      name: marca(s.name || "G&G"),
      tagline: marca(s.tagline || ""),
      whatsapp: s.whatsapp || "",
      instagram: s.instagram || "",
      facebook: s.facebook || "",
      contactoTitulo: marca(s.contactoTitulo || "Contactanos"),
      contactoTexto: marca(s.contactoTexto || ""),
      direccion: marca(s.direccion || ""),
      footerText: marca(s.footerText || ""),
      heroImage: s.heroImage || "",
    };
  }

  function vehiculos() {
    return ((state.data && state.data.vehicles) || []).filter(function (v) {
      return v && v.status !== "vendido" && v.status !== "oculto";
    });
  }

  function parseHash() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    if (parts[0] === "auto" && parts[1]) return { view: "auto", id: parts[1] };
    if (!parts[0]) return { view: "page", slug: "" };
    return { view: "page", slug: parts[0] };
  }

  function pageBySlug(slug) {
    return pages().find(function (p) { return (p.slug || "") === slug; }) || pages()[0];
  }

  function filtrar(page) {
    var list = vehiculos();
    var f = (page && page.filter) || {};
    if (f.categoria) list = list.filter(function (v) { return v.categoria === f.categoria; });
    return list;
  }

  function navHtml(active) {
    return (
      '<nav class="gyg-nav">' +
      pages()
        .map(function (p) {
          var href = "#/" + (p.slug || "");
          var on = (p.slug || "") === active ? " on" : "";
          return '<a class="' + on + '" href="' + href + '">' + esc(p.navLabel || p.title) + "</a>";
        })
        .join("") +
      "</nav>"
    );
  }

  function headerHtml() {
    var s = site();
    return (
      '<header class="gyg-top"><a href="#/" class="gyg-brand"><img src="/brand/logo-gg-automotores.png" alt="G&amp;G Automotores"></a><div class="gyg-title">' +
      esc(s.tagline || "Selección premium de vehículos") +
      "</div></header>"
    );
  }

  function cardHtml(v) {
    var foto = (v.fotos && v.fotos[0]) || "";
    var img = foto
      ? '<img src="' + esc(foto) + '" alt="' + esc(v.marca + " " + v.modelo) + '">'
      : '<div style="height:170px;background:#e2e8f0"></div>';
    return (
      '<a class="gyg-card" href="#/auto/' +
      esc(v.id) +
      '">' +
      img +
      '<div class="p"><span class="gyg-badge">' +
      esc((v.status || "disponible").toUpperCase()) +
      "</span><h3 style='margin:8px 0 0'>" +
      esc(v.marca + " " + v.modelo) +
      '</h3><p class="gyg-muted">' +
      esc([v.version, v.anio, v.categoria].filter(Boolean).join(" · ")) +
      '</p><p class="gyg-price">' +
      (v.mostrarPrecio || v.mostrar_precio
        ? esc(dinero(v.precio_oferta || v.precio, v.moneda))
        : "Consultar") +
      "</p></div></a>"
    );
  }

  function homeHtml(page) {
    var s = site();
    var c = (page && page.content) || {};
    var hero = s.heroImage || c.heroImage || "";
    var dest = vehiculos().filter(function (v) { return v.destacado; });
    if (!dest.length) dest = vehiculos().slice(0, 6);
    return (
      (hero ? '<div class="gyg-hero"><img src="' + esc(hero) + '" alt=""></div>' : "") +
      "<p class='gyg-muted'>" +
      esc(c.subtitle || s.tagline || "") +
      '</p><div class="gyg-grid" style="margin-top:14px">' +
      dest.map(cardHtml).join("") +
      "</div>"
    );
  }

  function stockHtml(page) {
    var c = (page && page.content) || {};
    var list = filtrar(page);
    return (
      "<h2 style='margin:0 0 6px'>" +
      esc(c.headline || page.title || "Stock") +
      "</h2><p class='gyg-muted'>" +
      esc(c.subtitle || "") +
      "</p><div class='gyg-grid' style='margin-top:14px'>" +
      (list.length ? list.map(cardHtml).join("") : "<p>No hay vehículos para mostrar.</p>") +
      "</div>"
    );
  }

  function contactHtml(page) {
    var s = site();
    var c = (page && page.content) || {};
    var titulo = s.contactoTitulo || c.headline || "Contactanos";
    var texto = s.contactoTexto || c.subtitle || c.body || "";
    var wa = waDigits(s.whatsapp);
    var html =
      '<section class="gyg-contact"><div class="gyg-panel"><h2 style="margin:0 0 8px">' +
      esc(titulo) +
      '</h2><p class="gyg-muted">' +
      esc(texto) +
      "</p>";
    if (s.direccion) {
      html += '<p>' + esc(s.direccion) + "</p>";
    }
    if (wa) {
      html +=
        '<a class="gyg-btn gyg-wa" href="https://wa.me/' +
        wa +
        '" target="_blank" rel="noopener">WhatsApp</a>';
    }
    if (s.instagram) {
      html +=
        '<a class="gyg-btn gyg-ig" href="' +
        esc(s.instagram) +
        '" target="_blank" rel="noopener">Instagram</a>';
    }
    if (s.facebook) {
      html +=
        '<a class="gyg-btn gyg-fb" href="' +
        esc(s.facebook) +
        '" target="_blank" rel="noopener">Facebook</a>';
    }
    html += "</div></section>";
    return html;
  }

  function galleryItems(v) {
    if (v.media && v.media.length) return v.media;
    var fotos = v.fotos && v.fotos.length ? v.fotos : [];
    var videos = v.videos && v.videos.length ? v.videos : [];
    var items = fotos.map(function (url) {
      return { tipo: "foto", url: url, thumbnail: url };
    });
    videos.forEach(function (vid) {
      if (typeof vid === "string") items.push({ tipo: "video", url: vid, thumbnail: "" });
      else items.push({ tipo: "video", url: vid.url, thumbnail: vid.thumbnail || "", embed: vid.embed });
    });
    return items;
  }

  function mainMediaHtml(item, alt) {
    if (!item) return "";
    var media = window.GygMedia;
    if (item.tipo === "video") {
      var info = media && media.describirMedia ? media.describirMedia(item.url) : { tipo: "video", src: item.embed || item.url };
      if (info.tipo === "iframe") {
        return '<iframe src="' + esc(info.src) + '" title="' + esc(alt) + '" allowfullscreen allow="autoplay; encrypted-media"></iframe>';
      }
      return '<video id="gyg-main-foto" src="' + esc(info.src) + '" controls playsinline></video>';
    }
    return '<img id="gyg-main-foto" src="' + esc(item.url) + '" alt="' + esc(alt) + '">';
  }

  function specs(v) {
    var rows = [
      ["Año", v.anio],
      ["Kilómetros", v.km === 0 ? "0 km" : Number(v.km).toLocaleString("es-AR") + " km"],
      ["Combustible", v.combustible],
      ["Transmisión", v.transmision],
      ["Motor", v.motor],
      ["Carrocería", v.carroceria],
      ["Color", v.color],
      ["Referencia", v.id],
    ].filter(function (r) { return r[1] !== "" && r[1] != null; });
    return (
      '<div class="gyg-specs">' +
      rows
        .map(function (r) {
          return '<div class="gyg-spec"><small>' + esc(r[0]) + "</small><b>" + esc(r[1]) + "</b></div>";
        })
        .join("") +
      "</div>"
    );
  }

  function autoHtml(v) {
    var items = galleryItems(v);
    var i = state.fotoIdx;
    if (i >= items.length) i = 0;
    var actual = items[i] || null;
    var s = site();
    var wa = waDigits(s.whatsapp);
    var msg = encodeURIComponent("Hola, consulto por " + v.marca + " " + v.modelo + " (" + v.id + ")");
    var thumbs =
      items.length > 1
        ? '<div class="gyg-thumbs">' +
          items
            .map(function (item, idx) {
              var thumb = item.thumbnail || item.url || "";
              var play = item.tipo === "video" ? " ▶" : "";
              return (
                '<img data-i="' +
                idx +
                '" class="' +
                (idx === i ? "on" : "") +
                '" src="' +
                esc(thumb) +
                '" alt="' +
                play +
                '">'
              );
            })
            .join("") +
          "</div>"
        : "";
    return (
      '<a class="gyg-back" href="#/stock">← Volver</a><div class="gyg-detail"><div class="gyg-photo">' +
      mainMediaHtml(actual, v.marca + " " + v.modelo) +
      thumbs +
      (actual && actual.tipo !== "video" ? '<p class="gyg-hint">Tocá la foto para ampliar y hacer zoom</p>' : "") +
      '</div><div class="gyg-panel"><span class="gyg-badge">' +
      esc((v.status || "").toUpperCase()) +
      "</span><h2 style='margin:8px 0 0'>" +
      esc(v.marca + " " + v.modelo) +
      '</h2><p class="gyg-muted">' +
      esc([v.version, v.anio, v.categoria].filter(Boolean).join(" · ")) +
      '</p><p class="gyg-price">' +
      (v.mostrarPrecio || v.mostrar_precio
        ? esc(dinero(v.precio_oferta || v.precio, v.moneda))
        : "Precio a consultar") +
      "</p>" +
      specs(v) +
      (wa
        ? '<a class="gyg-btn gyg-wa" href="https://wa.me/' +
          wa +
          "?text=" +
          msg +
          '" target="_blank" rel="noopener">' +
          (v.mostrarPrecio || v.mostrar_precio ? "Consultar por WhatsApp" : "Consultar este vehículo") +
          "</a>"
        : "") +
      "</div></div>"
    );
  }

  function lightboxHtml(src) {
    return (
      '<div class="gyg-lb" id="gyg-lb"><div class="gyg-lb-bar"><div>' +
      '<button type="button" data-z="out">−</button> ' +
      '<button type="button" data-z="in">+</button></div>' +
      '<button type="button" data-z="close">Cerrar</button></div>' +
      '<div class="gyg-lb-stage" id="gyg-lb-stage"><img id="gyg-lb-img" src="' +
      esc(src) +
      '" alt="Foto ampliada"></div></div>'
    );
  }

  function aplicarZoom() {
    var img = document.getElementById("gyg-lb-img");
    if (img) img.style.transform = "scale(" + state.zoom + ")";
  }

  function abrirLightbox(src) {
    state.zoom = 1;
    var wrap = document.createElement("div");
    wrap.innerHTML = lightboxHtml(src);
    var box = wrap.firstChild;
    document.body.appendChild(box);
    var startDist = 0;
    var startZoom = 1;

    function dist(a, b) {
      var dx = a.clientX - b.clientX;
      var dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    box.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-z]");
      if (!btn) return;
      var z = btn.getAttribute("data-z");
      if (z === "close") box.remove();
      if (z === "in") state.zoom = Math.min(4, state.zoom + 0.4);
      if (z === "out") state.zoom = Math.max(1, state.zoom - 0.4);
      aplicarZoom();
    });
    box.addEventListener(
      "touchstart",
      function (ev) {
        if (ev.touches.length === 2) {
          startDist = dist(ev.touches[0], ev.touches[1]);
          startZoom = state.zoom;
        }
      },
      { passive: true }
    );
    box.addEventListener(
      "touchmove",
      function (ev) {
        if (ev.touches.length === 2 && startDist) {
          ev.preventDefault();
          state.zoom = Math.min(4, Math.max(1, startZoom * (dist(ev.touches[0], ev.touches[1]) / startDist)));
          aplicarZoom();
        }
      },
      { passive: false }
    );
    box.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      state.zoom = Math.min(4, Math.max(1, state.zoom + (ev.deltaY < 0 ? 0.2 : -0.2)));
      aplicarZoom();
    }, { passive: false });
  }

  function bindFoto() {
    var main = document.getElementById("gyg-main-foto");
    if (main) {
      main.addEventListener("click", function () {
        abrirLightbox(main.src);
      });
    }
    var thumbs = document.querySelector(".gyg-thumbs");
    if (thumbs) {
      thumbs.addEventListener("click", function (ev) {
        var img = ev.target.closest("img[data-i]");
        if (!img) return;
        state.fotoIdx = Number(img.getAttribute("data-i")) || 0;
        render();
      });
    }
  }

  function render() {
    if (state.error) {
      root.innerHTML = '<p style="padding:24px">' + esc(state.error) + "</p>";
      return;
    }
    if (!state.data) {
      root.innerHTML = "<p style='padding:24px'>Cargando sitio…</p>";
      return;
    }
    var ruta = parseHash();
    var active = ruta.view === "auto" ? "stock" : ruta.slug;
    var inner = "";
    if (ruta.view === "auto") {
      var v = ((state.data.vehicles || []).find(function (x) { return x.id === ruta.id; }));
      inner = v ? autoHtml(v) : "<p>No se encontró el vehículo.</p>";
    } else {
      var page = pageBySlug(ruta.slug);
      if (!page) inner = "<p>Página no encontrada.</p>";
      else if (page.type === "home") inner = homeHtml(page);
      else if (page.type === "content" || page.slug === "contacto") inner = contactHtml(page);
      else inner = stockHtml(page);
    }
    var s = site();
    root.innerHTML =
      headerHtml() +
      navHtml(active) +
      '<main class="gyg-main">' +
      inner +
      "</main><footer class='gyg-foot'>" +
      esc(s.footerText || "") +
      "</footer>";
    bindFoto();
  }

  async function cargar() {
    css();
    var urls = [];
    if (window.GYG_STOCK_URL) urls.push(window.GYG_STOCK_URL);
    if (/localhost|127\.0\.0\.1/.test(location.hostname)) urls.push("/api/public/catalogo");
    urls.push("https://gist.githubusercontent.com/denissslaguiarrr-arch/" + GIST_ID + "/raw/stock.json?t=" + Date.now());
    var lastErr = "No se pudo cargar el stock.";
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        state.data = await res.json();
        render();
        return;
      } catch (err) {
        lastErr = err && err.message ? err.message : String(err);
      }
    }
    state.error = lastErr;
    render();
  }

  window.addEventListener("hashchange", function () {
    state.fotoIdx = 0;
    render();
  });
  cargar();
})();
