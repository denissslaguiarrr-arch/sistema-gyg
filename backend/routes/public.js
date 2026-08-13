const express = require("express");
const { db } = require("../db");
const { construirStockJson } = require("../sync/gist");

const router = express.Router();

// Solo se expone información apta para un comprador: nada de auditoría interna
// (sin patente, sin fechas internas, sin datos de usuarios).
function serializePublico(row) {
  let imagenes = [];
  try {
    imagenes = JSON.parse(row.imagenes_url || "[]");
  } catch (_err) {
    imagenes = [];
  }
  let equipamiento = [];
  try {
    equipamiento = JSON.parse(row.equipamiento || "[]");
  } catch (_err) {
    equipamiento = [];
  }
  return {
    id: row.id,
    marca: row.marca,
    modelo: row.modelo,
    anio: row.anio,
    kilometraje: row.kilometraje,
    precio: row.precio,
    precio_oferta: row.precio_oferta ?? null,
    moneda: row.moneda,
    estado: row.estado,
    imagenes_url: imagenes,
    notas: row.notas,
    es_0km: row.kilometraje === 0,
    version: row.version || "",
    combustible: row.combustible || "",
    transmision: row.transmision || "",
    traccion: row.traccion || "",
    puertas: row.puertas ?? null,
    color: row.color || "",
    motor: row.motor || "",
    potencia: row.potencia || "",
    carroceria: row.carroceria || "",
    destacado: !!row.destacado,
    equipamiento,
  };
}

router.get("/vehiculos/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM Vehiculos WHERE id = ? AND eliminado = 0")
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: "Vehículo no encontrado" });
  res.json(serializePublico(row));
});

router.get("/catalogo", (_req, res) => {
  const vehiculos = db
    .prepare("SELECT * FROM Vehiculos WHERE eliminado = 0 ORDER BY created_at DESC")
    .all()
    .map((row) => {
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
    });

  const cfg = db.prepare("SELECT * FROM ConfiguracionSitio WHERE id = 1").get() || {};
  const payload = construirStockJson({
    gistActual: null,
    vehiculos,
    siteConfig: {
      nombre: cfg.nombre,
      tagline: cfg.tagline,
      whatsapp: cfg.whatsapp,
      instagram: cfg.instagram || "",
      facebook: cfg.facebook || "",
      contactoTitulo: cfg.contacto_titulo || "Contactanos",
      contactoTexto: cfg.contacto_texto || "",
      footerText: cfg.footer_text,
      heroImage: cfg.hero_image,
    },
  });
  res.json(payload);
});

module.exports = router;
