// Tasación orientativa: precio de revista + km por año + estado del auto.
// El número no es una oferta en firme; el encargado puede subir o bajar.

const ESTADOS_USO = ["Excelente", "Muy bueno", "Bueno", "Regular"];

const CONFIG_DEFAULT = {
  km_anio: 14000,
  umbral_fresco: 0.75,
  umbral_usado: 1.3,
  factor_fresco: 1.05,
  factor_promedio: 1,
  factor_usado: 0.88,
  factor_excelente: 1.04,
  factor_muy_bueno: 1,
  factor_bueno: 0.94,
  factor_regular: 0.82,
  margen_medio: 0.9,
  margen_rango: 0.06,
};

function normalizarTexto(texto) {
  return String(texto == null ? "" : texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function edicionActual(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseEdicion(valor, fallback = edicionActual()) {
  const texto = String(valor == null ? "" : valor).trim();
  if (/^\d{4}-\d{2}$/.test(texto)) return texto;
  if (/^\d{4}\/\d{2}$/.test(texto)) return texto.replace("/", "-");
  if (/^\d{2}-\d{4}$/.test(texto)) {
    const [mm, yyyy] = texto.split("-");
    return `${yyyy}-${mm}`;
  }
  return fallback;
}

function leerConfig(guardada) {
  const raw = guardada && typeof guardada === "object" ? guardada : {};
  const out = { ...CONFIG_DEFAULT };
  for (const clave of Object.keys(CONFIG_DEFAULT)) {
    if (raw[clave] === undefined || raw[clave] === null || raw[clave] === "") continue;
    const n = Number(raw[clave]);
    if (Number.isFinite(n) && n > 0) out[clave] = n;
  }
  if (out.umbral_fresco >= out.umbral_usado) {
    out.umbral_fresco = CONFIG_DEFAULT.umbral_fresco;
    out.umbral_usado = CONFIG_DEFAULT.umbral_usado;
  }
  if (out.margen_medio > 1.2) out.margen_medio = out.margen_medio / 100;
  if (out.margen_rango > 0.4) out.margen_rango = out.margen_rango / 100;
  return out;
}

function redondearPrecio(valor, moneda) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (moneda === "ARS") {
    const paso = n >= 1_000_000 ? 10_000 : 1_000;
    return Math.round(n / paso) * paso;
  }
  const paso = n >= 5_000 ? 100 : 50;
  return Math.round(n / paso) * paso;
}

function normalizarEstadoUso(valor) {
  const clave = normalizarTexto(valor);
  if (clave === "excelente") return "Excelente";
  if (clave === "muy bueno" || clave === "muybueno") return "Muy bueno";
  if (clave === "regular") return "Regular";
  return "Bueno";
}

function factorEstado(estado, config) {
  switch (normalizarEstadoUso(estado)) {
    case "Excelente":
      return config.factor_excelente;
    case "Muy bueno":
      return config.factor_muy_bueno;
    case "Regular":
      return config.factor_regular;
    default:
      return config.factor_bueno;
  }
}

function analizarUso({ anio, km, anioActual, config }) {
  const kilometraje = Number(km) || 0;
  const year = Number(anio);
  const actual = Number(anioActual);
  const esCeroKm = kilometraje === 0;

  if (esCeroKm) {
    return {
      banda: "cero",
      etiqueta: "0 km",
      km_anio: 0,
      km_esperado: 0,
      ratio: 0,
      factor: 1,
      anios_uso: Math.max(0, actual - year),
    };
  }

  const anios = Math.max(1, actual - year);
  const esperado = anios * config.km_anio;
  const ratio = esperado > 0 ? kilometraje / esperado : 1;
  const kmAnio = kilometraje / anios;

  let banda = "promedio";
  let etiqueta = "Uso promedio para el año";
  let factor = config.factor_promedio;
  if (ratio < config.umbral_fresco) {
    banda = "fresco";
    etiqueta = "Más fresco que el promedio (pocos km por año)";
    factor = config.factor_fresco;
  } else if (ratio > config.umbral_usado) {
    banda = "usado";
    etiqueta = "Más usado que el promedio (muchos km por año)";
    factor = config.factor_usado;
  }

  return {
    banda,
    etiqueta,
    km_anio: Math.round(kmAnio),
    km_esperado: esperado,
    ratio: Math.round(ratio * 100) / 100,
    factor,
    anios_uso: anios,
  };
}

function estimarPrecio({ precioRevista, moneda, anio, km, estado, anioActual, config }) {
  const cfg = leerConfig(config);
  const uso = analizarUso({ anio, km, anioActual, config: cfg });
  const fEstado = factorEstado(estado, cfg);
  const ajustado = Number(precioRevista) * uso.factor * fEstado;
  const medio = ajustado * cfg.margen_medio;
  const rango = cfg.margen_rango;
  return {
    uso,
    estado: normalizarEstadoUso(estado),
    factor_estado: fEstado,
    precio_revista: Number(precioRevista),
    precio_ajustado: redondearPrecio(ajustado, moneda),
    decirle: redondearPrecio(medio, moneda),
    rango_min: redondearPrecio(medio * (1 - rango), moneda),
    rango_max: redondearPrecio(medio * (1 + rango), moneda),
    moneda,
    margen_medio: cfg.margen_medio,
  };
}

function puntuarFila(fila, consulta) {
  if (normalizarTexto(fila.marca) !== normalizarTexto(consulta.marca)) return 0;
  if (Number(fila.anio) !== Number(consulta.anio)) return 0;

  const modeloGuia = normalizarTexto(fila.modelo);
  const modeloIn = normalizarTexto(consulta.modelo);
  const versionGuia = normalizarTexto(fila.version);
  const versionIn = normalizarTexto(consulta.version);
  const compuestoGuia = `${modeloGuia} ${versionGuia}`.trim();

  if (!modeloGuia || !modeloIn) return 0;

  let puntos = 10;
  if (modeloGuia === modeloIn) puntos += 50;
  else if (modeloIn.startsWith(`${modeloGuia} `) || modeloGuia.startsWith(`${modeloIn} `)) puntos += 35;
  else if (compuestoGuia === modeloIn || modeloIn === compuestoGuia) puntos += 40;
  else if (modeloIn.includes(modeloGuia) || modeloGuia.includes(modeloIn)) puntos += 20;
  else return 0;

  if (versionIn && versionGuia === versionIn) puntos += 25;
  else if (versionIn && (versionGuia.includes(versionIn) || versionIn.includes(versionGuia))) puntos += 12;
  else if (!versionIn && versionGuia && modeloIn.includes(versionGuia)) puntos += 18;
  else if (!versionIn && versionGuia) {
    const primera = versionGuia.split(" ")[0];
    if (primera && modeloIn.includes(primera)) puntos += 16;
  }

  return puntos;
}

function buscarEnGuia(filas, consulta) {
  const lista = Array.isArray(filas) ? filas : [];
  const anioPedido = Number(consulta.anio);
  const conPuntos = lista
    .map((fila) => ({ fila, puntos: puntuarFila(fila, consulta) }))
    .filter((item) => item.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos || String(b.fila.edicion).localeCompare(String(a.fila.edicion)));

  let usados = conPuntos;
  let anioUsado = anioPedido;
  if (!usados.length) {
    const vecinos = lista
      .map((fila) => {
        const delta = Math.abs(Number(fila.anio) - anioPedido);
        if (delta === 0 || delta > 1) return null;
        const puntos = puntuarFila(fila, { ...consulta, anio: fila.anio });
        return puntos > 0 ? { fila, puntos: puntos - 5 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.puntos - a.puntos);
    usados = vecinos;
    if (usados.length) anioUsado = Number(usados[0].fila.anio);
  }

  if (!usados.length) return { encontrados: [] };

  const mejor = usados[0].puntos;
  const top = usados.filter((item) => item.puntos === mejor).map((item) => item.fila);
  const precios = new Set(top.map((fila) => `${fila.moneda}:${Number(fila.precio_revista)}`));
  if (top.length > 1 && precios.size > 1) {
    return { encontrados: top, necesita_version: true, anio_usado: anioUsado };
  }
  return { encontrados: [top[0]], necesita_version: false, anio_usado: anioUsado };
}

module.exports = {
  ESTADOS_USO,
  CONFIG_DEFAULT,
  normalizarTexto,
  edicionActual,
  parseEdicion,
  leerConfig,
  redondearPrecio,
  normalizarEstadoUso,
  analizarUso,
  estimarPrecio,
  puntuarFila,
  buscarEnGuia,
};
