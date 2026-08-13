#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const js = fs.readFileSync(path.join(root, "public", "catalogo.js"), "utf8");

const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:js='false' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta charset='UTF-8'/>
  <meta content='width=device-width, initial-scale=1, viewport-fit=cover' name='viewport'/>
  <title><data:blog.pageTitle/></title>
  <b:skin><![CDATA[
    body { margin: 0; }
    #navbar, .navbar, .skip-navigation { display: none !important; }
  ]]></b:skin>
</head>
<body>
  <b:section id='page' maxwidgets='1' showaddelement='no'>
    <b:widget id='Blog1' locked='true' title='Blog Posts' type='Blog'>
      <b:includable id='main'>
        <div id='gyg-root'></div>
      </b:includable>
    </b:widget>
  </b:section>
  <script type='text/javascript'>
//<![CDATA[
window.GYG_GIST_ID = window.GYG_GIST_ID || "74837d1c1f0a9a3a67e6dc5cc4fa5b6f";
${js}
//]]>
  </script>
</body>
</html>
`;

const destino = path.join(root, "blogger", "tema.xml");
fs.writeFileSync(destino, xml);
console.log("Wrote", destino);
