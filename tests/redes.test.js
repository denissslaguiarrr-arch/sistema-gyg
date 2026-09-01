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
  assert.equal(normalizarInstagram("@gygautomotores"), "https://www.instagram.com/gygautomotores");
  assert.equal(normalizarInstagram("gygautomotores"), "https://www.instagram.com/gygautomotores");
  assert.equal(
    normalizarInstagram("https://instagram.com/gygautomotores"),
    "https://instagram.com/gygautomotores"
  );
});

test("normalizarFacebook deja vacío si no cargaron nada", () => {
  assert.equal(normalizarFacebook(""), "");
  assert.equal(normalizarFacebook("GyGAutomotores"), "https://www.facebook.com/GyGAutomotores");
});

test("digitosWhatsapp quita espacios, + y guiones", () => {
  assert.equal(digitosWhatsapp("+54 9 3735 46-2914"), "5493735462914");
});
