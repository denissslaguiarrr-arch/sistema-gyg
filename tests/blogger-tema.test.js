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

test("el inicio del showroom tiene un carrusel de vehículos", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(js, /function pickCarouselVehicles/);
  assert.match(js, /homeCarousel/);
  assert.match(js, /Selección del showroom/);
  assert.match(tema, /carousel__track/);
  assert.match(tema, /pickCarouselVehicles/);
});

test("el tema incluye zoom, Contactanos, Vendé tu auto y redes opcionales", () => {
  assert.match(tema, /gallery__main/);
  assert.match(tema, /object-fit: contain/);
  assert.match(tema, /openLightbox/);
  assert.match(tema, /Contactanos/);
  assert.match(tema, /Vendé tu auto/);
  assert.match(tema, /sell-form/);
  assert.match(tema, /sell-modes/);
  assert.match(tema, /sell-faq/);
  assert.match(tema, /Cotizá tu usado/);
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
  assert.match(partes[1], /GyGStock\.reescribirMarca/);
  assert.match(partes[1], /brand-sep/);
});

test("el tema reproduce videos de YouTube en la galería", () => {
  assert.match(tema, /youtube\.com\/embed/);
  assert.match(tema, /galleryItems/);
  assert.match(tema, /is-video/);
});

test("el hero no usa un & tipográfico entre las G", () => {
  const css = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.css"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(css, /\.brand-sep/);
  assert.match(js, /brand-sep/);
  assert.match(js, /reescribirMarca\(site\.footerText/);
  assert.match(js, /function isBrandWordmark/);
  assert.match(js, /Vendé tu auto<\/h2>/);
  assert.doesNotMatch(js, /Vendé tu auto con G/);
  assert.match(tema, /brand-sep/);
  assert.doesNotMatch(js, /brand-amp/);
  assert.doesNotMatch(css, /brand-amp/);
});

test("al cambiar de página el scroll vuelve arriba y hay WhatsApp fijo y volver arriba", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.css"), "utf8");
  assert.match(js, /function scrollPaginaArriba/);
  assert.match(js, /function forzarScrollCero/);
  assert.match(js, /behavior: "instant"/);
  assert.match(js, /scrollPaginaArriba\(\);/);
  assert.match(js, /actualizarWhatsappBar/);
  assert.match(js, /setupBackTop/);
  assert.match(css, /overflow-anchor: none/);
  assert.doesNotMatch(css, /scroll-behavior:\s*smooth/);
  assert.match(css, /\.wa-bar \{[^}]*border-radius: 50%/);
  assert.match(css, /\.back-top/);
  assert.match(tema, /id='waBar'/);
  assert.match(tema, /aria-label='WhatsApp'/);
  assert.match(tema, /id='backTop'/);
  assert.match(tema, /id='gygTop'/);
});

test("si el catálogo no carga, el visitante ve reintentar y no un formulario de Gist", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(js, /El catálogo no se pudo cargar/);
  assert.match(js, /gistRetryBtn/);
  assert.match(js, /clearStoredGistId/);
});

test("el catálogo se baja por URL cruda y se reintenta solo en el celular", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(js, /GIST_OWNER/);
  assert.match(js, /function gistRawUrls/);
  assert.match(js, /function fetchViaRaw/);
  assert.match(js, /function gistIdCandidates/);
  assert.match(js, /gist\.githubusercontent\.com/);
  assert.match(js, /gyg_gist_auto_retry/);
  assert.match(js, /Cargando el catálogo/);
  assert.match(js, /credentials: "omit"/);
  assert.match(tema, /gist\.githubusercontent\.com/);
  assert.match(tema, /gyg_gist_auto_retry/);
});

test("el precio no se muestra si no está tildado y hay botón de consulta", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(js, /function muestraPrecio/);
  assert.match(js, /Precio a consultar/);
  assert.match(js, /Consultar este vehículo/);
  assert.match(js, /vehicle__price--consulta/);
});

test("si hay oferta se tacha el precio de lista y un vendido no se muestra", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.css"), "utf8");
  assert.match(js, /function tienePrecioOferta/);
  assert.match(js, /function markupPrecio/);
  assert.match(js, /price-antes/);
  assert.match(js, /ya no está disponible/);
  assert.match(css, /text-decoration: line-through/);
  assert.match(tema, /vehicle__price-antes/);
  assert.match(tema, /ya no está disponible/);
});

test("Contacto tiene mapa, ficha con migas y similares, privacidad y carga con esqueleto", () => {
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.css"), "utf8");
  assert.match(js, /function mapsEmbedUrl/);
  assert.match(js, /maps\.google\.com\/maps\?q=/);
  assert.match(js, /function renderPrivacidad/);
  assert.match(js, /slug === "privacidad"/);
  assert.match(js, /function pickSimilarVehicles/);
  assert.match(js, /También te puede interesar/);
  assert.match(js, /class="crumbs"/);
  assert.match(css, /\.contact-map/);
  assert.match(css, /\.skeleton-page/);
  assert.match(css, /\.crumbs/);
  assert.match(tema, /href='#\/privacidad'/);
  assert.match(tema, /Privacidad/);
  assert.match(tema, /skeleton-page/);
  assert.match(tema, /Sistema de gestión para concesionarias/);
  assert.match(tema, /contact-map/);
});

test("en el celular el menú es un botón y la foto de inicio es una imagen real", () => {
  const css = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.css"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(css, /\.nav-toggle/);
  assert.match(css, /@media \(max-width: 920px\)/);
  assert.match(js, /home-hero__photo/);
  assert.match(js, /setupNavToggle/);
  assert.match(tema, /nav-toggle/);
  assert.match(tema, /home-hero__photo/);
  assert.doesNotMatch(js, /--hero-image: url\(/);
});

test("los títulos 0 km y Usados caben en el celular", () => {
  const css = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.css"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
  assert.match(css, /overflow-wrap: break-word/);
  assert.match(js, /function normalizePageCopy/);
  assert.match(js, /headline = "0 km"/);
  assert.match(js, /headline = "Usados"/);
  assert.doesNotMatch(js, /0 kilómetros/);
});
