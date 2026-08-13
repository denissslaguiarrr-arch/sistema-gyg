#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "blogger");
const css = fs.readFileSync(path.join(dir, "gyg-showroom.css"), "utf8");
const js = fs.readFileSync(path.join(dir, "gyg-showroom.js"), "utf8");

const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgets='false' b:layoutsVersion='3' b:responsive='true' b:templateVersion='1.0.0' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
  <head>
    <meta charset='UTF-8'/>
    <meta content='width=device-width, initial-scale=1, viewport-fit=cover' name='viewport'/>
    <title><data:blog.pageTitle/></title>
    <b:include data='blog' name='all-head-content'/>
    <b:skin version='1.0.0'><![CDATA[
${css}
]]></b:skin>
  </head>
  <body>
    <b:section id='gyg-required-section' maxwidgets='0' name='GyG' showaddelement='no'/>

    <div id='gyg-blogger-root'>
      <div aria-hidden='true' class='atmosphere'/>
      <div class='app-shell'>
        <header class='site-header'>
          <div class='site-header__inner'>
            <a aria-label='GyG inicio' class='brand' href='#/'>
              <div class='brand__name'>G<span>y</span>G</div>
              <div class='brand__tag' id='brandTag'>Selección premium</div>
            </a>
            <nav aria-label='Secciones' class='nav-links' id='navLinks'/>
          </div>
        </header>
        <main id='app'>
          <div class='loading-state' style='margin:2rem 1.25rem'>Cargando sitio&#8230;</div>
        </main>
        <footer class='site-footer'>
          <div>GyG Concesionaria <span id='year'/></div>
          <div id='footerUpdated'>Stock en vivo</div>
        </footer>
      </div>
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
