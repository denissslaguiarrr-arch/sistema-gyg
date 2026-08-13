const ESTADOS = ["Disponible", "Reservado", "Vendido"];
const MONEDAS = ["ARS", "USD"];

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

function validateVehiculo(body = {}) {
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
  if (!MONEDAS.includes(moneda)) {
    errors.push(`moneda debe ser una de: ${MONEDAS.join(", ")}`);
  }
  if (!ESTADOS.includes(estado)) {
    errors.push(`estado debe ser uno de: ${ESTADOS.join(", ")}`);
  }
  if (puertas !== null && (!Number.isInteger(puertas) || puertas < 1 || puertas > 6)) {
    errors.push("puertas debe ser un número entero entre 1 y 6 (o vacío)");
  }

  const imagenes = parseListaTexto(body.imagenes_url);
  if (imagenes === null) {
    errors.push(
      "imagenes_url debe ser texto separado por comas, JSON de arreglo, o vacío"
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
  ValidationError,
  validateVehiculo,
  validateEstado,
};
