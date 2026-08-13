const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const tema = fs.readFileSync(path.join(__dirname, "../blogger/tema.xml"), "utf8");

test("el tema de Blogger conserva el showroom G&G y no es el catálogo corto", () => {
  assert.match(tema, /G&G Showroom/);
  assert.match(tema, /site-header/);
  assert.match(tema, /home-hero/);
  assert.match(tema, /font-display: "Syne"/);
  assert.match(tema, /brand__logo/);
  assert.match(tema, /rel='icon'/);
  assert.match(tema, /#e85d23/i);
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
  assert.match(tema, /G&amp;G Automotores/);
  assert.doesNotMatch(tema, /G<span>y<\/span>G/);
});

test("el nombre G&G está disponible en las dos partes del script de Blogger", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  const partes = js.split("})(window);");
  assert.equal(partes.length, 2);
  assert.match(partes[0], /displayBrandName,/);
  assert.match(partes[1], /function brandMarkup/);
  assert.match(partes[1], /GyGStock\.displayBrandName/);
});
