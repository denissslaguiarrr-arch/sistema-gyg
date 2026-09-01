const test = require("node:test");
const assert = require("node:assert/strict");
const {
  esFotoLocal,
  esUrlPublica,
  esVideo,
  normalizarUrlFoto,
  fotosParaCatalogo,
  mediaParaCatalogo,
  portadaDe,
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

test("normalizarUrlFoto convierte un link de página de Imgur en i.imgur.com", () => {
  assert.equal(normalizarUrlFoto("https://imgur.com/abcDEF1"), "https://i.imgur.com/abcDEF1.jpg");
  assert.equal(normalizarUrlFoto("https://i.imgur.com/abcDEF1.png"), "https://i.imgur.com/abcDEF1.png");
  assert.equal(normalizarUrlFoto("https://imgur.com/a/album123"), "https://imgur.com/a/album123");
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

test("esVideo detecta YouTube, mp4 y Drive preview", () => {
  assert.equal(esVideo("https://www.youtube.com/watch?v=abcdefghijk"), true);
  assert.equal(esVideo("https://youtu.be/abcdefghijk"), true);
  assert.equal(esVideo("/uploads/clip.mp4"), true);
  assert.equal(esVideo("https://drive.google.com/file/d/ABC/preview"), true);
  assert.equal(esVideo("https://cdn.ejemplo.com/foto.jpg"), false);
});

test("mediaParaCatalogo separa fotos y videos conservando el orden", () => {
  const resultado = mediaParaCatalogo([
    "https://cdn.ejemplo.com/frente.jpg",
    "https://www.youtube.com/watch?v=abcdefghijk",
    "https://cdn.ejemplo.com/lateral.jpg",
    "/uploads/local.mp4",
  ]);
  assert.deepEqual(resultado.fotos, [
    "https://cdn.ejemplo.com/frente.jpg",
    "https://cdn.ejemplo.com/lateral.jpg",
  ]);
  assert.equal(resultado.videos.length, 1);
  assert.equal(resultado.videos[0].url, "https://www.youtube.com/watch?v=abcdefghijk");
  assert.deepEqual(
    resultado.media.map((item) => item.tipo),
    ["foto", "video", "foto"]
  );
  assert.equal(resultado.omitidasLocales, 1);
});

test("portadaDe usa la primera foto o la miniatura de YouTube", () => {
  assert.equal(portadaDe(["https://a.com/1.jpg", "https://a.com/2.jpg"]), "https://a.com/1.jpg");
  assert.equal(
    portadaDe(["https://www.youtube.com/watch?v=abcdefghijk", "https://a.com/1.jpg"]),
    "https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg"
  );
});
