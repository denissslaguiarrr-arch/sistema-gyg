const API_BASE = "/api/vehiculos";

const state = {
  vehiculos: [],
  usuario: null,
  filtros: { q: "", estado: "", km: "" },
  vista: "activos", // "activos" | "papelera"
  orden: { campo: null, direccion: "desc" },
  pagina: 1,
  porPagina: 24,
  totalPaginas: 1,
  total: 0,
  formImagenes: [],
};

const el = {
  tablaBody: document.getElementById("tabla-body"),
  tablaVacio: document.getElementById("tabla-vacio"),
  contador: document.getElementById("contador"),
  alerta: document.getElementById("alerta"),

  usuarioActual: document.getElementById("usuario-actual"),
  btnLogout: document.getElementById("btn-logout"),
  btnCambiarPassword: document.getElementById("btn-cambiar-password"),
  btnUsuarios: document.getElementById("btn-usuarios"),
  btnConfigSitio: document.getElementById("btn-config-sitio"),
  btnPublicar: document.getElementById("btn-publicar"),

  kpiTotal: document.getElementById("kpi-total"),
  kpiDisponibles: document.getElementById("kpi-disponibles"),
  kpiReservados: document.getElementById("kpi-reservados"),
  kpiVendidos: document.getElementById("kpi-vendidos"),
  kpiValorArs: document.getElementById("kpi-valor-ars"),
  kpiValorUsd: document.getElementById("kpi-valor-usd"),

  filtroQ: document.getElementById("filtro-q"),
  filtroEstado: document.getElementById("filtro-estado"),
  filtroKm: document.getElementById("filtro-km"),
  btnLimpiarFiltros: document.getElementById("btn-limpiar-filtros"),
  btnExportar: document.getElementById("btn-exportar"),
  btnImportar: document.getElementById("btn-importar"),
  btnPapelera: document.getElementById("btn-papelera"),

  selectorPorPagina: document.getElementById("selector-porpagina"),
  btnPaginaAnterior: document.getElementById("btn-pagina-anterior"),
  btnPaginaSiguiente: document.getElementById("btn-pagina-siguiente"),
  textoPagina: document.getElementById("texto-pagina"),

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
  fNotas: document.getElementById("f-notas"),
  fVersion: document.getElementById("f-version"),
  fCarroceria: document.getElementById("f-carroceria"),
  fCombustible: document.getElementById("f-combustible"),
  fTransmision: document.getElementById("f-transmision"),
  fTraccion: document.getElementById("f-traccion"),
  fPuertas: document.getElementById("f-puertas"),
  fColor: document.getElementById("f-color"),
  fMotor: document.getElementById("f-motor"),
  fPotencia: document.getElementById("f-potencia"),
  fDestacado: document.getElementById("f-destacado"),
  fEquipamiento: document.getElementById("f-equipamiento"),
  galeriaImagenes: document.getElementById("galeria-imagenes"),
  fImagenArchivo: document.getElementById("f-imagen-archivo"),
  fImagenUrl: document.getElementById("f-imagen-url"),
  imagenesEstado: document.getElementById("imagenes-estado"),

  modalHistorialOverlay: document.getElementById("modal-historial-overlay"),
  modalHistorial: document.getElementById("modal-historial"),
  historialTitulo: document.getElementById("historial-titulo"),
  historialLista: document.getElementById("historial-lista"),
  btnCerrarHistorial: document.getElementById("btn-cerrar-historial"),

  modalPasswordOverlay: document.getElementById("modal-password-overlay"),
  modalPassword: document.getElementById("modal-password"),
  formPassword: document.getElementById("form-password"),
  pActual: document.getElementById("p-actual"),
  pNueva: document.getElementById("p-nueva"),
  btnCerrarPassword: document.getElementById("btn-cerrar-password"),
  btnCancelarPassword: document.getElementById("btn-cancelar-password"),

  modalUsuariosOverlay: document.getElementById("modal-usuarios-overlay"),
  modalUsuarios: document.getElementById("modal-usuarios"),
  btnCerrarUsuarios: document.getElementById("btn-cerrar-usuarios"),
  listaUsuarios: document.getElementById("lista-usuarios"),
  formNuevoUsuario: document.getElementById("form-nuevo-usuario"),
  uUsername: document.getElementById("u-username"),
  uPassword: document.getElementById("u-password"),
  uRol: document.getElementById("u-rol"),

  modalImportarOverlay: document.getElementById("modal-importar-overlay"),
  modalImportar: document.getElementById("modal-importar"),
  formImportar: document.getElementById("form-importar"),
  iArchivo: document.getElementById("i-archivo"),
  importarResultado: document.getElementById("importar-resultado"),
  btnCerrarImportar: document.getElementById("btn-cerrar-importar"),
  btnCancelarImportar: document.getElementById("btn-cancelar-importar"),
  btnConfirmarImportar: document.getElementById("btn-confirmar-importar"),

  modalConfigOverlay: document.getElementById("modal-config-overlay"),
  modalConfig: document.getElementById("modal-config"),
  formConfig: document.getElementById("form-config"),
  cNombre: document.getElementById("c-nombre"),
  cTagline: document.getElementById("c-tagline"),
  cWhatsapp: document.getElementById("c-whatsapp"),
  cFooter: document.getElementById("c-footer"),
  cHero: document.getElementById("c-hero"),
  btnCerrarConfig: document.getElementById("btn-cerrar-config"),
  btnCancelarConfig: document.getElementById("btn-cancelar-config"),
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

function formatoFecha(fechaIso) {
  if (!fechaIso) return "";
  const fecha = new Date(fechaIso.replace(" ", "T") + "Z");
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  return fecha.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
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

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new Error("Sesión expirada");
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detalles = data && data.detalles ? ` (${data.detalles.join("; ")})` : "";
    const mensaje = (data && data.error ? data.error : "Error al comunicarse con el servidor") + detalles;
    throw new Error(mensaje);
  }

  return data;
}

