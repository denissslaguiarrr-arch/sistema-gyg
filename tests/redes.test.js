const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizarInstagram,
  normalizarFacebook,
  digitosWhatsapp,
} = require("../backend/utils/redes");

test("normalizarInstagram acepta @usuario, path o URL y vacía si no hay valor", () => {
  assert.equal(normalizarInstagram(""), "");
  assert.equal(normalizarInstagram("   "), "");
  assert.equal(normalizarInstagram("@autosdelsur"), "https://www.instagram.com/autosdelsur");
  assert.equal(normalizarInstagram("autosdelsur"), "https://www.instagram.com/autosdelsur");
  assert.equal(
    normalizarInstagram("https://instagram.com/autosdelsur"),
    "https://instagram.com/autosdelsur"
  );
});

test("normalizarFacebook deja vacío si no cargaron nada", () => {
  assert.equal(normalizarFacebook(""), "");
  assert.equal(normalizarFacebook("AutosDelSur"), "https://www.facebook.com/AutosDelSur");
});

test("digitosWhatsapp quita espacios, + y guiones", () => {
  assert.equal(digitosWhatsapp("+54 9 1112 34-5678"), "5491112345678");
});
