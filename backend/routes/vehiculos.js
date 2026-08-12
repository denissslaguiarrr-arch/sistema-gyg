const express = require("express");
const { db } = require("../db");
const { validateVehiculo, validateEstado } = require("../validators/vehiculo");

const router = express.Router();

function serialize(row) {
  let imagenes = [];
  try {
    imagenes = JSON.parse(row.imagenes_url || "[]");
  } catch (_err) {
    imagenes = [];
  }
  return {
    ...row,
    imagenes_url: imagenes,
    es_0km: row.kilometraje === 0,
  };
}

function findById(id) {
  return db.prepare("SELECT * FROM Vehiculos WHERE id = ?").get(id);
}

// GET /api/vehiculos?q=&estado=&km=0km|usado
router.get("/", (req, res) => {
  const { q, estado, km } = req.query;
  const clauses = [];
  const params = {};

  if (q) {
    clauses.push("(marca LIKE @q OR modelo LIKE @q OR dominio LIKE @q)");
    params.q = `%${q}%`;
  }
  if (estado) {
    clauses.push("estado = @estado");
    params.estado = estado;
  }
  if (km === "0km") {
    clauses.push("kilometraje = 0");
  } else if (km === "usado") {
    clauses.push("kilometraje > 0");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM Vehiculos ${where} ORDER BY created_at DESC, id DESC`)
    .all(params);

  res.json(rows.map(serialize));
});

router.get("/:id", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Vehículo no encontrado" });
  res.json(serialize(row));
});

router.post("/", (req, res, next) => {
  try {
    const data = validateVehiculo(req.body);
    const result = db
      .prepare(
        `INSERT INTO Vehiculos
           (marca, modelo, anio, dominio, kilometraje, precio, moneda, estado, imagenes_url, notas)
         VALUES
           (@marca, @modelo, @anio, @dominio, @kilometraje, @precio, @moneda, @estado, @imagenes_url, @notas)`
      )
      .run(data);

    res.status(201).json(serialize(findById(result.lastInsertRowid)));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", (req, res, next) => {
  try {
    if (!findById(req.params.id)) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    const data = validateVehiculo(req.body);
    db.prepare(
      `UPDATE Vehiculos SET
         marca = @marca, modelo = @modelo, anio = @anio, dominio = @dominio,
         kilometraje = @kilometraje, precio = @precio, moneda = @moneda,
         estado = @estado, imagenes_url = @imagenes_url, notas = @notas,
         updated_at = datetime('now')
       WHERE id = @id`
    ).run({ ...data, id: req.params.id });

    res.json(serialize(findById(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// Acción rápida: cambiar únicamente el estado sin pasar por el formulario completo.
router.patch("/:id/estado", (req, res, next) => {
  try {
    if (!findById(req.params.id)) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    const estado = validateEstado(req.body);
    db.prepare(
      "UPDATE Vehiculos SET estado = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(estado, req.params.id);

    res.json(serialize(findById(req.params.id)));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM Vehiculos WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }
  res.status(204).send();
});

module.exports = router;
