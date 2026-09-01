const test = require("node:test");
const assert = require("node:assert/strict");
const { hoyIso, diasHasta, masMeses } = require("../backend/utils/fechas");

test("diasHasta da negativo si ya venció y cero si es hoy", () => {
  assert.ok(diasHasta("2020-01-01") < 0);
  assert.equal(diasHasta(hoyIso()), 0);
  assert.equal(diasHasta("no-es-fecha"), null);
  assert.ok(diasHasta(masMeses(hoyIso(), 1)) >= 28);
});
