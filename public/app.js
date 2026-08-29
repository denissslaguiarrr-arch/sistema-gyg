const API_BASE = "/api/vehiculos";

// Opcional: Client-ID de Imgur. Imgur ya no registra apps nuevas; si no tenés
// uno, el panel guarda la foto local y podés pegar un link https para el sitio.
const IMGUR_CLIENT_ID = "TU_IMGUR_CLIENT_ID";

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
  gestionId: null,
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
  btnPublicarAviso: document.getElementById("btn-publicar-aviso"),
  avisoWebVieja: document.getElementById("aviso-web-vieja"),
  avisoWebTexto: document.getElementById("aviso-web-vieja-texto"),
  avisoWebUltima: document.getElementById("aviso-web-ultima"),
  alertasPapeles: document.getElementById("alertas-papeles"),
  alertasPapelesLista: document.getElementById("alertas-papeles-lista"),
  btnTraer: document.getElementById("btn-traer"),

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
  fPrecioOferta: document.getElementById("f-precio-oferta"),
  fMoneda: document.getElementById("f-moneda"),
  fOrigen: document.getElementById("f-origen"),
  fPrecioCompra: document.getElementById("f-precio-compra"),
  fFechaIngreso: document.getElementById("f-fecha-ingreso"),
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
  fMostrarPrecio: document.getElementById("f-mostrar-precio"),
  fEquipamiento: document.getElementById("f-equipamiento"),
  galeriaImagenes: document.getElementById("galeria-imagenes"),
  dropzoneImagenes: document.getElementById("dropzone-imagenes"),
  dropzoneEstado: document.getElementById("dropzone-estado"),
  fImagenArchivo: document.getElementById("f-imagen-archivo"),
  fImagenUrl: document.getElementById("f-imagen-url"),
  fEsVideo: document.getElementById("f-es-video"),
  btnAgregarUrl: document.getElementById("btn-agregar-url"),
  imagenesEstado: document.getElementById("imagenes-estado"),

  modalHistorialOverlay: document.getElementById("modal-historial-overlay"),
  modalHistorial: document.getElementById("modal-historial"),
  historialTitulo: document.getElementById("historial-titulo"),
  historialLista: document.getElementById("historial-lista"),
  btnCerrarHistorial: document.getElementById("btn-cerrar-historial"),

  modalGestionOverlay: document.getElementById("modal-gestion-overlay"),
  modalGestion: document.getElementById("modal-gestion"),
  gestionTitulo: document.getElementById("gestion-titulo"),
  gestionSubtitulo: document.getElementById("gestion-subtitulo"),
  gestionCuerpo: document.getElementById("gestion-cuerpo"),
  btnCerrarGestion: document.getElementById("btn-cerrar-gestion"),

  modalVentaOverlay: document.getElementById("modal-venta-overlay"),
  modalVenta: document.getElementById("modal-venta"),
  formVenta: document.getElementById("form-venta"),
  ventaVehiculo: document.getElementById("venta-vehiculo"),
  vId: document.getElementById("v-id"),
  vCliente: document.getElementById("v-cliente"),
  vTelefono: document.getElementById("v-telefono"),
  vPrecio: document.getElementById("v-precio"),
  vFecha: document.getElementById("v-fecha"),
  vGarantia: document.getElementById("v-garantia"),
  btnCerrarVenta: document.getElementById("btn-cerrar-venta"),
  btnCancelarVenta: document.getElementById("btn-cancelar-venta"),

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
  cInstagram: document.getElementById("c-instagram"),
  cFacebook: document.getElementById("c-facebook"),
  cContactoTitulo: document.getElementById("c-contacto-titulo"),
  cContactoTexto: document.getElementById("c-contacto-texto"),
  cDireccion: document.getElementById("c-direccion"),
  cFooter: document.getElementById("c-footer"),
  cHero: document.getElementById("c-hero"),
  cHeroArchivo: document.getElementById("c-hero-archivo"),
  cHeroPreview: document.getElementById("c-hero-preview"),
  btnHeroSubir: document.getElementById("btn-hero-subir"),
  cHeroEstado: document.getElementById("c-hero-estado"),
  cImgbb: document.getElementById("c-imgbb"),
  cImgbbEstado: document.getElementById("c-imgbb-estado"),
  cGist: document.getElementById("c-gist"),
  cGistEstado: document.getElementById("c-gist-estado"),
  cGithubToken: document.getElementById("c-github-token"),
  cGithubTokenEstado: document.getElementById("c-github-token-estado"),
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

function tienePrecioOferta(v) {
  return (
    v.precio_oferta != null &&
    Number.isFinite(Number(v.precio_oferta)) &&
    Number(v.precio_oferta) < Number(v.precio)
  );
}

