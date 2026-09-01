const test = require("node:test");
const assert = require("node:assert/strict");
const { reescribirMarca, reescribirMarcaEn } = require("../backend/utils/marca");

test("reescribirMarca cambia GyG suelto a G&G y no toca handles", () => {
  assert.equal(reescribirMarca("GyG"), "G&G");
  assert.equal(reescribirMarca("Concesionaria GyG — stock"), "Concesionaria G&G — stock");
  assert.equal(
    reescribirMarca("Concesionaria GyG — stock en vivo desde la nube"),
    "Concesionaria G&G — stock en vivo desde la nube"
  );
  assert.equal(reescribirMarca("gyg"), "G&G");
  assert.equal(reescribirMarca("gyg-007"), "gyg-007");
  assert.equal(
    reescribirMarca("https://www.instagram.com/gygautomotores"),
    "https://www.instagram.com/gygautomotores"
  );
});

test("reescribirMarcaEn recorre site y páginas y deja las URLs", () => {
  const out = reescribirMarcaEn({
    name: "GyG",
    footerText: "Concesionaria GyG",
    instagram: "https://instagram.com/gygautomotores",
    content: { eyebrow: "GyG", headline: "Hola" },
  });
  assert.equal(out.name, "G&G");
  assert.equal(out.footerText, "Concesionaria G&G");
  assert.equal(out.instagram, "https://instagram.com/gygautomotores");
  assert.equal(out.content.eyebrow, "G&G");
  assert.equal(out.content.headline, "Hola");
});