// ---------- Sesión ----------

function esAdmin() {
  return state.usuario && state.usuario.rol === "admin";
}

async function cargarUsuario() {
  try {
    const data = await apiRequest("/api/auth/me");
    state.usuario = data.usuario;
    const etiquetaRol = data.usuario.rol === "admin" ? "admin" : "vendedor";
    el.usuarioActual.textContent = `👤 ${data.usuario.username} (${etiquetaRol})`;

    const admin = esAdmin();
    el.btnNuevo.classList.toggle("hidden", !admin);
    el.btnPapelera.classList.toggle("hidden", !admin);
    el.btnUsuarios.classList.toggle("hidden", !admin);
    el.btnImportar.classList.toggle("hidden", !admin);
    el.btnConfigSitio.classList.toggle("hidden", !admin);
    el.btnPublicar.classList.toggle("hidden", !admin);
  } catch (_err) {
    // apiRequest ya redirige a /login.html si la sesión no es válida.
  }
}

el.btnLogout.addEventListener("click", async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login.html";
  }
});

el.btnCambiarPassword.addEventListener("click", () => {
  el.formPassword.reset();
  el.modalPasswordOverlay.classList.remove("hidden");
  el.modalPassword.classList.remove("hidden");
  el.pActual.focus();
});

function cerrarModalPassword() {
  el.modalPasswordOverlay.classList.add("hidden");
  el.modalPassword.classList.add("hidden");
}

el.btnCerrarPassword.addEventListener("click", cerrarModalPassword);
el.btnCancelarPassword.addEventListener("click", cerrarModalPassword);
el.modalPasswordOverlay.addEventListener("click", cerrarModalPassword);

el.formPassword.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  try {
    await apiRequest("/api/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify({
        passwordActual: el.pActual.value,
        passwordNueva: el.pNueva.value,
      }),
    });
    mostrarAlerta("Contraseña actualizada correctamente.", "ok");
    cerrarModalPassword();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

// ---------- Gestión de usuarios (solo admin) ----------

