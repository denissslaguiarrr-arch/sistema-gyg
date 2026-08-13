const express = require("express");
const { db } = require("../db");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

function serialize(row) {
  return {
    nombre: row.nombre,
    tagline: row.tagline,
    whatsapp: row.whatsapp,
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
  const { nombre, tagline, whatsapp, footerText, heroImage } = req.body || {};

  db.prepare(
    `UPDATE ConfiguracionSitio SET
       nombre = @nombre, tagline = @tagline, whatsapp = @whatsapp,
       footer_text = @footerText, hero_image = @heroImage,
       updated_at = datetime('now')
     WHERE id = 1`
  ).run({
    nombre: typeof nombre === "string" ? nombre.trim() : "",
    tagline: typeof tagline === "string" ? tagline.trim() : "",
    whatsapp: typeof whatsapp === "string" ? whatsapp.trim() : "",
    footerText: typeof footerText === "string" ? footerText.trim() : "",
    heroImage: typeof heroImage === "string" ? heroImage.trim() : "",
  });

  res.json(serialize(obtenerConfig()));
});

module.exports = router;
