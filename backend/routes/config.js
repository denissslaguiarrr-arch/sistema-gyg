const express = require("express");
const { db } = require("../db");
const requireRole = require("../middleware/requireRole");
const { texto, normalizarInstagram, normalizarFacebook } = require("../utils/redes");
const { imgurConfigurado } = require("../utils/imgur");
const { imgbbConfigurado } = require("../utils/imgbb");
const { credencialesGist, normalizarGistId, GIST_ID_DEFAULT } = require("../utils/gistConfig");
const { reescribirMarca } = require("../utils/marca");

const router = express.Router();

function serialize(row) {
  const gist = credencialesGist();
  return {
    nombre: reescribirMarca(row.nombre),
    tagline: reescribirMarca(row.tagline),
    whatsapp: row.whatsapp,
    instagram: row.instagram || "",
    facebook: row.facebook || "",
    contactoTitulo: reescribirMarca(row.contacto_titulo || "Contactanos"),
    contactoTexto: reescribirMarca(row.contacto_texto || ""),
    direccion: reescribirMarca(row.direccion || ""),
    footerText: reescribirMarca(row.footer_text),
    heroImage: row.hero_image,
    imgbbConfigurado: imgbbConfigurado() || Boolean(String((row && row.imgbb_api_key) || "").trim()),
    imgurConfigurado: imgurConfigurado(),
    gistId: gist.gistId,
    gistIdEnEnv: gist.gistIdEnEnv,
    githubTokenConfigurado: gist.tokenConfigurado,
    updated_at: row.updated_at,
  };
}

function obtenerConfig() {
  return db.prepare("SELECT * FROM ConfiguracionSitio WHERE id = 1").get();
}

router.get("/sitio", (_req, res) => {
  res.json(serialize(obtenerConfig()));
});

router.put("/sitio", requireRole("admin"), (req, res) => {
  const body = req.body || {};
  const actual = obtenerConfig() || {};
  const claveNueva =
    typeof body.imgbbApiKey === "string" && body.imgbbApiKey.trim()
      ? body.imgbbApiKey.trim()
      : actual.imgbb_api_key || "";
  const gistIdNuevo =
    typeof body.gistId === "string" && body.gistId.trim()
      ? normalizarGistId(body.gistId)
      : actual.gist_id || GIST_ID_DEFAULT;
  const tokenNuevo =
    typeof body.githubToken === "string" && body.githubToken.trim()
      ? body.githubToken.trim()
      : actual.github_token || "";

  db.prepare(
    `UPDATE ConfiguracionSitio SET
       nombre = @nombre, tagline = @tagline, whatsapp = @whatsapp,
       instagram = @instagram, facebook = @facebook,
       contacto_titulo = @contactoTitulo, contacto_texto = @contactoTexto,
       direccion = @direccion,
       footer_text = @footerText, hero_image = @heroImage,
       imgbb_api_key = @imgbbApiKey,
       gist_id = @gistId,
       github_token = @githubToken,
       updated_at = datetime('now')
     WHERE id = 1`
  ).run({
    nombre: reescribirMarca(texto(body.nombre)),
    tagline: reescribirMarca(texto(body.tagline)),
    whatsapp: texto(body.whatsapp),
    instagram: normalizarInstagram(body.instagram),
    facebook: normalizarFacebook(body.facebook),
    contactoTitulo: reescribirMarca(texto(body.contactoTitulo)) || "Contactanos",
    contactoTexto: reescribirMarca(texto(body.contactoTexto)),
    direccion: reescribirMarca(texto(body.direccion)),
    footerText: reescribirMarca(texto(body.footerText)),
    heroImage: texto(body.heroImage),
    imgbbApiKey: claveNueva,
    gistId: gistIdNuevo,
    githubToken: tokenNuevo,
  });

  res.json(serialize(obtenerConfig()));
});

module.exports = router;