function cerrarModalUsuarios() {
  el.modalUsuariosOverlay.classList.add("hidden");
  el.modalUsuarios.classList.add("hidden");
}

async function cargarUsuarios() {
  try {
    const usuarios = await apiRequest("/api/usuarios");
    el.listaUsuarios.innerHTML = usuarios
      .map((u) => {
        const esUnoMismo = state.usuario && u.id === state.usuario.id;
        const badgeRol =
          u.rol === "admin"
            ? "bg-indigo-100 text-indigo-700"
            : "bg-slate-100 text-slate-600";
        return `
        <div class="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2">
          <div>
            <p class="text-sm font-medium text-slate-800">${escapeHtml(u.username)}${esUnoMismo ? " (vos)" : ""}</p>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeRol}">${u.rol}</span>
          </div>
          ${
            esUnoMismo
              ? ""
              : `<div class="flex gap-2">
                  <button data-accion-usuario="cambiar-rol" data-id="${u.id}" data-rol="${u.rol === "admin" ? "vendedor" : "admin"}" class="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                    Hacer ${u.rol === "admin" ? "vendedor" : "admin"}
                  </button>
                  <button data-accion-usuario="eliminar" data-id="${u.id}" class="text-xs font-medium text-red-500 hover:text-red-700 hover:underline">Eliminar</button>
                </div>`
          }
        </div>`;
      })
      .join("");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

el.btnUsuarios.addEventListener("click", () => {
  el.formNuevoUsuario.reset();
  el.modalUsuariosOverlay.classList.remove("hidden");
  el.modalUsuarios.classList.remove("hidden");
  cargarUsuarios();
});
el.btnCerrarUsuarios.addEventListener("click", cerrarModalUsuarios);
el.modalUsuariosOverlay.addEventListener("click", cerrarModalUsuarios);

el.formNuevoUsuario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  try {
    await apiRequest("/api/usuarios", {
      method: "POST",
      body: JSON.stringify({
        username: el.uUsername.value.trim(),
        password: el.uPassword.value,
        rol: el.uRol.value,
      }),
    });
    mostrarAlerta("Usuario creado correctamente.", "ok");
    el.formNuevoUsuario.reset();
    await cargarUsuarios();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

el.listaUsuarios.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button[data-accion-usuario]");
  if (!boton) return;
  const { accionUsuario, id, rol } = boton.dataset;

  try {
    if (accionUsuario === "cambiar-rol") {
      await apiRequest(`/api/usuarios/${id}`, { method: "PATCH", body: JSON.stringify({ rol }) });
      mostrarAlerta("Rol actualizado.", "ok");
    } else if (accionUsuario === "eliminar") {
      if (!window.confirm("¿Eliminar este usuario del panel?")) return;
      await apiRequest(`/api/usuarios/${id}`, { method: "DELETE" });
      mostrarAlerta("Usuario eliminado.", "ok");
    }
    await cargarUsuarios();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

// ---------- Configuración del sitio público (solo admin) ----------

function cerrarModalConfig() {
  el.modalConfigOverlay.classList.add("hidden");
  el.modalConfig.classList.add("hidden");
}

el.btnConfigSitio.addEventListener("click", async () => {
  try {
    const config = await apiRequest("/api/config/sitio");
    el.cNombre.value = config.nombre || "";
    el.cTagline.value = config.tagline || "";
    el.cWhatsapp.value = config.whatsapp || "";
    el.cFooter.value = config.footerText || "";
    el.cHero.value = config.heroImage || "";
    el.modalConfigOverlay.classList.remove("hidden");
    el.modalConfig.classList.remove("hidden");
  } catch (err) {
    mostrarAlerta(err.message);
  }
});
el.btnCerrarConfig.addEventListener("click", cerrarModalConfig);
el.btnCancelarConfig.addEventListener("click", cerrarModalConfig);
el.modalConfigOverlay.addEventListener("click", cerrarModalConfig);

el.formConfig.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  try {
    await apiRequest("/api/config/sitio", {
      method: "PUT",
      body: JSON.stringify({
        nombre: el.cNombre.value.trim(),
        tagline: el.cTagline.value.trim(),
        whatsapp: el.cWhatsapp.value.trim(),
        footerText: el.cFooter.value.trim(),
        heroImage: el.cHero.value.trim(),
      }),
    });
    mostrarAlerta("Configuración del sitio guardada.", "ok");
    cerrarModalConfig();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

// ---------- Publicar en la web (solo admin) ----------

el.btnPublicar.addEventListener("click", async () => {
  if (
    !window.confirm(
      "¿Publicar el stock actual en el sitio web? Esto actualiza el catálogo que ven tus clientes."
    )
  ) {
    return;
  }

  el.btnPublicar.disabled = true;
  const textoOriginal = el.btnPublicar.textContent;
  el.btnPublicar.textContent = "Publicando...";

  try {
    const resultado = await apiRequest("/api/sync/publicar", { method: "POST" });
    mostrarAlerta(
      `Se publicaron ${resultado.vehiculosPublicados} vehículo(s) en el sitio web.`,
      "ok"
    );
  } catch (err) {
    mostrarAlerta(err.message);
  } finally {
    el.btnPublicar.disabled = false;
    el.btnPublicar.textContent = textoOriginal;
  }
});

// ---------- Importar vehículos por CSV (solo admin) ----------

function cerrarModalImportar() {
  el.modalImportarOverlay.classList.add("hidden");
  el.modalImportar.classList.add("hidden");
}

el.btnImportar.addEventListener("click", () => {
  el.formImportar.reset();
  el.importarResultado.classList.add("hidden");
  el.importarResultado.innerHTML = "";
  el.modalImportarOverlay.classList.remove("hidden");
  el.modalImportar.classList.remove("hidden");
});
el.btnCerrarImportar.addEventListener("click", cerrarModalImportar);
el.btnCancelarImportar.addEventListener("click", cerrarModalImportar);
el.modalImportarOverlay.addEventListener("click", cerrarModalImportar);

el.formImportar.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const archivo = el.iArchivo.files && el.iArchivo.files[0];
  if (!archivo) return;

  el.btnConfirmarImportar.disabled = true;
  el.btnConfirmarImportar.textContent = "Importando...";
  el.importarResultado.classList.add("hidden");

  try {
    const formData = new FormData();
    formData.append("archivo", archivo);

    const res = await fetch("/api/vehiculos/import", { method: "POST", body: formData });
    if (res.status === 401) {
      window.location.href = "/login.html";
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo importar el archivo");

    const resumen = `<p class="font-medium text-slate-800">${data.creados} creado(s), ${data.actualizados} actualizado(s), ${data.errores.length} con error.</p>`;
    const detalleErrores = data.errores.length
      ? `<ul class="list-disc pl-5 text-red-600 space-y-1">${data.errores
          .map((e) => `<li>Fila ${e.fila} (${escapeHtml(e.dominio)}): ${escapeHtml(e.error)}</li>`)
          .join("")}</ul>`
      : "";

    el.importarResultado.innerHTML = resumen + detalleErrores;
    el.importarResultado.classList.remove("hidden");

    mostrarAlerta(
      `Importación completa: ${data.creados} creado(s), ${data.actualizados} actualizado(s).`,
      "ok"
    );
    await Promise.all([cargarVehiculos(), cargarResumen()]);
  } catch (err) {
    mostrarAlerta(err.message);
  } finally {
    el.btnConfirmarImportar.disabled = false;
    el.btnConfirmarImportar.textContent = "Importar";
  }
});

// ---------- KPIs ----------

async function cargarResumen() {
  try {
    const resumen = await apiRequest(`${API_BASE}/resumen`);
    el.kpiTotal.textContent = resumen.total;
    el.kpiDisponibles.textContent = resumen.disponibles;
    el.kpiReservados.textContent = resumen.reservados;
    el.kpiVendidos.textContent = resumen.vendidos;
    el.kpiValorArs.textContent = `$ ${Number(resumen.valor_stock_ars).toLocaleString("es-AR")} ARS`;
    el.kpiValorUsd.textContent = `US$ ${Number(resumen.valor_stock_usd).toLocaleString("es-AR")}`;
  } catch (_err) {
    // Si falla, las KPIs simplemente quedan en su valor previo.
  }
}

// ---------- Listado, filtros, orden ----------

function construirQuery() {
  const params = new URLSearchParams();
  if (state.filtros.q) params.set("q", state.filtros.q);
  if (state.filtros.estado) params.set("estado", state.filtros.estado);
  if (state.filtros.km) params.set("km", state.filtros.km);
  if (state.vista === "papelera") params.set("papelera", "1");
  if (state.orden.campo) {
    params.set("orden", state.orden.campo);
    params.set("direccion", state.orden.direccion);
  }
  params.set("pagina", state.pagina);
  params.set("porPagina", state.porPagina);
  return `${API_BASE}?${params.toString()}`;
}

function actualizarUrlExportar() {
  const params = new URLSearchParams();
  if (state.filtros.q) params.set("q", state.filtros.q);
  if (state.filtros.estado) params.set("estado", state.filtros.estado);
  if (state.filtros.km) params.set("km", state.filtros.km);
  const query = params.toString();
  el.btnExportar.href = query ? `${API_BASE}/export.csv?${query}` : `${API_BASE}/export.csv`;
}

async function cargarVehiculos() {
  try {
    const respuesta = await apiRequest(construirQuery());
    state.vehiculos = respuesta.items;
    state.total = respuesta.total;
    state.totalPaginas = respuesta.totalPaginas;
    state.pagina = respuesta.pagina;
    renderTabla();
    renderPaginador();
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

function renderPaginador() {
  el.textoPagina.textContent = `Página ${state.pagina} de ${state.totalPaginas}`;
  el.btnPaginaAnterior.disabled = state.pagina <= 1;
  el.btnPaginaSiguiente.disabled = state.pagina >= state.totalPaginas;
}

document.querySelectorAll("[data-orden]").forEach((th) => {
  th.addEventListener("click", () => {
    const campo = th.dataset.orden;
    if (state.orden.campo === campo) {
      state.orden.direccion = state.orden.direccion === "asc" ? "desc" : "asc";
    } else {
      state.orden.campo = campo;
      state.orden.direccion = "asc";
    }
    document.querySelectorAll(".orden-indicador").forEach((span) => (span.textContent = ""));
    th.querySelector(".orden-indicador").textContent = state.orden.direccion === "asc" ? "▲" : "▼";
    state.pagina = 1;
    cargarVehiculos();
  });
});

el.selectorPorPagina.addEventListener("change", () => {
  state.porPagina = Number(el.selectorPorPagina.value);
  state.pagina = 1;
  cargarVehiculos();
});
el.btnPaginaAnterior.addEventListener("click", () => {
  if (state.pagina <= 1) return;
  state.pagina -= 1;
  cargarVehiculos();
});
el.btnPaginaSiguiente.addEventListener("click", () => {
  if (state.pagina >= state.totalPaginas) return;
  state.pagina += 1;
  cargarVehiculos();
});

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

  if (esAdmin()) {
    botones.push(
      `<button data-accion="editar" data-id="${vehiculo.id}" class="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">Editar</button>`
    );
  }
  botones.push(
    `<a href="/ficha.html?id=${vehiculo.id}" target="_blank" rel="noopener" class="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline">Ficha</a>`
  );
  botones.push(
    `<button data-accion="historial" data-id="${vehiculo.id}" class="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline">Historial</button>`
  );
  if (esAdmin()) {
    botones.push(
      `<button data-accion="eliminar" data-id="${vehiculo.id}" class="text-xs font-medium text-red-500 hover:text-red-700 hover:underline">Eliminar</button>`
    );
  }

  return `<div class="flex flex-wrap justify-end gap-3">${botones.join("")}</div>`;
}

function accionesPapelera(vehiculo) {
  return `<div class="flex flex-wrap justify-end gap-3">
    <button data-accion="restaurar" data-id="${vehiculo.id}" class="text-xs font-medium text-green-700 hover:text-green-900 hover:underline">Restaurar</button>
    <button data-accion="eliminar-permanente" data-id="${vehiculo.id}" class="text-xs font-medium text-red-600 hover:text-red-800 hover:underline">Eliminar definitivamente</button>
  </div>`;
}

function miniatura(vehiculo) {
  const primera = (vehiculo.imagenes_url || [])[0];
  if (!primera) {
    return `<div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-lg">🚗</div>`;
  }
  return `<img src="${escapeHtml(primera)}" class="w-10 h-10 rounded-lg object-cover border border-slate-200" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-lg', textContent:'🚗'}))" />`;
}

function renderTabla() {
  const filas = state.vehiculos;
  el.contador.textContent =
    state.vista === "papelera"
      ? `${state.total} vehículo(s) en la papelera`
      : `${state.total} vehículo(s) en stock`;

  if (filas.length === 0) {
    el.tablaBody.innerHTML = "";
    el.tablaVacio.classList.remove("hidden");
    el.tablaVacio.textContent =
      state.vista === "papelera"
        ? "La papelera está vacía."
        : "No hay vehículos que coincidan con la búsqueda.";
    return;
  }

  el.tablaVacio.classList.add("hidden");
  el.tablaBody.innerHTML = filas
    .map(
      (v) => `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3">${miniatura(v)}</td>
        <td class="px-4 py-3">
          <div class="font-medium text-slate-900">
            ${v.destacado ? '<span title="Destacado" class="text-amber-500">★</span> ' : ""}${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}
          </div>
          ${v.notas ? `<div class="text-xs text-slate-400 mt-0.5 max-w-xs truncate" title="${escapeHtml(v.notas)}">${escapeHtml(v.notas)}</div>` : ""}
        </td>
        <td class="px-4 py-3 font-mono text-slate-600">${escapeHtml(v.dominio)}</td>
        <td class="px-4 py-3">${v.anio}</td>
        <td class="px-4 py-3">${formatoKilometraje(v.kilometraje)}</td>
        <td class="px-4 py-3 font-medium">${formatoMoneda(v.precio, v.moneda)}</td>
        <td class="px-4 py-3">${badgeEstado(v.estado)}</td>
        <td class="px-4 py-3 text-right">${state.vista === "papelera" ? accionesPapelera(v) : accionesRapidas(v)}</td>
      </tr>`
    )
    .join("");
}

// ---------- Galería de imágenes del formulario ----------

function renderGaleria() {
  if (state.formImagenes.length === 0) {
    el.galeriaImagenes.innerHTML = "";
    el.imagenesEstado.textContent = "Todavía no agregaste fotos.";
    return;
  }
  el.imagenesEstado.textContent = `${state.formImagenes.length} foto(s) cargada(s).`;
  el.galeriaImagenes.innerHTML = state.formImagenes
    .map(
      (url, i) => `
      <div class="relative w-16 h-16">
        <img src="${escapeHtml(url)}" class="w-16 h-16 rounded-lg object-cover border border-slate-200" onerror="this.style.opacity=0.3" />
        <button type="button" data-quitar-imagen="${i}" class="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center shadow">×</button>
      </div>`
    )
    .join("");
}

el.galeriaImagenes.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-quitar-imagen]");
  if (!boton) return;
  const indice = Number(boton.dataset.quitarImagen);
  state.formImagenes.splice(indice, 1);
  renderGaleria();
});

el.fImagenUrl.addEventListener("keydown", (evento) => {
  if (evento.key !== "Enter") return;
  evento.preventDefault();
  const url = el.fImagenUrl.value.trim();
  if (!url) return;
  state.formImagenes.push(url);
  el.fImagenUrl.value = "";
  renderGaleria();
});

el.fImagenArchivo.addEventListener("change", async () => {
  const archivos = Array.from(el.fImagenArchivo.files || []);
  if (archivos.length === 0) return;

  el.imagenesEstado.textContent = "Subiendo fotos...";
  try {
    const formData = new FormData();
    archivos.forEach((archivo) => formData.append("imagenes", archivo));

    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    if (res.status === 401) {
      window.location.href = "/login.html";
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudieron subir las fotos");

    state.formImagenes.push(...data.urls);
    renderGaleria();
    mostrarAlerta(`${data.urls.length} foto(s) subida(s).`, "ok");
  } catch (err) {
    mostrarAlerta(err.message);
    renderGaleria();
  } finally {
    el.fImagenArchivo.value = "";
  }
});

// ---------- Modal de alta / edición ----------

function abrirModal(vehiculo = null) {
  el.form.reset();
  state.formImagenes = vehiculo ? [...(vehiculo.imagenes_url || [])] : [];
  renderGaleria();

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
    el.fNotas.value = vehiculo.notas || "";
    el.fVersion.value = vehiculo.version || "";
    el.fCarroceria.value = vehiculo.carroceria || "";
    el.fCombustible.value = vehiculo.combustible || "";
    el.fTransmision.value = vehiculo.transmision || "";
    el.fTraccion.value = vehiculo.traccion || "";
    el.fPuertas.value = vehiculo.puertas ?? "";
    el.fColor.value = vehiculo.color || "";
    el.fMotor.value = vehiculo.motor || "";
    el.fPotencia.value = vehiculo.potencia || "";
    el.fDestacado.checked = !!vehiculo.destacado;
    el.fEquipamiento.value = (vehiculo.equipamiento || []).join(", ");
  } else {
    el.modalTitulo.textContent = "Nuevo vehículo";
    el.fId.value = "";
    el.fEstado.value = "Disponible";
    el.fMoneda.value = "ARS";
    el.fKilometraje.value = 0;
    el.fDestacado.checked = false;
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
    imagenes_url: state.formImagenes,
    notas: el.fNotas.value.trim(),
    version: el.fVersion.value.trim(),
    carroceria: el.fCarroceria.value,
    combustible: el.fCombustible.value,
    transmision: el.fTransmision.value,
    traccion: el.fTraccion.value,
    puertas: el.fPuertas.value === "" ? "" : Number(el.fPuertas.value),
    color: el.fColor.value.trim(),
    motor: el.fMotor.value.trim(),
    potencia: el.fPotencia.value.trim(),
    destacado: el.fDestacado.checked,
    equipamiento: el.fEquipamiento.value,
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
    await Promise.all([cargarVehiculos(), cargarResumen()]);
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
    await Promise.all([cargarVehiculos(), cargarResumen()]);
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function eliminarVehiculo(id) {
  const vehiculo = state.vehiculos.find((v) => v.id === Number(id));
  const nombre = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.dominio})` : "este vehículo";
  if (!window.confirm(`¿Enviar ${nombre} a la papelera? Podés restaurarlo después.`)) {
    return;
  }
  try {
    await apiRequest(`${API_BASE}/${id}`, { method: "DELETE" });
    mostrarAlerta("Vehículo enviado a la papelera.", "ok");
    await Promise.all([cargarVehiculos(), cargarResumen()]);
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function restaurarVehiculo(id) {
  try {
    await apiRequest(`${API_BASE}/${id}/restaurar`, { method: "PATCH" });
    mostrarAlerta("Vehículo restaurado.", "ok");
    await Promise.all([cargarVehiculos(), cargarResumen()]);
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function eliminarPermanente(id) {
  const vehiculo = state.vehiculos.find((v) => v.id === Number(id));
  const nombre = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.dominio})` : "este vehículo";
  if (!window.confirm(`¿Eliminar definitivamente ${nombre}? Esta acción no se puede deshacer.`)) {
    return;
  }
  try {
    await apiRequest(`${API_BASE}/${id}/permanente`, { method: "DELETE" });
    mostrarAlerta("Vehículo eliminado definitivamente.", "ok");
    await cargarVehiculos();
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function verHistorial(id) {
  const vehiculo = state.vehiculos.find((v) => v.id === Number(id));
  try {
    const historial = await apiRequest(`${API_BASE}/${id}/historial`);
    el.historialTitulo.textContent = vehiculo
      ? `Historial — ${vehiculo.marca} ${vehiculo.modelo}`
      : "Historial de estados";

    if (historial.length === 0) {
      el.historialLista.innerHTML = `<p class="text-slate-400">Sin movimientos registrados.</p>`;
    } else {
      el.historialLista.innerHTML = historial
        .map(
          (h) => `
          <div class="border-l-2 border-indigo-200 pl-3">
            <p class="font-medium text-slate-800">
              ${h.estado_anterior ? `${escapeHtml(h.estado_anterior)} → ` : "Alta: "}${escapeHtml(h.estado_nuevo)}
            </p>
            <p class="text-xs text-slate-400">${formatoFecha(h.creado_at)} · ${escapeHtml(h.username || "sistema")}</p>
          </div>`
        )
        .join("");
    }

    el.modalHistorialOverlay.classList.remove("hidden");
    el.modalHistorial.classList.remove("hidden");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

function cerrarHistorial() {
  el.modalHistorialOverlay.classList.add("hidden");
  el.modalHistorial.classList.add("hidden");
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
  } else if (accion === "historial") {
    verHistorial(id);
  } else if (accion === "restaurar") {
    restaurarVehiculo(id);
  } else if (accion === "eliminar-permanente") {
    eliminarPermanente(id);
  }
}

// ---------- Filtros y vista de papelera ----------

function debounce(fn, espera = 300) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), espera);
  };
}

const buscarConDebounce = debounce(() => {
  state.filtros.q = el.filtroQ.value.trim();
  state.pagina = 1;
  actualizarUrlExportar();
  cargarVehiculos();
}, 300);

el.filtroQ.addEventListener("input", buscarConDebounce);
el.filtroEstado.addEventListener("change", () => {
  state.filtros.estado = el.filtroEstado.value;
  state.pagina = 1;
  actualizarUrlExportar();
  cargarVehiculos();
});
el.filtroKm.addEventListener("change", () => {
  state.filtros.km = el.filtroKm.value;
  state.pagina = 1;
  actualizarUrlExportar();
  cargarVehiculos();
});
el.btnLimpiarFiltros.addEventListener("click", () => {
  state.filtros = { q: "", estado: "", km: "" };
  state.pagina = 1;
  el.filtroQ.value = "";
  el.filtroEstado.value = "";
  el.filtroKm.value = "";
  actualizarUrlExportar();
  cargarVehiculos();
});

el.btnPapelera.addEventListener("click", () => {
  state.vista = state.vista === "papelera" ? "activos" : "papelera";
  state.pagina = 1;
  el.btnPapelera.textContent = state.vista === "papelera" ? "Volver al stock" : "Ver papelera";
  el.btnNuevo.classList.toggle("hidden", state.vista === "papelera" || !esAdmin());
  cargarVehiculos();
});

el.btnNuevo.addEventListener("click", () => abrirModal());
el.btnCerrarModal.addEventListener("click", cerrarModal);
el.btnCancelar.addEventListener("click", cerrarModal);
el.modalOverlay.addEventListener("click", cerrarModal);
el.form.addEventListener("submit", manejarSubmit);
el.tablaBody.addEventListener("click", manejarClickTabla);
el.btnCerrarHistorial.addEventListener("click", cerrarHistorial);
el.modalHistorialOverlay.addEventListener("click", cerrarHistorial);

document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape") return;
  if (!el.modal.classList.contains("hidden")) cerrarModal();
  if (!el.modalHistorial.classList.contains("hidden")) cerrarHistorial();
  if (!el.modalPassword.classList.contains("hidden")) cerrarModalPassword();
  if (!el.modalUsuarios.classList.contains("hidden")) cerrarModalUsuarios();
  if (!el.modalImportar.classList.contains("hidden")) cerrarModalImportar();
  if (!el.modalConfig.classList.contains("hidden")) cerrarModalConfig();
});

(async function iniciar() {
  await cargarUsuario();
  await Promise.all([cargarResumen(), cargarVehiculos()]);
})();
