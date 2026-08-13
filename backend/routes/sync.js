const express = require("express");
const { db } = require("../db");
const { publicarEnGist } = require("../sync/gist");

const router = express.Router();

function serializeVehiculo(row) {
  let imagenes_url = [];
  try {
    imagenes_url = JSON.parse(row.imagenes_url || "[]");
  } catch (_err) {
    imagenes_url = [];
  }
  let equipamiento = [];
  try {
    equipamiento = JSON.parse(row.equipamiento || "[]");
  } catch (_err) {
    equipamiento = [];
  }
  return { ...row, imagenes_url, equipamiento, destacado: !!row.destacado };
}

function obtenerConfigSitio() {
  const row = db.prepare("SELECT * FROM ConfiguracionSitio WHERE id = 1").get();
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
  };
}

router.post("/publicar", async (_req, res) => {
  try {
    const vehiculos = db
      .prepare("SELECT * FROM Vehiculos WHERE eliminado = 0 ORDER BY created_at DESC")
      .all()
      .map(serializeVehiculo);

    const resultado = await publicarEnGist({
      gistId: process.env.GYG_GIST_ID,
      token: process.env.GYG_GITHUB_TOKEN,
      vehiculos,
      siteConfig: obtenerConfigSitio(),
    });

    db.prepare("INSERT OR REPLACE INTO Meta (clave, valor) VALUES ('last_sync_at', ?)").run(
      new Date().toISOString()
    );

    res.json({
      ok: true,
      vehiculosPublicados: resultado.vehiculosPublicados,
      fotosLocalesOmitidas: resultado.fotosLocalesOmitidas || 0,
      url: resultado.htmlUrl,
      publicadoEn: new Date().toISOString(),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "No se pudo publicar" });
  }
});

module.exports = router;