function htmlPrecio(v) {
  let inner;
  if (!tienePrecioOferta(v)) {
    inner = `<span class="font-medium">${formatoMoneda(v.precio, v.moneda)}</span>`;
  } else {
    inner = `<div>
      <div class="text-xs text-slate-400 line-through">${formatoMoneda(v.precio, v.moneda)}</div>
      <div class="font-medium text-emerald-700">${formatoMoneda(v.precio_oferta, v.moneda)}</div>
    </div>`;
  }
  if (v.mostrar_precio) return inner;
  return `<div>${inner}<div class="text-[11px] text-slate-400">Oculto en la web</div></div>`;
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

function hoyIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function masMeses(iso, meses) {
  const partes = String(iso || "").split("-").map(Number);
  if (partes.length < 3 || partes.some((n) => !Number.isFinite(n))) return "";
  const dt = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
  dt.setUTCMonth(dt.getUTCMonth() + meses);
  return dt.toISOString().slice(0, 10);
}

function fechaVencida(iso) {
  if (!iso) return false;
  return String(iso).slice(0, 10) < hoyIso();
}

function badgeDias(dias) {
  if (dias == null || !Number.isFinite(Number(dias))) {
    return `<span class="text-xs text-slate-400">—</span>`;
  }
  const n = Number(dias);
  const clase =
    n > 60
      ? "bg-red-100 text-red-700 ring-red-600/20"
      : n > 30
        ? "bg-amber-100 text-amber-800 ring-amber-600/20"
        : "bg-slate-100 text-slate-600 ring-slate-400/30";
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${clase}">${n} días</span>`;
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

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  // Solo el panel (cookie vencida) manda al login. Un 401 de GitHub/ImgBB
  // no es la sesión: hay que mostrar el error y dejar seguir trabajando.
  if (res.status === 401 && (path.startsWith("/api/auth") || (data && data.error === "No autenticado"))) {
    window.location.href = "/login.html";
    throw new Error("Sesión expirada");
  }

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
    if (el.btnPublicarAviso) el.btnPublicarAviso.classList.toggle("hidden", !admin);
    if (el.btnTraer) el.btnTraer.classList.toggle("hidden", !admin);
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
    el.cInstagram.value = config.instagram || "";
    el.cFacebook.value = config.facebook || "";
    el.cContactoTitulo.value = config.contactoTitulo || "Contactanos";
    el.cContactoTexto.value = config.contactoTexto || "";
    if (el.cDireccion) el.cDireccion.value = config.direccion || "";
    el.cFooter.value = config.footerText || "";
    el.cHero.value = config.heroImage || "";
    actualizarPreviewHero();
    if (el.cImgbb) el.cImgbb.value = "";
    if (el.cImgbbEstado) {
      el.cImgbbEstado.textContent = config.imgbbConfigurado
        ? "Clave ImgBB cargada. Dejá el campo vacío para no cambiarla, o pegá otra para reemplazarla."
        : "Imgur ya no da API. Creá una clave gratis en api.imgbb.com y pegala acá para que el arrastre publique las fotos.";
    }
    if (el.cGist) el.cGist.value = config.gistId || "";
    if (el.cGistEstado) {
      el.cGistEstado.textContent = config.gistIdEnEnv
        ? "Este ID viene del archivo .env (GYG_GIST_ID). El valor del panel no lo pisa."
        : "Ya viene el Gist de G&G. Solo cambialo si usás otro.";
    }
    if (el.cGithubToken) el.cGithubToken.value = "";
    if (el.cGithubTokenEstado) {
      el.cGithubTokenEstado.textContent = config.githubTokenConfigurado
        ? "Token cargado. Dejá el campo vacío para no cambiarlo, o pegá otro para reemplazarlo. Tiene que ser de la misma cuenta de GitHub que creó el Gist."
        : "Creá un token classic en github.com/settings/tokens (tilde en gist) con la MISMA cuenta que creó el Gist y pegalo acá. Sin esto no se puede publicar.";
    }
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
        instagram: el.cInstagram.value.trim(),
        facebook: el.cFacebook.value.trim(),
        contactoTitulo: el.cContactoTitulo.value.trim() || "Contactanos",
        contactoTexto: el.cContactoTexto.value.trim(),
        direccion: el.cDireccion ? el.cDireccion.value.trim() : "",
        footerText: el.cFooter.value.trim(),
        heroImage: el.cHero.value.trim(),
        imgbbApiKey: el.cImgbb && el.cImgbb.value.trim() ? el.cImgbb.value.trim() : undefined,
        gistId: el.cGist ? el.cGist.value.trim() : undefined,
        githubToken: el.cGithubToken && el.cGithubToken.value.trim() ? el.cGithubToken.value.trim() : undefined,
      }),
    });
    mostrarAlerta("Configuración del sitio guardada. Para verla en Blogger, dale a Publicar en la web.", "ok");
    cerrarModalConfig();
    await refrescarAvisoWeb();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

function actualizarPreviewHero() {
  if (!el.cHeroPreview) return;
  const url = el.cHero && el.cHero.value.trim();
  if (!url) {
    el.cHeroPreview.removeAttribute("src");
    el.cHeroPreview.classList.add("hidden");
    return;
  }
  el.cHeroPreview.src = url;
  el.cHeroPreview.classList.remove("hidden");
}

if (el.cHero) {
  el.cHero.addEventListener("input", actualizarPreviewHero);
}

if (el.btnHeroSubir && el.cHeroArchivo) {
  el.btnHeroSubir.addEventListener("click", () => el.cHeroArchivo.click());
  el.cHeroArchivo.addEventListener("change", async () => {
    const archivo = el.cHeroArchivo.files && el.cHeroArchivo.files[0];
    el.cHeroArchivo.value = "";
    if (!archivo) return;
    if (el.cHeroEstado) el.cHeroEstado.textContent = "Subiendo foto...";
    try {
      const url = await subirArchivoPublico(archivo);
      el.cHero.value = url;
      actualizarPreviewHero();
      if (el.cHeroEstado) {
        el.cHeroEstado.textContent = "Foto lista. Guardá la configuración y después dale a Publicar en la web.";
      }
      mostrarAlerta("Foto de portada subida. Guardá y publicá para verla en el sitio.", "ok");
    } catch (err) {
      if (el.cHeroEstado) el.cHeroEstado.textContent = err.message;
      mostrarAlerta(err.message);
    }
  });
}

// ---------- Publicar en la web (solo admin) ----------

function formatearFechaCorta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function formatearFechaDia(iso) {
  const texto = String(iso || "").slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : texto;
}

