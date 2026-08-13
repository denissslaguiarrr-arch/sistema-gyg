const express = require("express");
const { db } = require("../db");

const router = express.Router();

// Solo se expone información apta para un comprador: nada de auditoría interna.
function serializePublico(row) {
  let imagenes = [];
  try {
    imagenes = JSON.parse(row.imagenes_url || "[]");
  } catch (_err) {
    imagenes = [];
  }
  return {
    id: row.id,
    marca: row.marca,
    modelo: row.modelo,
    anio: row.anio,
    kilometraje: row.kilometraje,
    precio: row.precio,
    moneda: row.moneda,
    estado: row.estado,
    imagenes_url: imagenes,
    notas: row.notas,
    es_0km: row.kilometraje === 0,
  };
}

router.get("/vehiculos/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM Vehiculos WHERE id = ? AND eliminado = 0")
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: "Vehículo no encontrado" });
  res.json(serializePublico(row));
});

module.exports = router;
