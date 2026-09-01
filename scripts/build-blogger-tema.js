#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "blogger");
const publicDir = path.join(__dirname, "..", "public");
const css = fs.readFileSync(path.join(dir, "gyg-showroom.css"), "utf8");
const js = fs.readFileSync(path.join(dir, "gyg-showroom.js"), "utf8");

function dataUri(filePath, mime) {
  const buf = fs.readFileSync(filePath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const favSrc = dataUri(path.join(publicDir, "brand", "favicon.svg"), "image/svg+xml");
const appleSrc = dataUri(path.join(publicDir, "apple-touch-icon.png"), "image/png");
const favGyg = dataUri(path.join(publicDir, "favicon.png"), "image/png");
const logoGyg = dataUri(path.join(publicDir, "brand", "logo-gg-automotores.png"), "image/png");

function armarTema(jsEmbebido, extras = {}) {
  const iconHref = extras.favicon || favSrc;
  const iconType = extras.faviconType || "image/svg+xml";
  const appleHref = extras.apple || appleSrc;
  const brandName = extras.brandName || "Concesionaria";
  const footerName = extras.footerName || "Concesionaria";
  const logoBlock = extras.logoSrc
    ? `<img alt='G&amp;G Automotores' class='brand__logo' id='brandLogo' src='${extras.logoSrc}'/>
              <div class='brand__name hidden' id='brandName'>${brandName}</div>`
    : `<img alt='' class='brand__logo hidden' id='brandLogo'/>
              <div class='brand__name' id='brandName'>${brandName}</div>`;
  return `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgets='false' b:layoutsVersion='3' b:responsive='true' b:templateVersion='1.0.0' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
  <head>
    <meta charset='UTF-8'/>
    <meta content='width=device-width, initial-scale=1, viewport-fit=cover' name='viewport'/>
    <title><data:blog.pageTitle/></title>
    <link href='${iconHref}' rel='icon' type='${iconType}'/>
    <link href='${appleHref}' rel='apple-touch-icon'/>
    <b:include data='blog' name='all-head-content'/>
    <b:skin version='1.0.0'><![CDATA[
${css}
]]></b:skin>
  </head>
  <body>
    <b:section id='gyg-required-section' maxwidgets='0' name='Showroom' showaddelement='no'/>

    <div id='gyg-blogger-root'>
      <div class='gyg-top-anchor' id='gygTop'></div>
      <div aria-hidden='true' class='atmosphere'/>
      <div class='app-shell'>
        <header class='site-header'>
          <div class='site-header__inner'>
            <a aria-label='Inicio' class='brand' href='#/'>
              ${logoBlock}
              <div class='brand__tag' id='brandTag'>Selección premium</div>
            </a>
            <button aria-controls='navLinks' aria-expanded='false' aria-label='Abrir menú' class='nav-toggle' id='navToggle' type='button'>
              <span class='nav-toggle__bar'></span>
              <span class='nav-toggle__bar'></span>
              <span class='nav-toggle__bar'></span>
            </button>
            <nav aria-label='Secciones' class='nav-links' id='navLinks'/>
          </div>
        </header>
        <main id='app'>
          <div aria-busy='true' aria-label='Cargando sitio' class='skeleton-page'>
            <div class='skeleton skeleton--hero'></div>
            <div class='stock-grid'>
              <div class='skeleton skeleton--card'></div>
              <div class='skeleton skeleton--card'></div>
              <div class='skeleton skeleton--card'></div>
            </div>
          </div>
        </main>
        <footer class='site-footer'>
          <div class='site-footer__main'>
            <div><span id='footerBrand'>${footerName}</span> <span id='year'/></div>
            <div id='footerUpdated'>Stock en vivo</div>
          </div>
          <div class='site-footer__legal'>
            <a href='#/privacidad'>Privacidad</a>
            <span class='footer-credit'>Sistema de gestión para concesionarias</span>
          </div>
        </footer>
      </div>
      <a aria-label='WhatsApp' class='wa-bar hidden' id='waBar' rel='noopener' target='_blank'>
        <svg aria-hidden='true' viewBox='0 0 24 24'>
          <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/>
        </svg>
      </a>
      <button aria-label='Volver arriba' class='back-top' id='backTop' type='button'>↑</button>
      <div aria-live='polite' class='toast' id='toast' role='status'/>
    </div>

    <script type='text/javascript'>
//<![CDATA[
${jsEmbebido}
//]]>
    </script>
  </body>
</html>
`;
}

const xml = armarTema(js);
const destino = path.join(dir, "tema.xml");
fs.writeFileSync(destino, xml);
console.log("Wrote", destino, "(" + xml.split("\n").length + " lines)");

const jsGyg = js
  .replace(/GIST_ID: ""/, 'GIST_ID: "74837d1c1f0a9a3a67e6dc5cc4fa5b6f"')
  .replace(/GIST_OWNER: ""/, 'GIST_OWNER: "denissslaguiarrr-arch"')
  .replace(/WHATSAPP_NUMBER: ""/, 'WHATSAPP_NUMBER: "+54 9 3735 46-2914"')
  .replace(/DEALERSHIP_NAME: "Concesionaria"/, 'DEALERSHIP_NAME: "G\\u0026G"')
  .replace(
    "function reescribirMarca(texto) {\n    return String(texto == null ? \"\" : texto);\n  }",
    "function reescribirMarca(texto) {\n    return String(texto == null ? \"\" : texto).replace(/\\bg\\s*y\\s*g\\b(?![\\w-])/gi, \"G\\u0026G\");\n  }"
  )
    .replace(
    "function displayBrandName(value) {\n    const n = String(value == null ? \"\" : value).trim();\n    if (n) return n;\n    return String(cfg().DEALERSHIP_NAME || \"Concesionaria\").trim() || \"Concesionaria\";\n  }",
    "function displayBrandName(value) {\n    const n = reescribirMarca(value).trim();\n    if (!n) return \"G\\u0026G\";\n    return n;\n  }"
  )
  .replace(
    'const logo = String(site.logoUrl || site.logo || "").trim();',
    'const logo = String(site.logoUrl || site.logo || GYG_CONFIG.LOGO_URL || "").trim();'
  )
  .replace(/LOCAL_SAMPLE_PATH: ""/, `LOCAL_SAMPLE_PATH: "",\n  LOGO_URL: ${JSON.stringify(logoGyg)}`);
const temaGyg = armarTema(jsGyg, {
  favicon: favGyg,
  faviconType: "image/png",
  logoSrc: logoGyg,
  brandName: "G&amp;G",
  footerName: "G&amp;G",
});
const destinoGyg = path.join(dir, "tema-gyg-automotores.xml");
fs.writeFileSync(destinoGyg, temaGyg);
console.log("Wrote", destinoGyg, "(" + temaGyg.split("\n").length + " lines)");