async function publicarEnLaWeb({ confirmar = true, avisar = true } = {}) {
  if (!esAdmin()) return { ok: false, omitido: true };
  if (
    confirmar &&
    !window.confirm(
      "¿Publicar el stock actual en el sitio web? Esto actualiza el catálogo que ven tus clientes."
    )
  ) {
    return { ok: false, cancelado: true };
  }

  if (el.btnPublicar) {
    el.btnPublicar.disabled = true;
    el.btnPublicar.textContent = "Publicando...";
  }
  if (el.btnPublicarAviso) el.btnPublicarAviso.disabled = true;

  try {
    const resultado = await apiRequest("/api/sync/publicar", { method: "POST" });
    const omitidas = resultado.fotosLocalesOmitidas || 0;
    if (avisar) {
      mostrarAlerta(
        omitidas
          ? `Se publicaron ${resultado.vehiculosPublicados} vehículo(s). ${omitidas} foto(s) subida(s) desde la PC no se ven en el sitio: pegá un link https:// y volvé a publicar.`
          : `Se publicaron ${resultado.vehiculosPublicados} vehículo(s) en el sitio web.`,
        omitidas ? "error" : "ok"
      );
    }
    await refrescarAvisoWeb();
    return { ok: true, resultado, omitidas };
  } catch (err) {
    if (avisar) mostrarAlerta(err.message);
    await refrescarAvisoWeb();
    return { ok: false, error: err };
  } finally {
    if (el.btnPublicar) {
      el.btnPublicar.disabled = false;
      el.btnPublicar.textContent = "Publicar en la web";
    }
    if (el.btnPublicarAviso) el.btnPublicarAviso.disabled = false;
  }
}

async function despuesDeCambioPublico(mensajeOk) {
  if (esAdmin()) {
    const pub = await publicarEnLaWeb({ confirmar: false, avisar: false });
    if (pub.ok) {
      const omitidas = pub.omitidas || 0;
      mostrarAlerta(
        omitidas
          ? `${mensajeOk} El sitio se actualizó, pero ${omitidas} foto(s) local(es) no se ven en la web.`
          : `${mensajeOk} El sitio ya está actualizado.`,
        omitidas ? "error" : "ok"
      );
    } else {
      mostrarAlerta(
        `${mensajeOk} El sitio no se actualizó. Tocá Publicar en la web.`,
        "error"
      );
    }
  } else {
    mostrarAlerta(`${mensajeOk} El sitio no se actualizó: pedile al admin que publique.`, "ok");
    await refrescarAvisoWeb();
  }
}

async function refrescarAvisoWeb() {
  if (!el.avisoWebVieja) return;
  try {
    const resumen = await apiRequest(`${API_BASE}/resumen`);
    const sucio = !!resumen.stock_sucio;
    el.avisoWebVieja.classList.toggle("hidden", !sucio);
    if (el.avisoWebTexto) {
      el.avisoWebTexto.textContent = esAdmin()
        ? "El sitio web tiene stock viejo. Publicá para que los clientes vean lo mismo que el panel."
        : "El sitio web tiene stock viejo. Pedile al admin que publique.";
    }
    if (el.avisoWebUltima) {
      el.avisoWebUltima.textContent = resumen.last_sync_at
        ? `Última publicación: ${formatearFechaCorta(resumen.last_sync_at)}`
        : "Todavía no se publicó desde este panel.";
    }
    if (el.btnPublicarAviso) el.btnPublicarAviso.classList.toggle("hidden", !sucio || !esAdmin());
  } catch (_err) {
    // El aviso queda como estaba.
  }
}

async function cargarAlertasPapeles() {
  if (!el.alertasPapeles || !el.alertasPapelesLista) return;
  try {
    const data = await apiRequest(`${API_BASE}/alertas-papeles`);
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      el.alertasPapeles.classList.add("hidden");
      el.alertasPapelesLista.innerHTML = "";
      return;
    }
    el.alertasPapeles.classList.remove("hidden");
    el.alertasPapelesLista.innerHTML = items
      .map((item) => {
        const tono = item.vencido ? "text-red-700" : "text-amber-800";
        const cuando = item.vencido
          ? `vencida el ${formatearFechaDia(item.fecha)}`
          : item.dias === 0
            ? "vence hoy"
            : `vence el ${formatearFechaDia(item.fecha)}`;
        return `<li class="py-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <button type="button" data-papel-id="${item.vehiculo_id}" class="text-sm font-medium text-slate-800 hover:underline">
              ${escapeHtml(item.marca)} ${escapeHtml(item.modelo)}
            </button>
            <p class="text-xs text-slate-500">${escapeHtml(item.dominio)} · ${escapeHtml(item.etiqueta)}</p>
          </div>
          <span class="text-xs font-medium ${tono}">${cuando}</span>
        </li>`;
      })
      .join("");
  } catch (_err) {
    el.alertasPapeles.classList.add("hidden");
  }
}

el.btnPublicar.addEventListener("click", () => publicarEnLaWeb({ confirmar: true, avisar: true }));
if (el.btnPublicarAviso) {
  el.btnPublicarAviso.addEventListener("click", () => publicarEnLaWeb({ confirmar: true, avisar: true }));
}
if (el.alertasPapelesLista) {
  el.alertasPapelesLista.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-papel-id]");
    if (boton) abrirGestion(boton.dataset.papelId);
  });
}

// ---------- Traer stock publicado en el Gist (solo admin) ----------

