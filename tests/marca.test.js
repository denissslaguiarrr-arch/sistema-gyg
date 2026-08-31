const test = require("node:test");
const assert = require("node:assert/strict");
const {
  nombreMarca,
  esHeadlineMarcaDefault,
  idPublicoVehiculo,
  NOMBRE_DEFAULT,
} = require("../backend/utils/marca");

test("nombreMarca usa el valor cargado o Concesionaria si está vacío", () => {
  assert.equal(nombreMarca("Autos del Sur"), "Autos del Sur");
  assert.equal(nombreMarca("  Sur  "), "Sur");
  assert.equal(nombreMarca(""), NOMBRE_DEFAULT);
  assert.equal(nombreMarca(null), NOMBRE_DEFAULT);
  assert.equal(NOMBRE_DEFAULT, "Concesionaria");
});

test("esHeadlineMarcaDefault detecta títulos viejos de marca para reemplazarlos", () => {
  assert.equal(esHeadlineMarcaDefault(""), true);
  assert.equal(esHeadlineMarcaDefault("G&G"), true);
  assert.equal(esHeadlineMarcaDefault("GyG"), true);
  assert.equal(esHeadlineMarcaDefault("Autos del Sur"), false);
  assert.equal(esHeadlineMarcaDefault("Stock 0 km y usados"), false);
});

test("idPublicoVehiculo no usa prefijo de una marca puntual", () => {
  assert.equal(idPublicoVehiculo(7), "v-007");
  assert.equal(idPublicoVehiculo(1), "v-001");
});
