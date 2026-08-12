const API_BASE = "/api/vehiculos";

const state = {
  vehiculos: [],
  filtros: { q: "", estado: "", km: "" },
};

const el = {
  tablaBody: document.getElementById("tabla-body"),
  tablaVacio: document.getElementById("tabla-vacio"),
  contador: document.getElementById("contador"),
  alerta: document.getElementById("alerta"),

  filtroQ: document.getElementById("filtro-q"),
  filtroEstado: document.getElementById("filtro-estado"),
  filtroKm: document.getElementById("filtro-km"),
  btnLimpiarFiltros: document.getElementById("btn-limpiar-filtros"),

  btnNuevo: document.getElementById("btn-nuevo"),
  modalOverlay: document.getElementById("modal-overlay"),
  modal: document.getElementById("modal"),
  modalTitulo: document.getElementById("modal-titulo"),
  btnCerrarModal: document.getElementById("btn-cerrar-modal"),
  btnCancelar: document.getElementById("btn-cancelar"),
  form: document.getElementById("form-vehiculo"),

  fId: document.getElementById("f-id"),
  fMarca: document.getElementById("f-marca"),
  fModelo: document.getElementById("f-modelo"),
  fAnio: document.getElementById("f-anio"),
  fDominio: document.getElementById("f-dominio"),
  fKilometraje: document.getElementById("f-kilometraje"),
  fEstado: document.getElementById("f-estado"),
  fPrecio: document.getElementById("f-precio"),
  fMoneda: document.getElementById("f-moneda"),
  fImagenes: document.getElementById("f-imagenes"),
  fNotas: document.getElementById("f-notas"),
};

const ESTADO_BADGE = {
  Disponible: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20",
  Reservado: "bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
  Vendido: "bg-gray-200 text-gray-600 ring-1 ring-inset ring-gray-400/30",
};

function formatoMoneda(valor, moneda) {
  const simbolo = moneda === "USD" ? "US$" : "$";
  const numero = Number(valor).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${simbolo} ${numero}`;
}

function formatoKilometraje(km) {
  if (km === 0) {
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">0KM</span>`;
  }
  return `${Number(km).toLocaleString("es-AR")} km`;
}

function badgeEstado(estado) {
  const clase = ESTADO_BADGE[estado] || ESTADO_BADGE.Disponible;
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${clase}">${estado}</span>`;
}

function mostrarAlerta(mensaje, tipo = "error") {
  const estilos = {
    error: "bg-red-50 text-red-700 border border-red-200",
    ok: "bg-green-50 text-green-700 border border-green-200",
  };
  el.alerta.className = `mb-4 px-4 py-3 rounded-lg text-sm font-medium ${estilos[tipo] || estilos.error}`;
  el.alerta.textContent = mensaje;
  el.alerta.classList.remove("hidden");
  window.clearTimeout(mostrarAlerta._timeout);
  mostrarAlerta._timeout = window.setTimeout(() => {
    el.alerta.classList.add("hidden");
  }, 4500);
}

async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detalles = data && data.detalles ? ` (${data.detalles.join("; ")})` : "";
    const mensaje = (data && data.error ? data.error : "Error al comunicarse con el servidor") + detalles;
    throw new Error(mensaje);
  }

  return data;
}

function construirQuery() {
  const params = new URLSearchParams();
  if (state.filtros.q) params.set("q", state.filtros.q);
  if (state.filtros.estado) params.set("estado", state.filtros.estado);
  if (state.filtros.km) params.set("km", state.filtros.km);
  const query = params.toString();
  return query ? `${API_BASE}?${query}` : API_BASE;
}