if (el.btnTraer) {
  el.btnTraer.addEventListener("click", async () => {
    if (
      !window.confirm(
        "¿Traer el stock publicado en la web a este panel? Si un auto ya existe (misma patente), se actualiza. Los que no estén, se crean."
      )
    ) {
      return;
    }

    el.btnTraer.disabled = true;
    const textoOriginal = el.btnTraer.textContent;
    el.btnTraer.textContent = "Trayendo...";

    try {
      const resultado = await apiRequest("/api/sync/traer", { method: "POST" });
      const avisos = Array.isArray(resultado.avisos) ? resultado.avisos.length : 0;
      const errores = Array.isArray(resultado.errores) ? resultado.errores.length : 0;
      mostrarAlerta(
        `Listo: ${resultado.creados} creado(s), ${resultado.actualizados} actualizado(s)` +
          (avisos ? `, ${avisos} aviso(s)` : "") +
          (errores ? `, ${errores} con error` : "") +
          ".",
        errores ? "error" : "ok"
      );
      await Promise.all([cargarVehiculos(), cargarResumen()]);
    } catch (err) {
      mostrarAlerta(err.message);
    } finally {
      el.btnTraer.disabled = false;
      el.btnTraer.textContent = textoOriginal;
    }
  });
}

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

    const avisos = Array.isArray(data.avisos) ? data.avisos : [];
    const resumen = `<p class="font-medium text-slate-800">${data.creados} creado(s), ${data.actualizados} actualizado(s), ${data.errores.length} con error.</p>`;
    const detalleAvisos = avisos.length
      ? `<ul class="list-disc pl-5 text-amber-700 space-y-1">${avisos
          .map((a) => `<li>Fila ${a.fila} (${escapeHtml(a.dominio)}): ${escapeHtml(a.mensaje)}</li>`)
          .join("")}</ul>`
      : "";
    const detalleErrores = data.errores.length
      ? `<ul class="list-disc pl-5 text-red-600 space-y-1">${data.errores
          .map((e) => `<li>Fila ${e.fila} (${escapeHtml(e.dominio)}): ${escapeHtml(e.error)}</li>`)
          .join("")}</ul>`
      : "";

    el.importarResultado.innerHTML = resumen + detalleAvisos + detalleErrores;
    el.importarResultado.classList.remove("hidden");

    mostrarAlerta(
      `Importación completa: ${data.creados} creado(s), ${data.actualizados} actualizado(s).`,
      "ok"
    );
    await Promise.all([cargarVehiculos(), cargarResumen(), refrescarAvisoWeb(), cargarAlertasPapeles()]);
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

  botones.unshift(
    `<button data-accion="gestion" data-id="${vehiculo.id}" class="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline">Gestión</button>`
  );

  if (vehiculo.estado !== "Reservado") {
    botones.push(
      `<button data-accion="estado" data-id="${vehiculo.id}" data-estado="Reservado" class="text-xs font-medium text-yellow-700 hover:text-yellow-900 hover:underline">Reservar</button>`
    );
  }
  if (vehiculo.estado !== "Vendido") {
    botones.push(
      `<button data-accion="venta" data-id="${vehiculo.id}" class="text-xs font-medium text-orange-700 hover:text-orange-900 hover:underline">Vender</button>`
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
  const media = window.GygMedia || {};
  const primera = media.portadaDe ? media.portadaDe(vehiculo.imagenes_url || []) : (vehiculo.imagenes_url || [])[0];
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
          <button data-accion="gestion" data-id="${v.id}" class="text-left">
            <div class="font-medium text-slate-900 hover:text-indigo-700">
              ${v.destacado ? '<span title="Destacado" class="text-amber-500">★</span> ' : ""}${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}
            </div>
          </button>
          ${v.notas ? `<div class="text-xs text-slate-400 mt-0.5 max-w-xs truncate" title="${escapeHtml(v.notas)}">${escapeHtml(v.notas)}</div>` : ""}
        </td>
        <td class="px-4 py-3 font-mono text-slate-600">${escapeHtml(v.dominio)}</td>
        <td class="px-4 py-3">${v.anio}</td>
        <td class="px-4 py-3">${formatoKilometraje(v.kilometraje)}</td>
        <td class="px-4 py-3">${htmlPrecio(v)}</td>
        <td class="px-4 py-3">${badgeDias(v.dias_en_stock)}</td>
        <td class="px-4 py-3">${badgeEstado(v.estado)}</td>
        <td class="px-4 py-3 text-right">${state.vista === "papelera" ? accionesPapelera(v) : accionesRapidas(v)}</td>
      </tr>`
    )
    .join("");
}

// ---------- Galería de imágenes del formulario ----------

function esFotoLocal(url) {
  if (window.GygMedia && window.GygMedia.esFotoLocal) return window.GygMedia.esFotoLocal(url);
  const texto = String(url || "").trim();
  return texto.startsWith("/uploads/") || /localhost|127\.0\.0\.1/i.test(texto);
}

function esVideoMedia(url) {
  return !!(window.GygMedia && window.GygMedia.esVideo && window.GygMedia.esVideo(url));
}

function normalizarUrlFotoCliente(url) {
  if (window.GygMedia && window.GygMedia.normalizarUrlFoto) return window.GygMedia.normalizarUrlFoto(url);
  const texto = String(url || "").trim();
  const drive = texto.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || texto.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (/drive\.google\.com/i.test(texto) && drive) {
    return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w2000`;
  }
  return texto;
}

function previewMediaHtml(url) {
  const media = window.GygMedia || {};
  const thumb = media.miniaturaDe ? media.miniaturaDe(url) : url;
  if (esVideoMedia(url) && !thumb) {
    return `<div class="w-24 h-24 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xl border border-slate-200">▶</div>`;
  }
  if (esVideoMedia(url)) {
    return `<div class="relative w-24 h-24">
      <img src="${escapeHtml(thumb)}" class="w-24 h-24 rounded-lg object-cover border border-slate-200" onerror="this.style.opacity=0.3" />
      <span class="absolute inset-0 flex items-center justify-center text-white text-lg drop-shadow">▶</span>
    </div>`;
  }
  return `<img src="${escapeHtml(thumb || url)}" class="w-24 h-24 rounded-lg object-cover border border-slate-200" onerror="this.style.opacity=0.3" />`;
}

