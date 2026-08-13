const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const tema = fs.readFileSync(path.join(__dirname, "../blogger/tema.xml"), "utf8");

test("el tema de Blogger conserva el diseño GyG y no es el catálogo corto", () => {
  assert.match(tema, /GyG Showroom/);
  assert.match(tema, /site-header/);
  assert.match(tema, /home-hero/);
  assert.match(tema, /font-display: "Syne"/);
  assert.doesNotMatch(tema, /id='gyg-root'/);
});

test("el tema incluye zoom, Contactanos y redes opcionales", () => {
  assert.match(tema, /gallery__main/);
  assert.match(tema, /object-fit: contain/);
  assert.match(tema, /openLightbox/);
  assert.match(tema, /Contactanos/);
  assert.match(tema, /btn--instagram/);
  assert.match(tema, /safe-area-inset-bottom/);
  assert.match(tema, /CDATA/);
});
