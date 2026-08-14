const { hoyIso, parseFechaIso } = require("../utils/fechas");
const { parseListaUrls } = require("../utils/csv");

const ESTADOS = ["Disponible", "Reservado", "Vendido"];
const MONEDAS = ["ARS", "USD"];
const ORIGENES = ["Compra", "Consignación", "Permuta"];
const ORIGEN_POR_CLAVE = {
  compra: "Compra",
  consignacion: "Consignación",
  permuta: "Permuta",
};

class ValidationError extends Error {
  constructor(errors) {
    super("Datos inválidos");
    this.status = 400;
    this.errors = errors;
  }
}

// Acepta arreglo JSON, string JSON o texto separado por comas. Se usa tanto
// para imagenes_url como para equipamiento. Devuelve null si el tipo
// recibido no puede interpretarse.
function parseListaTexto(value) {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch (_err) {
      // No era JSON: se interpreta como lista separada por comas.
    }
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return null;
}

function parseBooleano(value) {
  if (value === true || value === "true" || value === 1 || value === "1" || value === "on") {
    return true;
  }
  return false;
}

function campoPresente(body, clave) {
  return Object.prototype.hasOwnProperty.call(body, clave) && body[clave] !== undefined;
}

function parseOrigen(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const clave = String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return ORIGEN_POR_CLAVE[clave] || null;
}

function validateVehiculo(body = {}, { existente } = {}) {
  const errors = [];

  const marca = typeof body.marca === "string" ? body.marca.trim() : "";
  const modelo = typeof body.modelo === "string" ? body.modelo.trim() : "";
  const dominio =
    typeof body.dominio === "string" ? body.dominio.trim().toUpperCase() : "";
  const moneda =
    typeof body.moneda === "string" ? body.moneda.trim().toUpperCase() : "";
  const estado =
    typeof body.estado === "string" && body.estado.trim()
      ? body.estado.trim()
      : "Disponible";
  const notas = typeof body.notas === "string" ? body.notas.trim() : "";

  const anio = Number(body.anio);
  const kilometraje =
    body.kilometraje === undefined || body.kilometraje === ""
      ? 0
      : Number(body.kilometraje);
  const precio = Number(body.precio);
  const precioOfertaVacio =
    body.precio_oferta === undefined || body.precio_oferta === null || body.precio_oferta === "";
  const precioOferta = precioOfertaVacio ? null : Number(body.precio_oferta);

  // Campos opcionales para la ficha pública / catálogo web (fase 2).
  // No son obligatorios: si faltan, el catálogo simplemente no los muestra.
  const version = typeof body.version === "string" ? body.version.trim() : "";
  const combustible = typeof body.combustible === "string" ? body.combustible.trim() : "";
  const transmision = typeof body.transmision === "string" ? body.transmision.trim() : "";
  const traccion = typeof body.traccion === "string" ? body.traccion.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "";
  const motor = typeof body.motor === "string" ? body.motor.trim() : "";
  const potencia = typeof body.potencia === "string" ? body.potencia.trim() : "";
  const carroceria = typeof body.carroceria === "string" ? body.carroceria.trim() : "";
  const destacado = parseBooleano(body.destacado);
  const puertas =
    body.puertas === undefined || body.puertas === null || body.puertas === ""
      ? null
      : Number(body.puertas);

  if (!marca) errors.push("marca es obligatoria");
  if (!modelo) errors.push("modelo es obligatorio");
  if (!dominio) errors.push("dominio es obligatorio");

  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
    errors.push("anio debe ser un número entero entre 1900 y 2100");
  }
  if (!Number.isInteger(kilometraje) || kilometraje < 0) {
    errors.push("kilometraje debe ser un número entero mayor o igual a 0");
  }
  if (!Number.isFinite(precio) || precio < 0) {
    errors.push("precio debe ser un número mayor o igual a 0");
  }
  if (!precioOfertaVacio && (!Number.isFinite(precioOferta) || precioOferta < 0)) {
    errors.push("precio_oferta debe ser un número mayor o igual a 0 (o vacío)");
  } else if (precioOferta !== null && Number.isFinite(precio) && precioOferta >= precio) {
    errors.push("precio_oferta debe ser menor que el precio de lista");
  }
  if (!MONEDAS.includes(moneda)) {
    errors.push(`moneda debe ser una de: ${MONEDAS.join(", ")}`);
  }
  if (!ESTADOS.includes(estado)) {
    errors.push(`estado debe ser uno de: ${ESTADOS.join(", ")}`);
  }
  if (puertas !== null && (!Number.isInteger(puertas) || puertas < 1 || puertas > 6)) {
    errors.push("puertas debe ser un número entero entre 1 y 6 (o vacío)");
  }

  let origen = existente ? existente.origen || "Compra" : "Compra";
  if (campoPresente(body, "origen")) {
    if (body.origen === null || String(body.origen).trim() === "") {
      origen = existente ? existente.origen || "Compra" : "Compra";
    } else {
      const origenParseado = parseOrigen(body.origen);
      if (!origenParseado) {
        errors.push(`origen debe ser uno de: ${ORIGENES.join(", ")}`);
      } else {
        origen = origenParseado;
      }
    }
  }

  let precio_compra = existente ? existente.precio_compra ?? null : null;
  if (campoPresente(body, "precio_compra")) {
    const vacio =
      body.precio_compra === null || body.precio_compra === "";
    if (vacio) {
      precio_compra = null;
    } else {
      const n = Number(body.precio_compra);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("precio_compra debe ser un número mayor o igual a 0 (o vacío)");
      } else {
        precio_compra = n;
      }
    }
  }

  let fecha_ingreso = existente ? existente.fecha_ingreso || hoyIso() : hoyIso();
  if (campoPresente(body, "fecha_ingreso")) {
    const parsed = parseFechaIso(body.fecha_ingreso);
    if (parsed.error) {
      errors.push("fecha_ingreso debe ser YYYY-MM-DD");
    } else if (parsed.vacio) {
      fecha_ingreso = existente ? existente.fecha_ingreso || hoyIso() : hoyIso();
    } else {
      fecha_ingreso = parsed.valor;
    }
  }

  const imagenes = parseListaUrls(body.imagenes_url);
  if (imagenes === null) {
    errors.push(
      "imagenes_url debe ser texto separado por | o comas, JSON de arreglo, o vacío"
    );
  }

  const equipamiento = parseListaTexto(body.equipamiento);
  if (equipamiento === null) {
    errors.push(
      "equipamiento debe ser texto separado por comas, JSON de arreglo, o vacío"
    );
  }

  if (errors.length) throw new ValidationError(errors);

  return {
    marca,
    modelo,
    anio,
    dominio,
    kilometraje,
    precio,
    precio_oferta: precioOferta,
    moneda,
    estado,
    imagenes_url: JSON.stringify(imagenes),
    notas,
    version,
    combustible,
    transmision,
    traccion,
    puertas,
    color,
    motor,
    potencia,
    carroceria,
    destacado: destacado ? 1 : 0,
    equipamiento: JSON.stringify(equipamiento),
    origen,
    precio_compra,
    fecha_ingreso,
  };
}

function validateEstado(body = {}) {
  const estado = typeof body.estado === "string" ? body.estado.trim() : "";
  if (!ESTADOS.includes(estado)) {
    throw new ValidationError([`estado debe ser uno de: ${ESTADOS.join(", ")}`]);
  }
  return estado;
}

module.exports = {
  ESTADOS,
  MONEDAS,
  ORIGENES,
  ValidationError,
  parseBooleano,
  validateVehiculo,
  validateEstado,
};