function renderGaleria() {
  if (state.formImagenes.length === 0) {
    el.galeriaImagenes.innerHTML = "";
    el.imagenesEstado.textContent = "Todavía no agregaste fotos ni videos.";
    return;
  }
  const locales = state.formImagenes.filter(esFotoLocal).length;
  const videos = state.formImagenes.filter(esVideoMedia).length;
  const partes = [`${state.formImagenes.length} archivo(s)`];
  if (videos) partes.push(`${videos} video(s)`);
  if (locales) partes.push(`${locales} solo se ve(n) en este panel; para Blogger pegá un link https://`);
  el.imagenesEstado.textContent = `${partes.join(". ")}. La estrella marca la portada.`;
  el.galeriaImagenes.innerHTML = state.formImagenes
    .map(
      (url, i) => `
      <div class="relative w-24">
        ${previewMediaHtml(url)}
        ${i === 0 ? '<span class="absolute top-0 left-0 bg-indigo-600 text-white text-[9px] font-semibold px-1 py-0.5 rounded-br-md rounded-tl-lg">Principal</span>' : ""}
        ${esFotoLocal(url) ? '<span class="absolute bottom-7 left-0 right-0 bg-amber-500/90 text-white text-[9px] leading-tight text-center px-0.5">solo panel</span>' : ""}
        ${esVideoMedia(url) && i !== 0 ? '<span class="absolute top-0 left-0 bg-slate-900/80 text-white text-[9px] font-semibold px-1 py-0.5 rounded-br-md rounded-tl-lg">Video</span>' : ""}
        <button type="button" data-quitar-imagen="${i}" class="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center shadow">×</button>
        <div class="flex justify-center gap-0.5 mt-1">
          <button type="button" data-mover-imagen="${i}" data-dir="-1" class="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-50" ${i === 0 ? "disabled" : ""}>←</button>
          <button type="button" data-principal-imagen="${i}" class="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 hover:bg-indigo-50 ${i === 0 ? "text-indigo-700 font-semibold" : "text-slate-600"}" title="Usar como principal">★</button>
          <button type="button" data-mover-imagen="${i}" data-dir="1" class="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-50" ${i === state.formImagenes.length - 1 ? "disabled" : ""}>→</button>
        </div>
      </div>`
    )
    .join("");
}

el.galeriaImagenes.addEventListener("click", (evento) => {
  const quitar = evento.target.closest("button[data-quitar-imagen]");
  if (quitar) {
    const indice = Number(quitar.dataset.quitarImagen);
    state.formImagenes.splice(indice, 1);
    renderGaleria();
    return;
  }
  const principal = evento.target.closest("button[data-principal-imagen]");
  if (principal) {
    const indice = Number(principal.dataset.principalImagen);
    if (indice > 0) {
      const [item] = state.formImagenes.splice(indice, 1);
      state.formImagenes.unshift(item);
      renderGaleria();
    }
    return;
  }
  const mover = evento.target.closest("button[data-mover-imagen]");
  if (!mover) return;
  const indice = Number(mover.dataset.moverImagen);
  const dir = Number(mover.dataset.dir);
  const destino = indice + dir;
  if (destino < 0 || destino >= state.formImagenes.length) return;
  const copia = state.formImagenes[indice];
  state.formImagenes[indice] = state.formImagenes[destino];
  state.formImagenes[destino] = copia;
  renderGaleria();
});

function agregarImagenUrl() {
  const crudo = el.fImagenUrl.value.trim();
  if (!crudo) return;
  const forzarVideo = !!(el.fEsVideo && el.fEsVideo.checked) || esVideoMedia(crudo);
  const url = forzarVideo
    ? (window.GygMedia && window.GygMedia.normalizarUrlVideo
        ? window.GygMedia.normalizarUrlVideo(crudo)
        : crudo)
    : normalizarUrlFotoCliente(crudo);
  if (!url) return;
  state.formImagenes.push(url);
  el.fImagenUrl.value = "";
  if (el.fEsVideo) el.fEsVideo.checked = false;
  renderGaleria();
}

el.fImagenUrl.addEventListener("keydown", (evento) => {
  if (evento.key !== "Enter") return;
  evento.preventDefault();
  evento.stopPropagation();
  agregarImagenUrl();
});

if (el.btnAgregarUrl) {
  el.btnAgregarUrl.addEventListener("click", agregarImagenUrl);
}

el.fImagenArchivo.addEventListener("change", async () => {
  const archivos = Array.from(el.fImagenArchivo.files || []);
  el.fImagenArchivo.value = "";
  if (archivos.length === 0) return;
  await subirArchivosAlCatalogo(archivos);
});

const DROPZONE_BASE =
  "rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/60 transition-colors cursor-pointer px-4 py-8 text-center";
const DROPZONE_ACTIVA =
  "rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-100 transition-colors cursor-pointer px-4 py-8 text-center";

function marcarDropzone(activa) {
  if (!el.dropzoneImagenes) return;
  el.dropzoneImagenes.className = activa ? DROPZONE_ACTIVA : DROPZONE_BASE;
}

async function subirArchivoPublico(archivo) {
  const formData = new FormData();
  const usarImgurDirecto = IMGUR_CLIENT_ID && IMGUR_CLIENT_ID !== "TU_IMGUR_CLIENT_ID";

  if (usarImgurDirecto) {
    formData.append("image", archivo);
    const res = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    const link = data && data.data && data.data.link;
    if (!res.ok || !link) {
      const detalle = (data.data && data.data.error) || "Imgur no pudo recibir la imagen";
      throw new Error(String(detalle));
    }
    return link;
  }

  formData.append("imagenes", archivo);
  const res = await fetch("/api/uploads/publico", { method: "POST", body: formData });
  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new Error("Sesión expirada");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron publicar las fotos");
  const urls = data.urls || (data.url ? [data.url] : []);
  if (!urls.length) throw new Error("No se recibió un link público");
  return urls[0];
}

function setDropzoneCargando(visible, texto = "Subiendo imagen...") {
  if (!el.dropzoneEstado) return;
  el.dropzoneEstado.textContent = texto;
  el.dropzoneEstado.classList.toggle("hidden", !visible);
}

async function subirArchivoLocal(archivo) {
  const formData = new FormData();
  formData.append("imagenes", archivo);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new Error("Sesión expirada");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo guardar la foto en el panel");
  const urls = data.urls || (data.url ? [data.url] : []);
  if (!urls.length) throw new Error("No se recibió la URL de la foto");
  return urls[0];
}

