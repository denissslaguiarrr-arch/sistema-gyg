const express = require("express");
const { db } = require("../db");
const requireRole = require("../middleware/requireRole");
const { texto, normalizarInstagram, normalizarFacebook } = require("../utils/redes");

const router = express.Router();

function serialize(row) {
  return {
    nombre: row.nombre,
    tagline: row.tagline,
    whatsapp: row.whatsapp,
    instagram: row.instagram || "",
    facebook: row.facebook || "",
    contactoTitulo: row.contacto_titulo || "Contactanos",
    contactoTexto: row.contacto_texto || "",
    footerText: row.footer_text,
    heroImage: row.hero_image,
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

  db.prepare(
    `UPDATE ConfiguracionSitio SET
       nombre = @nombre, tagline = @tagline, whatsapp = @whatsapp,
       instagram = @instagram, facebook = @facebook,
       contacto_titulo = @contactoTitulo, contacto_texto = @contactoTexto,
       footer_text = @footerText, hero_image = @heroImage,
       updated_at = datetime('now')
     WHERE id = 1`
  ).run({
    nombre: texto(body.nombre),
    tagline: texto(body.tagline),
    whatsapp: texto(body.whatsapp),
    instagram: normalizarInstagram(body.instagram),
    facebook: normalizarFacebook(body.facebook),
    contactoTitulo: texto(body.contactoTitulo) || "Contactanos",
    contactoTexto: texto(body.contactoTexto),
    footerText: texto(body.footerText),
    heroImage: texto(body.heroImage),
  });

  res.json(serialize(obtenerConfig()));
});

module.exports = router;
