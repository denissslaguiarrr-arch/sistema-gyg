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

    document.getElementById("precio").textContent = formatoMoneda(v.precio, v.moneda);
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
    const fotoPrincipal = document.getElementById("foto-principal");
    const miniaturas = document.getElementById("miniaturas");

    function mostrarFoto(url) {
      fotoPrincipal.src = url;
    }

    if (imagenes.length > 0) {
      mostrarFoto(imagenes[0]);
      miniaturas.innerHTML = imagenes
        .map(
          (url, i) =>
            `<img src="${url}" data-i="${i}" class="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer shrink-0" />`
        )
        .join("");
      miniaturas.addEventListener("click", (evento) => {
        const img = evento.target.closest("img[data-i]");
        if (img) mostrarFoto(imagenes[Number(img.dataset.i)]);
      });
    } else {
      fotoPrincipal.remove();
    }

    contenedor.classList.remove("hidden");

    const textoWhatsapp = `${v.marca} ${v.modelo} ${v.anio} — ${formatoMoneda(v.precio, v.moneda)}${v.es_0km ? " (0KM)" : ""}\n${window.location.href}`;
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