async function subirArchivosAlCatalogo(archivos) {
  const imagenes = archivos.filter((archivo) => archivo && archivo.type && archivo.type.startsWith("image/"));
  const videos = archivos.filter((archivo) => archivo && archivo.type && archivo.type.startsWith("video/"));
  if (imagenes.length === 0 && videos.length === 0) {
    mostrarAlerta("Soltá una foto (JPG, PNG, WEBP o GIF) o un video (MP4, WEBM o MOV).");
    return;
  }

  const total = imagenes.length + videos.length;
  setDropzoneCargando(true, total > 1 ? `Subiendo ${total} archivos...` : "Subiendo archivo...");
  el.imagenesEstado.textContent = "Subiendo...";

  let publicas = 0;
  let locales = 0;
  const errores = [];

  try {
    for (const archivo of imagenes) {
      try {
        const urlPublica = await subirArchivoPublico(archivo);
        state.formImagenes.push(urlPublica);
        publicas += 1;
      } catch (_imgurErr) {
        try {
          const urlLocal = await subirArchivoLocal(archivo);
          state.formImagenes.push(urlLocal);
          locales += 1;
        } catch (localErr) {
          errores.push(localErr.message || "No se pudo guardar la foto");
        }
      }
      renderGaleria();
    }

    for (const archivo of videos) {
      try {
        const urlLocal = await subirArchivoLocal(archivo);
        state.formImagenes.push(urlLocal);
        locales += 1;
      } catch (localErr) {
        errores.push(localErr.message || "No se pudo guardar el video");
      }
      renderGaleria();
    }

    if (publicas && !locales) {
      mostrarAlerta(
        publicas === 1 ? "Foto subida con URL pública para el sitio web." : `${publicas} fotos con URL pública.`,
        "ok"
      );
    } else if (locales) {
      mostrarAlerta(
        "Archivos guardados en este panel. Para el sitio: clave de ImgBB en Configuración, o pegá el link directo de la foto (en Imgur: clic derecho → copiar dirección de imagen).",
        "ok"
      );
    }
    if (errores.length) mostrarAlerta(errores[0]);
  } finally {
    setDropzoneCargando(false);
  }
}

if (el.dropzoneImagenes) {
  let dragDepth = 0;

  el.dropzoneImagenes.addEventListener("click", () => {
    if (el.fImagenArchivo) el.fImagenArchivo.click();
  });

  el.dropzoneImagenes.addEventListener("dragenter", (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    dragDepth += 1;
    marcarDropzone(true);
  });

  el.dropzoneImagenes.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    evento.dataTransfer.dropEffect = "copy";
    marcarDropzone(true);
  });

  el.dropzoneImagenes.addEventListener("dragleave", (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) marcarDropzone(false);
  });

  el.dropzoneImagenes.addEventListener("drop", async (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    dragDepth = 0;
    marcarDropzone(false);
    const archivos = Array.from(evento.dataTransfer.files || []);
    if (archivos.length === 0) return;
    await subirArchivosAlCatalogo(archivos);
  });
}

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
    if (el.fPrecioOferta) el.fPrecioOferta.value = vehiculo.precio_oferta ?? "";
    el.fMoneda.value = vehiculo.moneda;
    if (el.fOrigen) el.fOrigen.value = vehiculo.origen || "Compra";
    if (el.fPrecioCompra) el.fPrecioCompra.value = vehiculo.precio_compra ?? "";
    if (el.fFechaIngreso) el.fFechaIngreso.value = (vehiculo.fecha_ingreso || "").slice(0, 10);
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
    if (el.fMostrarPrecio) el.fMostrarPrecio.checked = !!vehiculo.mostrar_precio;
    el.fEquipamiento.value = (vehiculo.equipamiento || []).join(", ");
  } else {
    el.modalTitulo.textContent = "Nuevo vehículo";
    el.fId.value = "";
    el.fEstado.value = "Disponible";
    el.fMoneda.value = "ARS";
    el.fKilometraje.value = 0;
    el.fDestacado.checked = false;
    if (el.fMostrarPrecio) el.fMostrarPrecio.checked = false;
    if (el.fOrigen) el.fOrigen.value = "Compra";
    if (el.fPrecioCompra) el.fPrecioCompra.value = "";
    if (el.fFechaIngreso) el.fFechaIngreso.value = hoyIso();
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
    precio_oferta: el.fPrecioOferta && el.fPrecioOferta.value !== "" ? Number(el.fPrecioOferta.value) : null,
    moneda: el.fMoneda.value,
    origen: el.fOrigen ? el.fOrigen.value : "Compra",
    precio_compra: el.fPrecioCompra && el.fPrecioCompra.value !== "" ? Number(el.fPrecioCompra.value) : null,
    fecha_ingreso: el.fFechaIngreso && el.fFechaIngreso.value ? el.fFechaIngreso.value : hoyIso(),
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
    mostrar_precio: !!(el.fMostrarPrecio && el.fMostrarPrecio.checked),
    equipamiento: el.fEquipamiento.value,
  };
}

