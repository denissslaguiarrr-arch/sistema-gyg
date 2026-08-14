// Parser CSV simple (RFC 4180): soporta campos entre comillas, comas y
// comillas escapadas ("") dentro del campo, y saltos de línea \n o \r\n.
function parseCsv(texto) {
  const contenido = String(texto ?? "").replace(/^\uFEFF/, ""); // BOM de Excel
  const filas = [];
  let fila = [];
  let campo = "";
  let dentroDeComillas = false;

  for (let i = 0; i < contenido.length; i += 1) {
    const c = contenido[i];

    if (dentroDeComillas) {
      if (c === '"') {
        if (contenido[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          dentroDeComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\r") {
      // se ignora; el salto de línea real lo maneja el \n
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }

  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  // Se descartan líneas completamente vacías (comunes al final del archivo).
  return filas.filter((f) => !(f.length === 1 && f[0].trim() === ""));
}

function quitarAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizarEncabezado(texto) {
  return quitarAcentos(String(texto ?? "").trim().toLowerCase());
}

// JSON de arreglo, texto suelto o lista: una sola celda CSV con links separados
// por " | " para que Excel no parta las URLs y el import conserve el orden
// (la primera es la foto principal). El import también acepta comas.
function listaATextoCsv(valor) {
  if (valor == null || valor === "") return "";
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item).trim()).filter(Boolean).join(" | ");
  }
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto) return "";
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean).join(" | ");
      }
    } catch (_err) {
      // ya era texto plano
    }
    return texto;
  }
  return String(valor);
}

function parseListaUrls(value) {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return null;

  const texto = value.trim();
  if (!texto) return [];

  try {
    const parsed = JSON.parse(texto);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).trim()).filter(Boolean);
    }
  } catch (_err) {
    // No era JSON: se interpreta como lista.
  }

  if (texto.includes("|")) {
    return texto.split("|").map((v) => v.trim()).filter(Boolean);
  }
  if (/[\r\n]/.test(texto)) {
    return texto.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  }
  if (/(https?:\/\/|\/uploads\/)/i.test(texto) && texto.includes(",")) {
    return texto
      .split(/\s*,\s*(?=(?:https?:\/\/|\/uploads\/))/i)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return texto.split(",").map((v) => v.trim()).filter(Boolean);
}

module.exports = { parseCsv, normalizarEncabezado, listaATextoCsv, parseListaUrls };
