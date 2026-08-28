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

const logoSrc = dataUri(path.join(publicDir, "brand", "logo-gg-automotores.png"), "image/png");
const favSrc = dataUri(path.join(publicDir, "favicon.png"), "image/png");
const appleSrc = dataUri(path.join(publicDir, "apple-touch-icon.png"), "image/png");

const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgets='false' b:layoutsVersion='3' b:responsive='true' b:templateVersion='1.0.0' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
  <head>
    <meta charset='UTF-8'/>
    <meta content='width=device-width, initial-scale=1, viewport-fit=cover' name='viewport'/>
    <title><data:blog.pageTitle/></title>
    <link href='${favSrc}' rel='icon' type='image/png'/>
    <link href='${appleSrc}' rel='apple-touch-icon'/>
    <b:include data='blog' name='all-head-content'/>
    <b:skin version='1.0.0'><![CDATA[
${css}
]]></b:skin>
  </head>
  <body>
    <b:section id='gyg-required-section' maxwidgets='0' name='G&amp;G' showaddelement='no'/>

    <div id='gyg-blogger-root'>
      <div aria-hidden='true' class='atmosphere'/>
      <div class='app-shell'>
        <header class='site-header'>
          <div class='site-header__inner'>
            <a aria-label='G&amp;G Automotores inicio' class='brand' href='#/'>
              <img alt='G&amp;G Automotores' class='brand__logo' src='${logoSrc}'/>
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
          <div class='loading-state' style='margin:2rem 1.25rem'>Cargando sitio&#8230;</div>
        </main>
        <footer class='site-footer'>
          <div>G&amp;G Automotores <span id='year'/></div>
          <div id='footerUpdated'>Stock en vivo</div>
        </footer>
      </div>
      <a class='wa-bar hidden' id='waBar' rel='noopener' target='_blank'>WhatsApp</a>
      <button aria-label='Volver arriba' class='back-top' id='backTop' type='button'>↑</button>
      <div aria-live='polite' class='toast' id='toast' role='status'/>
    </div>

    <script type='text/javascript'>
//<![CDATA[
${js}
//]]>
    </script>
  </body>
</html>
`;

const destino = path.join(dir, "tema.xml");
fs.writeFileSync(destino, xml);
console.log("Wrote", destino, "(" + xml.split("\n").length + " lines)");
