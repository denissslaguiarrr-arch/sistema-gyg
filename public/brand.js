(function (global) {
  var DEFAULT_NAME = "Concesionaria";

  function nombreMarca(valor) {
    var n = String(valor == null ? "" : valor).trim();
    return n || DEFAULT_NAME;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wordmarkHtml(valor) {
    return escapeHtml(nombreMarca(valor)).replace(
      /&amp;/g,
      '<span class="marca-sep" aria-hidden="true"></span>'
    );
  }

  function aplicarMarca(marca) {
    marca = marca || {};
    var nombre = nombreMarca(marca.nombre);
    var tagline = String(marca.tagline || "").trim();
    var logoUrl = String(marca.logoUrl || "").trim();

    document.querySelectorAll("[data-brand-name]").forEach(function (el) {
      el.textContent = nombre;
    });
    document.querySelectorAll("[data-brand-tagline]").forEach(function (el) {
      el.textContent = tagline;
      el.classList.toggle("hidden", !tagline);
    });
    document.querySelectorAll("[data-brand-logo]").forEach(function (el) {
      if (logoUrl) {
        el.src = logoUrl;
        el.alt = nombre;
        el.classList.remove("hidden");
      } else {
        el.removeAttribute("src");
        el.alt = "";
        el.classList.add("hidden");
      }
    });
    document.querySelectorAll("[data-brand-wordmark]").forEach(function (el) {
      el.innerHTML = wordmarkHtml(nombre);
      el.classList.toggle("hidden", Boolean(logoUrl));
    });
    var titleEl = document.querySelector("title[data-brand-title]");
    if (titleEl) {
      var base = titleEl.getAttribute("data-brand-title") || "";
      document.title = base ? base + " · " + nombre : nombre;
    }
    global.__marca = { nombre: nombre, tagline: tagline, logoUrl: logoUrl };
  }

  async function cargarMarca() {
    try {
      var res = await fetch("/api/public/marca");
      if (!res.ok) throw new Error("fail");
      aplicarMarca(await res.json());
    } catch (_err) {
      aplicarMarca({});
    }
  }

  global.MarcaSitio = {
    DEFAULT_NAME: DEFAULT_NAME,
    nombreMarca: nombreMarca,
    wordmarkHtml: wordmarkHtml,
    aplicarMarca: aplicarMarca,
    cargarMarca: cargarMarca,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cargarMarca);
  } else {
    cargarMarca();
  }
})(window);
