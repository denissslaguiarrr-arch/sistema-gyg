const ESTADO_BADGE = {
  Disponible: "bg-green-100 text-green-700",
  Reservado: "bg-yellow-100 text-yellow-700",
  Vendido: "bg-gray-200 text-gray-600",
};

function formatoMoneda(valor, moneda) {
  const simbolo = moneda === "USD" ? "US$" : "$";
  const numero = Number(valor).toLocaleString("es-AR", { maximumFractionDigits: 2 });
  return `${simbolo} ${numero}`;
}

function tienePrecioOferta(v) {
  return (
    v.precio_oferta != null &&
    Number.isFinite(Number(v.precio_oferta)) &&
    Number(v.precio_oferta) < Number(v.precio)
  );
}

async function iniciar() {
  const id = new URLSearchParams(window.location.search).get("id");
  const contenedor = document.getElementById("contenido");
  const errorBox = document.getElementById("error");

  if (!id) {
    errorBox.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch(`/api/public/vehiculos/${id}`);
    if (!res.ok) throw new Error("No encontrado");
    const v = await res.json();

    document.title = `${v.marca} ${v.modelo} ${v.anio} · Ficha`;
    document.getElementById("titulo").textContent = `${v.marca} ${v.modelo}`;
    document.getElementById("subtitulo").textContent = `${v.anio}`;

    const badge = document.getElementById("badge-estado");
    badge.textContent = v.estado;
    badge.className = `shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_BADGE[v.estado] || ESTADO_BADGE.Disponible}`;

    const precioEl = document.getElementById("precio");
    const precioAnteriorEl = document.getElementById("precio-anterior");
    const badgeOferta = document.getElementById("badge-oferta");
    if (tienePrecioOferta(v)) {
      precioAnteriorEl.textContent = formatoMoneda(v.precio, v.moneda);
      precioAnteriorEl.classList.remove("hidden");
      precioEl.textContent = formatoMoneda(v.precio_oferta, v.moneda);
      precioEl.classList.remove("text-indigo-700");
      precioEl.classList.add("text-emerald-700");
      badgeOferta.classList.remove("hidden");
    } else {
      precioEl.textContent = formatoMoneda(v.precio, v.moneda);
    }
    document.getElementById("dato-anio").textContent = v.anio;
    document.getElementById("dato-km").textContent = v.es_0km ? "0KM" : `${Number(v.kilometraje).toLocaleString("es-AR")} km`;

    const specsExtra = [
      ["Versión", v.version],
      ["Combustible", v.combustible],
      ["Transmisión", v.transmision],
      ["Tracción", v.traccion],
      ["Puertas", v.puertas],
      ["Color", v.color],
      ["Motor", v.motor],
      ["Potencia", v.potencia],
      ["Carrocería", v.carroceria],
    ].filter(([, valor]) => valor !== "" && valor !== null && valor !== undefined);

    const gridSpecs = document.getElementById("grid-specs");
    for (const [etiqueta, valor] of specsExtra) {
      const celda = document.createElement("div");
      celda.className = "bg-slate-50 rounded-lg px-3 py-2";
      celda.innerHTML = `<p class="text-xs text-slate-400">${etiqueta}</p><p class="font-semibold"></p>`;
      celda.querySelector("p.font-semibold").textContent = valor;
      gridSpecs.appendChild(celda);
    }

    if (v.equipamiento && v.equipamiento.length) {
      document.getElementById("bloque-equipamiento").classList.remove("hidden");
      document.getElementById("lista-equipamiento").innerHTML = v.equipamiento
        .map(
          (item) =>
            `<li class="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1"></li>`
        )
        .join("");
      document
        .querySelectorAll("#lista-equipamiento li")
        .forEach((li, i) => (li.textContent = v.equipamiento[i]));
    }

    if (v.notas) {
      document.getElementById("notas").textContent = v.notas;
    } else {
      document.getElementById("bloque-notas").classList.add("hidden");
    }

    const imagenes = v.imagenes_url && v.imagenes_url.length ? v.imagenes_url : [];
    const marcoFoto = document.getElementById("marco-foto");
    const miniaturas = document.getElementById("miniaturas");
    const media = window.GygMedia || {};

    function asegurarLightbox() {
      let overlay = document.getElementById("lightbox");
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.id = "lightbox";
      overlay.className =
        "hidden fixed inset-0 z-50 bg-black/90 flex flex-col cursor-zoom-out no-imprimir";
      overlay.innerHTML = `
        <div class="flex justify-between items-center px-4 py-3 text-white">
          <div class="flex gap-2">
            <button type="button" data-z="out" class="bg-slate-800 rounded-lg px-3 py-1">−</button>
            <button type="button" data-z="in" class="bg-slate-800 rounded-lg px-3 py-1">+</button>
          </div>
          <button type="button" data-z="close" class="bg-slate-800 rounded-lg px-3 py-1">Cerrar</button>
        </div>
        <div class="flex-1 flex items-center justify-center p-4 overflow-auto" data-stage="1">
          <img class="max-w-full max-h-[80vh] object-contain" alt="Foto ampliada" />
        </div>`;
      overlay.dataset.zoom = "1";
      const img = () => overlay.querySelector("img");
      const aplicar = () => {
        img().style.transform = `scale(${overlay.dataset.zoom})`;
      };
      overlay.addEventListener("click", (evento) => {
        const btn = evento.target.closest("button[data-z]");
        if (!btn) {
          if (evento.target === overlay || evento.target.dataset.stage) overlay.classList.add("hidden");
          return;
        }
        evento.stopPropagation();
        const z = btn.dataset.z;
        const actual = Number(overlay.dataset.zoom) || 1;
        if (z === "close") overlay.classList.add("hidden");
        if (z === "in") overlay.dataset.zoom = String(Math.min(4, actual + 0.4));
        if (z === "out") overlay.dataset.zoom = String(Math.max(1, actual - 0.4));
        aplicar();
      });
      overlay.addEventListener(
        "touchmove",
        (evento) => {
          if (evento.touches.length === 2) evento.preventDefault();
        },
        { passive: false }
      );
      let startDist = 0;
      let startZoom = 1;
      overlay.addEventListener(
        "touchstart",
        (evento) => {
          if (evento.touches.length === 2) {
            const a = evento.touches[0];
            const b = evento.touches[1];
            const dx = a.clientX - b.clientX;
            const dy = a.clientY - b.clientY;
            startDist = Math.sqrt(dx * dx + dy * dy);
            startZoom = Number(overlay.dataset.zoom) || 1;
          }
        },
        { passive: true }
      );
      overlay.addEventListener(
        "touchmove",
        (evento) => {
          if (evento.touches.length !== 2 || !startDist) return;
          const a = evento.touches[0];
          const b = evento.touches[1];
          const dx = a.clientX - b.clientX;
          const dy = a.clientY - b.clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          overlay.dataset.zoom = String(Math.min(4, Math.max(1, startZoom * (dist / startDist))));
          aplicar();
        },
        { passive: false }
      );
      document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") overlay.classList.add("hidden");
      });
      document.body.appendChild(overlay);
      return overlay;
    }

    function abrirLightbox(url) {
      const overlay = asegurarLightbox();
      overlay.dataset.zoom = "1";
      const foto = overlay.querySelector("img");
      foto.src = url;
      foto.style.transform = "scale(1)";
      overlay.classList.remove("hidden");
    }

    function mostrarFoto(url) {
      const info = media.describirMedia ? media.describirMedia(url) : { tipo: "img", src: url, esVideo: false };
      if (info.tipo === "iframe") {
        marcoFoto.classList.remove("cursor-zoom-in");
        marcoFoto.onclick = null;
        marcoFoto.innerHTML = `<iframe src="${info.src}" class="w-full aspect-video bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Video del vehículo"></iframe>`;
        return;
      }
      if (info.tipo === "video") {
        marcoFoto.classList.remove("cursor-zoom-in");
        marcoFoto.onclick = null;
        marcoFoto.innerHTML = `<video src="${info.src}" class="w-full max-h-[32rem] bg-black" controls playsinline></video>`;
        return;
      }
      let img = document.getElementById("foto-principal");
      if (!img) {
        marcoFoto.innerHTML = `<img id="foto-principal" class="w-full max-h-[32rem] object-contain bg-slate-900" alt="Foto del vehículo" />`;
        img = document.getElementById("foto-principal");
      }
      img.src = info.src;
      marcoFoto.classList.add("cursor-zoom-in");
      marcoFoto.onclick = () => abrirLightbox(info.src);
    }

    if (imagenes.length > 0) {
      mostrarFoto(imagenes[0]);
      miniaturas.innerHTML = imagenes
        .map((url, i) => {
          const thumb = media.miniaturaDe ? media.miniaturaDe(url) : url;
          const esVid = media.esVideo ? media.esVideo(url) : false;
          if (esVid && !thumb) {
            return `<button type="button" data-i="${i}" class="w-16 h-16 rounded-lg bg-slate-900 text-white shrink-0">▶</button>`;
          }
          return `<img src="${thumb || url}" data-i="${i}" class="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer shrink-0" alt="" />`;
        })
        .join("");
      miniaturas.addEventListener("click", (evento) => {
        const nodo = evento.target.closest("[data-i]");
        if (nodo) mostrarFoto(imagenes[Number(nodo.dataset.i)]);
      });
    } else {
      marcoFoto.remove();
    }

    contenedor.classList.remove("hidden");

    const textoPrecio = tienePrecioOferta(v)
      ? `${formatoMoneda(v.precio_oferta, v.moneda)} (antes ${formatoMoneda(v.precio, v.moneda)})`
      : formatoMoneda(v.precio, v.moneda);
    const textoWhatsapp = `${v.marca} ${v.modelo} ${v.anio} — ${textoPrecio}${v.es_0km ? " (0KM)" : ""}\n${window.location.href}`;
    document.getElementById("btn-whatsapp").addEventListener("click", () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(textoWhatsapp)}`, "_blank");
    });
    document.getElementById("btn-copiar").addEventListener("click", async () => {
      await navigator.clipboard.writeText(window.location.href);
      const boton = document.getElementById("btn-copiar");
      const original = boton.textContent;
      boton.textContent = "¡Copiado!";
      setTimeout(() => (boton.textContent = original), 1500);
    });
    document.getElementById("btn-imprimir").addEventListener("click", () => window.print());
  } catch (_err) {
    errorBox.classList.remove("hidden");
  }
}

iniciar();
