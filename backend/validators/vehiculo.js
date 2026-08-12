const ESTADOS = ["Disponible", "Reservado", "Vendido"];
const MONEDAS = ["ARS", "USD"];

class ValidationError extends Error {
  constructor(errors) {
    super("Datos inválidos");
    this.status = 400;
    this.errors = errors;
  }
}

// Acepta arreglo JSON, string JSON o texto separado por comas.
// Devuelve null si el tipo recibido no puede interpretarse.
function parseImagenes(value) {
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

  const imagenes = parseImagenes(body.imagenes_url);
  if (imagenes === null) {
    errors.push(
      "imagenes_url debe ser texto separado por comas, JSON de arreglo, o vacío"
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