async function cargarVehiculos() {
  try {
    state.vehiculos = await apiRequest(construirQuery());
    renderTabla();
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

function accionesRapidas(vehiculo) {
  const botones = [];

  if (vehiculo.estado !== "Reservado") {
    botones.push(
      `<button data-accion="estado" data-id="${vehiculo.id}" data-estado="Reservado" class="text-xs font-medium text-yellow-700 hover:text-yellow-900 hover:underline">Reservar</button>`
    );
  }
  if (vehiculo.estado !== "Vendido") {
    botones.push(
      `<button data-accion="estado" data-id="${vehiculo.id}" data-estado="Vendido" class="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline">Vender</button>`
    );
  }
  if (vehiculo.estado !== "Disponible") {
    botones.push(
      `<button data-accion="estado" data-id="${vehiculo.id}" data-estado="Disponible" class="text-xs font-medium text-green-700 hover:text-green-900 hover:underline">Disponible</button>`
    );
  }

  botones.push(
    `<button data-accion="editar" data-id="${vehiculo.id}" class="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">Editar</button>`
  );
  botones.push(
    `<button data-accion="eliminar" data-id="${vehiculo.id}" class="text-xs font-medium text-red-500 hover:text-red-700 hover:underline">Eliminar</button>`
  );

  return `<div class="flex flex-wrap justify-end gap-3">${botones.join("")}</div>`;
}

function renderTabla() {
  const filas = state.vehiculos;
  el.contador.textContent = `${filas.length} vehículo(s) en stock`;

  if (filas.length === 0) {
    el.tablaBody.innerHTML = "";
    el.tablaVacio.classList.remove("hidden");
    return;
  }

  el.tablaVacio.classList.add("hidden");
  el.tablaBody.innerHTML = filas
    .map(
      (v) => `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3">
          <div class="font-medium text-slate-900">${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</div>
          ${v.notas ? `<div class="text-xs text-slate-400 mt-0.5 max-w-xs truncate" title="${escapeHtml(v.notas)}">${escapeHtml(v.notas)}</div>` : ""}
        </td>
        <td class="px-4 py-3 font-mono text-slate-600">${escapeHtml(v.dominio)}</td>
        <td class="px-4 py-3">${v.anio}</td>
        <td class="px-4 py-3">${formatoKilometraje(v.kilometraje)}</td>
        <td class="px-4 py-3 font-medium">${formatoMoneda(v.precio, v.moneda)}</td>
        <td class="px-4 py-3">${badgeEstado(v.estado)}</td>
        <td class="px-4 py-3 text-right">${accionesRapidas(v)}</td>
      </tr>`
    )
    .join("");
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function abrirModal(vehiculo = null) {
  el.form.reset();
  if (vehiculo) {
    el.modalTitulo.textContent = `Editar ${vehiculo.marca} ${vehiculo.modelo}`;
    el.fId.value = vehiculo.id;
    el.fMarca.value = vehiculo.marca;
    el.fModelo.value = vehiculo.modelo;
    el.fAnio.value = vehiculo.anio;
    el.fDominio.value = vehiculo.dominio;
    el.fKilometraje.value = vehiculo.kilometraje;
    el.fEstado.value = vehiculo.estado;
    el.fPrecio.value = vehiculo.precio;
    el.fMoneda.value = vehiculo.moneda;
    el.fImagenes.value = (vehiculo.imagenes_url || []).join(", ");
    el.fNotas.value = vehiculo.notas || "";
  } else {
    el.modalTitulo.textContent = "Nuevo vehículo";
    el.fId.value = "";
    el.fEstado.value = "Disponible";
    el.fMoneda.value = "ARS";
    el.fKilometraje.value = 0;
  }

  el.modalOverlay.classList.remove("hidden");
  el.modal.classList.remove("hidden");
  el.fMarca.focus();
}

function cerrarModal() {
  el.modalOverlay.classList.add("hidden");
  el.modal.classList.add("hidden");
}

function leerFormulario() {
  return {
    marca: el.fMarca.value.trim(),
    modelo: el.fModelo.value.trim(),
    anio: Number(el.fAnio.value),
    dominio: el.fDominio.value.trim(),
    kilometraje: el.fKilometraje.value === "" ? 0 : Number(el.fKilometraje.value),
    estado: el.fEstado.value,
    precio: Number(el.fPrecio.value),
    moneda: el.fMoneda.value,
    imagenes_url: el.fImagenes.value,
    notas: el.fNotas.value.trim(),
  };
}

async function manejarSubmit(evento) {
  evento.preventDefault();
  const datos = leerFormulario();
  const id = el.fId.value;

  try {
    if (id) {
      await apiRequest(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(datos) });
      mostrarAlerta("Vehículo actualizado correctamente.", "ok");
    } else {
      await apiRequest(API_BASE, { method: "POST", body: JSON.stringify(datos) });
      mostrarAlerta("Vehículo creado correctamente.", "ok");
    }
    cerrarModal();
    await cargarVehiculos();
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function cambiarEstado(id, estado) {
  try {
    await apiRequest(`${API_BASE}/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    mostrarAlerta(`Estado actualizado a "${estado}".`, "ok");
    await cargarVehiculos();
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function eliminarVehiculo(id) {
  const vehiculo = state.vehiculos.find((v) => v.id === Number(id));
  const nombre = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.dominio})` : "este vehículo";
  if (!window.confirm(`¿Seguro que querés eliminar ${nombre}? Esta acción no se puede deshacer.`)) {
    return;
  }
  try {
    await apiRequest(`${API_BASE}/${id}`, { method: "DELETE" });
    mostrarAlerta("Vehículo eliminado.", "ok");
    await cargarVehiculos();
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

function manejarClickTabla(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const { accion, id, estado } = boton.dataset;

  if (accion === "editar") {
    const vehiculo = state.vehiculos.find((v) => v.id === Number(id));
    if (vehiculo) abrirModal(vehiculo);
  } else if (accion === "estado") {
    cambiarEstado(id, estado);
  } else if (accion === "eliminar") {
    eliminarVehiculo(id);
  }
}

function debounce(fn, espera = 300) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), espera);
  };
}

const buscarConDebounce = debounce(() => {
  state.filtros.q = el.filtroQ.value.trim();
  cargarVehiculos();
}, 300);

el.filtroQ.addEventListener("input", buscarConDebounce);
el.filtroEstado.addEventListener("change", () => {
  state.filtros.estado = el.filtroEstado.value;
  cargarVehiculos();
});
el.filtroKm.addEventListener("change", () => {
  state.filtros.km = el.filtroKm.value;
  cargarVehiculos();
});
el.btnLimpiarFiltros.addEventListener("click", () => {
  state.filtros = { q: "", estado: "", km: "" };
  el.filtroQ.value = "";
  el.filtroEstado.value = "";
  el.filtroKm.value = "";
  cargarVehiculos();
});

el.btnNuevo.addEventListener("click", () => abrirModal());
el.btnCerrarModal.addEventListener("click", cerrarModal);
el.btnCancelar.addEventListener("click", cerrarModal);
el.modalOverlay.addEventListener("click", cerrarModal);
el.form.addEventListener("submit", manejarSubmit);
el.tablaBody.addEventListener("click", manejarClickTabla);

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !el.modal.classList.contains("hidden")) {
    cerrarModal();
  }
});

cargarVehiculos();
