const NOMBRE_DEFAULT = "Concesionaria";

function nombreMarca(valor) {
  const n = String(valor == null ? "" : valor).trim();
  return n || NOMBRE_DEFAULT;
}

function esHeadlineMarcaDefault(texto) {
  const n = String(texto == null ? "" : texto)
    .replace(/\s/g, "")
    .replace(/&amp;/gi, "&")
    .toLowerCase();
  return !n || n === "g&g" || n === "gyg" || n === "g+g";
}

function idPublicoVehiculo(id) {
  return `v-${String(id).padStart(3, "0")}`;
}

module.exports = {
  NOMBRE_DEFAULT,
  nombreMarca,
  esHeadlineMarcaDefault,
  idPublicoVehiculo,
};
