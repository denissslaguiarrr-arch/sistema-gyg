// GyG → G&G en textos de marca. No toca URLs ni handles (instagram.com/gygautomotores).

function reescribirMarca(texto) {
  return String(texto == null ? "" : texto).replace(/\bg\s*y\s*g\b(?![\w-])/gi, "G&G");
}

const CLAVES_SIN_REEMPLAZO = new Set([
  "instagram",
  "facebook",
  "whatsapp",
  "heroImage",
  "href",
  "url",
  "raw_url",
]);

function reescribirMarcaEn(valor) {
  if (valor == null) return valor;
  if (typeof valor === "string") return reescribirMarca(valor);
  if (Array.isArray(valor)) return valor.map(reescribirMarcaEn);
  if (typeof valor === "object") {
    const out = Array.isArray(valor) ? [] : { ...valor };
    for (const clave of Object.keys(valor)) {
      if (CLAVES_SIN_REEMPLAZO.has(clave)) {
        out[clave] = valor[clave];
      } else {
        out[clave] = reescribirMarcaEn(valor[clave]);
      }
    }
    return out;
  }
  return valor;
}

module.exports = {
  reescribirMarca,
  reescribirMarcaEn,
};
