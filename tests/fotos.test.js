const test = require("node:test");
const assert = require("node:assert/strict");
const {
  esFotoLocal,
  esUrlPublica,
  normalizarUrlFoto,
  fotosParaCatalogo,
} = require("../backend/utils/fotos");

test("esFotoLocal detecta /uploads y localhost", () => {
  assert.equal(esFotoLocal("/uploads/abc.jpg"), true);
  assert.equal(esFotoLocal("http://localhost:3000/uploads/abc.jpg"), true);
  assert.equal(esFotoLocal("https://ejemplo.com/auto.jpg"), false);
});

test("esUrlPublica solo acepta https remoto", () => {
  assert.equal(esUrlPublica("https://ejemplo.com/auto.jpg"), true);
  assert.equal(esUrlPublica("/uploads/abc.jpg"), false);
  assert.equal(esUrlPublica("http://ejemplo.com/auto.jpg"), false);
});

test("normalizarUrlFoto convierte un enlace de Google Drive en miniatura directa", () => {
  const view = "https://drive.google.com/file/d/ABC123xyz/view?usp=sharing";
  assert.equal(
    normalizarUrlFoto(view),
    "https://drive.google.com/thumbnail?id=ABC123xyz&sz=w2000"
  );
});

test("fotosParaCatalogo omite locales y deja los https públicos", () => {
  const resultado = fotosParaCatalogo([
    "/uploads/local.jpg",
    "https://cdn.ejemplo.com/hilux.jpg",
    "https://drive.google.com/file/d/FILEID99/view",
  ]);
  assert.deepEqual(resultado.fotos, [
    "https://cdn.ejemplo.com/hilux.jpg",
    "https://drive.google.com/thumbnail?id=FILEID99&sz=w2000",
  ]);
  assert.equal(resultado.omitidasLocales, 1);
});