async function manejarSubmit(evento) {
  evento.preventDefault();
  const datos = leerFormulario();
  const id = el.fId.value;
  const existente = id ? state.vehiculos.find((item) => item.id === Number(id)) : null;
  const estadoAnterior = existente ? existente.estado : null;

  try {
    if (id) {
      await apiRequest(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(datos) });
    } else {
      await apiRequest(API_BASE, { method: "POST", body: JSON.stringify(datos) });
    }
    cerrarModal();
    await Promise.all([cargarVehiculos(), cargarResumen(), cargarAlertasPapeles()]);
    if (id && estadoAnterior && estadoAnterior !== datos.estado) {
      await despuesDeCambioPublico("Vehículo actualizado.");
    } else {
      mostrarAlerta(id ? "Vehículo actualizado correctamente." : "Vehículo creado correctamente.", "ok");
      await refrescarAvisoWeb();
    }
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
    await Promise.all([cargarVehiculos(), cargarResumen(), cargarAlertasPapeles()]);
    await despuesDeCambioPublico(`Estado actualizado a "${estado}".`);
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
    await Promise.all([cargarVehiculos(), cargarResumen(), cargarAlertasPapeles()]);
    await despuesDeCambioPublico("Vehículo enviado a la papelera.");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function restaurarVehiculo(id) {
  try {
    await apiRequest(`${API_BASE}/${id}/restaurar`, { method: "PATCH" });
    await Promise.all([cargarVehiculos(), cargarResumen(), cargarAlertasPapeles()]);
    await despuesDeCambioPublico("Vehículo restaurado.");
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

async function abrirGestion(id) {
  state.gestionId = Number(id);
  try {
    const data = await apiRequest(`${API_BASE}/${id}/gestion`);
    renderGestion(data);
    el.modalGestionOverlay.classList.remove("hidden");
    el.modalGestion.classList.remove("hidden");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

function cerrarGestion() {
  el.modalGestionOverlay.classList.add("hidden");
  el.modalGestion.classList.add("hidden");
  state.gestionId = null;
}

function renderGestion(data) {
  const v = data.vehiculo;
  const r = data.rentabilidad;
  const docs = data.documentacion || {};
  const venta = data.venta;
  el.gestionTitulo.textContent = `${v.marca} ${v.modelo}`;
  el.gestionSubtitulo.textContent = `${v.dominio} · ${v.anio} · ${v.origen || "Compra"}`;

  const margenClase = r.margen >= 0 ? "text-emerald-700" : "text-red-700";
  const alertaVtv = fechaVencida(docs.vtv_vencimiento)
    ? `<p class="text-xs font-medium text-red-600 mt-1">VTV vencida el ${escapeHtml(docs.vtv_vencimiento)}</p>`
    : "";
  const alertaPolicial = fechaVencida(docs.verificacion_policial_vto)
    ? `<p class="text-xs font-medium text-red-600 mt-1">Verificación policial vencida el ${escapeHtml(docs.verificacion_policial_vto)}</p>`
    : "";

  const gastosHtml =
    (data.gastos || []).length === 0
      ? `<p class="text-xs text-slate-400">Todavía no hay gastos cargados.</p>`
      : `<ul class="divide-y divide-slate-100">${data.gastos
          .map(
            (g) => `
        <li class="flex items-center justify-between gap-3 py-2">
          <div>
            <p class="font-medium text-slate-800">${escapeHtml(g.concepto)}</p>
            <p class="text-xs text-slate-400">${escapeHtml(g.fecha || "")}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-medium">${formatoMoneda(g.monto, v.moneda)}</span>
            ${
              esAdmin()
                ? `<button type="button" data-gestion="borrar-gasto" data-id="${g.id}" class="text-xs text-red-500 hover:underline">Quitar</button>`
                : ""
            }
          </div>
        </li>`
          )
          .join("")}</ul>`;

  el.gestionCuerpo.innerHTML = `
    <div class="flex flex-wrap items-center gap-2">
      ${badgeEstado(v.estado)}
      ${badgeDias(data.dias_en_stock)}
      ${esAdmin() ? `<button type="button" data-gestion="editar" class="text-xs font-medium text-indigo-600 hover:underline">Editar datos</button>` : ""}
      ${v.estado !== "Vendido" ? `<button type="button" data-gestion="vender" class="text-xs font-medium text-orange-700 hover:underline">Vender</button>` : ""}
    </div>
    <div class="grid sm:grid-cols-2 gap-3">
      <div class="rounded-xl border border-slate-200 p-4 bg-slate-50">
        <p class="text-xs uppercase tracking-wide text-slate-400 font-semibold">Rentabilidad</p>
        <dl class="mt-2 space-y-1">
          <div class="flex justify-between gap-2"><dt class="text-slate-500">Precio de venta estimado</dt><dd>${formatoMoneda(r.precio_venta_estimado, v.moneda)}</dd></div>
          <div class="flex justify-between gap-2"><dt class="text-slate-500">Precio de costo</dt><dd>${r.precio_compra == null ? '<span class="text-amber-700">Sin cargar</span>' : formatoMoneda(r.precio_compra, v.moneda)}</dd></div>
          <div class="flex justify-between gap-2"><dt class="text-slate-500">Gastos</dt><dd>${formatoMoneda(r.total_gastos, v.moneda)}</dd></div>
          <div class="flex justify-between gap-2 pt-1 border-t border-slate-200 font-semibold ${margenClase}"><dt>Margen</dt><dd>${formatoMoneda(r.margen, v.moneda)}</dd></div>
        </dl>
        ${r.costo_completo ? "" : `<p class="text-xs text-amber-700 mt-2">Cargá el precio de costo en Editar para ver el margen real.</p>`}
      </div>
      <div class="rounded-xl border border-slate-200 p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Papeles</p>
        <label class="flex items-center gap-2 py-1"><input type="checkbox" id="doc-08" ${docs.tiene_08 ? "checked" : ""} /> Formulario 08</label>
        <label class="flex items-center gap-2 py-1"><input type="checkbox" id="doc-titulo" ${docs.tiene_titulo ? "checked" : ""} /> Título</label>
        <label class="block text-xs text-slate-600 mt-2 mb-1">Vencimiento VTV</label>
        <input type="date" id="doc-vtv" value="${escapeHtml(docs.vtv_vencimiento || "")}" class="campo" />
        ${alertaVtv}
        <label class="block text-xs text-slate-600 mt-2 mb-1">Verificación policial</label>
        <input type="date" id="doc-policial" value="${escapeHtml(docs.verificacion_policial_vto || "")}" class="campo" />
        ${alertaPolicial}
        <button type="button" data-gestion="guardar-docs" class="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-white hover:bg-slate-900">Guardar papeles</button>
      </div>
    </div>
    <div class="rounded-xl border border-slate-200 p-4">
      <p class="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Gastos de reacondicionamiento</p>
      ${gastosHtml}
      ${
        esAdmin()
          ? `<form id="form-gasto" class="mt-3 grid sm:grid-cols-4 gap-2 items-end">
              <div class="sm:col-span-2">
                <label class="block text-xs text-slate-600 mb-1">Concepto</label>
                <input id="g-concepto" class="campo" placeholder="Cambio de correa, gestoría..." required />
              </div>
              <div>
                <label class="block text-xs text-slate-600 mb-1">Monto</label>
                <input id="g-monto" type="number" min="0" step="0.01" class="campo" required />
              </div>
              <div>
                <button type="submit" class="w-full px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700">Agregar</button>
              </div>
            </form>`
          : ""
      }
    </div>
    ${
      venta
        ? `<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p class="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Venta</p>
            <p class="mt-1">${escapeHtml(venta.cliente_nombre)} · ${escapeHtml(venta.cliente_telefono || "sin teléfono")}</p>
            <p class="text-slate-600">Cerrada a ${formatoMoneda(venta.precio_venta_final, v.moneda)} el ${escapeHtml(venta.fecha_venta || "")}</p>
            <p class="text-xs text-slate-500">Garantía hasta ${escapeHtml(venta.fin_garantia || "—")}</p>
          </div>`
        : ""
    }
  `;

  const formGasto = document.getElementById("form-gasto");
  if (formGasto) formGasto.addEventListener("submit", manejarAltaGasto);
}

async function manejarAltaGasto(evento) {
  evento.preventDefault();
  if (!state.gestionId) return;
  const concepto = document.getElementById("g-concepto").value.trim();
  const monto = Number(document.getElementById("g-monto").value);
  try {
    await apiRequest(`${API_BASE}/${state.gestionId}/gastos`, {
      method: "POST",
      body: JSON.stringify({ concepto, monto, fecha: hoyIso() }),
    });
    await abrirGestion(state.gestionId);
    mostrarAlerta("Gasto agregado.", "ok");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

async function guardarDocumentacion() {
  if (!state.gestionId) return;
  try {
    await apiRequest(`${API_BASE}/${state.gestionId}/documentacion`, {
      method: "PUT",
      body: JSON.stringify({
        tiene_08: document.getElementById("doc-08").checked,
        tiene_titulo: document.getElementById("doc-titulo").checked,
        vtv_vencimiento: document.getElementById("doc-vtv").value || null,
        verificacion_policial_vto: document.getElementById("doc-policial").value || null,
      }),
    });
    await abrirGestion(state.gestionId);
    await cargarAlertasPapeles();
    mostrarAlerta("Documentación actualizada.", "ok");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

function abrirVenta(id) {
  const vehiculo = state.vehiculos.find((item) => item.id === Number(id));
  el.formVenta.reset();
  el.vId.value = id;
  el.ventaVehiculo.textContent = vehiculo
    ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.dominio})`
    : "Vehículo";
  el.vPrecio.value = vehiculo ? vehiculo.precio_oferta ?? vehiculo.precio : "";
  el.vFecha.value = hoyIso();
  el.vGarantia.value = masMeses(el.vFecha.value, 3);
  el.modalVentaOverlay.classList.remove("hidden");
  el.modalVenta.classList.remove("hidden");
  el.vCliente.focus();
}

function cerrarVenta() {
  el.modalVentaOverlay.classList.add("hidden");
  el.modalVenta.classList.add("hidden");
}

async function manejarSubmitVenta(evento) {
  evento.preventDefault();
  const id = el.vId.value;
  try {
    await apiRequest(`${API_BASE}/${id}/venta`, {
      method: "POST",
      body: JSON.stringify({
        cliente_nombre: el.vCliente.value.trim(),
        cliente_telefono: el.vTelefono.value.trim(),
        precio_venta_final: Number(el.vPrecio.value),
        fecha_venta: el.vFecha.value || hoyIso(),
        fin_garantia: el.vGarantia.value || masMeses(el.vFecha.value || hoyIso(), 3),
      }),
    });
    cerrarVenta();
    if (state.gestionId) await abrirGestion(state.gestionId);
    await Promise.all([cargarVehiculos(), cargarResumen(), cargarAlertasPapeles()]);
    await despuesDeCambioPublico("Venta registrada. El vehículo pasó a Vendido.");
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

el.gestionCuerpo.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-gestion]");
  if (!boton) return;
  const accion = boton.dataset.gestion;
  if (accion === "editar") {
    const vehiculo = state.vehiculos.find((item) => item.id === state.gestionId);
    if (vehiculo) {
      cerrarGestion();
      abrirModal(vehiculo);
    }
  } else if (accion === "vender") {
    abrirVenta(state.gestionId);
  } else if (accion === "guardar-docs") {
    await guardarDocumentacion();
  } else if (accion === "borrar-gasto") {
    try {
      await apiRequest(`${API_BASE}/${state.gestionId}/gastos/${boton.dataset.id}`, { method: "DELETE" });
      await abrirGestion(state.gestionId);
    } catch (err) {
      mostrarAlerta(err.message);
    }
  }
});

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
  } else if (accion === "gestion") {
    abrirGestion(id);
  } else if (accion === "venta") {
    abrirVenta(id);
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
el.btnCerrarGestion.addEventListener("click", cerrarGestion);
el.modalGestionOverlay.addEventListener("click", cerrarGestion);
el.btnCerrarVenta.addEventListener("click", cerrarVenta);
el.btnCancelarVenta.addEventListener("click", cerrarVenta);
el.modalVentaOverlay.addEventListener("click", cerrarVenta);
el.formVenta.addEventListener("submit", manejarSubmitVenta);
el.vFecha.addEventListener("change", () => {
  el.vGarantia.value = masMeses(el.vFecha.value || hoyIso(), 3);
});

document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape") return;
  if (!el.modal.classList.contains("hidden")) cerrarModal();
  if (!el.modalHistorial.classList.contains("hidden")) cerrarHistorial();
  if (!el.modalGestion.classList.contains("hidden")) cerrarGestion();
  if (!el.modalVenta.classList.contains("hidden")) cerrarVenta();
  if (!el.modalPassword.classList.contains("hidden")) cerrarModalPassword();
  if (!el.modalUsuarios.classList.contains("hidden")) cerrarModalUsuarios();
  if (!el.modalImportar.classList.contains("hidden")) cerrarModalImportar();
  if (!el.modalConfig.classList.contains("hidden")) cerrarModalConfig();
});

(async function iniciar() {
  await cargarUsuario();
  await Promise.all([cargarResumen(), cargarVehiculos(), refrescarAvisoWeb(), cargarAlertasPapeles()]);
})();
