const express = require("express");
const { db } = require("../db");
const requireRole = require("../middleware/requireRole");
const { diasDesde } = require("../utils/fechas");
const {
  validateGasto,
  validateDocumentacion,
  validateVenta,
} = require("../validators/erp");

const router = express.Router();

function findActivo(id) {
  const row = db.prepare("SELECT * FROM Vehiculos WHERE id = ?").get(id);
  if (!row || row.eliminado) return null;
  return row;
}

function serializeGasto(row) {
  return {
    id: row.id,
    vehiculo_id: row.vehiculo_id,
    concepto: row.concepto,
    monto: row.monto,
    fecha: row.fecha,
    created_at: row.created_at,
  };
}

function serializeDocumentacion(row, vehiculoId) {
  if (!row) {
    return {
      vehiculo_id: Number(vehiculoId),
      tiene_08: false,
      tiene_titulo: false,
      verificacion_policial_vto: null,
      vtv_vencimiento: null,
      updated_at: null,
    };
  }
  return {
    id: row.id,
    vehiculo_id: row.vehiculo_id,
    tiene_08: !!row.tiene_08,
    tiene_titulo: !!row.tiene_titulo,
    verificacion_policial_vto: row.verificacion_policial_vto,
    vtv_vencimiento: row.vtv_vencimiento,
    updated_at: row.updated_at,
  };
}

function serializeVenta(row) {
  if (!row) return null;
  return {
    id: row.id,
    vehiculo_id: row.vehiculo_id,
    cliente_nombre: row.cliente_nombre,
    cliente_telefono: row.cliente_telefono,
    precio_venta_final: row.precio_venta_final,
    fecha_venta: row.fecha_venta,
    fin_garantia: row.fin_garantia,
    created_at: row.created_at,
  };
}

function listarGastos(vehiculoId) {
  return db
    .prepare(
      "SELECT * FROM Gastos WHERE vehiculo_id = ? ORDER BY fecha DESC, id DESC"
    )
    .all(vehiculoId)
    .map(serializeGasto);
}

function obtenerDocumentacion(vehiculoId) {
  return db.prepare("SELECT * FROM Documentacion WHERE vehiculo_id = ?").get(vehiculoId);
}

function obtenerVenta(vehiculoId) {
  return db
    .prepare("SELECT * FROM Ventas WHERE vehiculo_id = ? ORDER BY id DESC LIMIT 1")
    .get(vehiculoId);
}

function calcularGestion(vehiculo) {
  const gastos = listarGastos(vehiculo.id);
  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  const precioCompra = vehiculo.precio_compra == null ? null : Number(vehiculo.precio_compra);
  const precioVentaEstimado = Number(
    vehiculo.precio_oferta != null ? vehiculo.precio_oferta : vehiculo.precio
  );
  const costoTotal = (precioCompra || 0) + totalGastos;
  const margen = precioVentaEstimado - costoTotal;

  return {
    gastos,
    documentacion: serializeDocumentacion(obtenerDocumentacion(vehiculo.id), vehiculo.id),
    venta: serializeVenta(obtenerVenta(vehiculo.id)),
    rentabilidad: {
      precio_venta_estimado: precioVentaEstimado,
      precio_compra: precioCompra,
      total_gastos: totalGastos,
      costo_total: costoTotal,
      margen,
      costo_completo: precioCompra != null,
    },
    dias_en_stock: diasDesde(vehiculo.fecha_ingreso),
  };
}

function serializeVehiculo(row) {
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
    ...row,
    imagenes_url: imagenes,
    equipamiento,
    destacado: !!row.destacado,
    es_0km: row.kilometraje === 0,
    eliminado: !!row.eliminado,
    origen: row.origen || "Compra",
    precio_compra: row.precio_compra ?? null,
    fecha_ingreso: row.fecha_ingreso || null,
    dias_en_stock: diasDesde(row.fecha_ingreso),
  };
}

router.get("/:id/gastos", (req, res) => {
  if (!findActivo(req.params.id)) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }
  res.json(listarGastos(req.params.id));
});

router.post("/:id/gastos", requireRole("admin"), (req, res, next) => {
  try {
    if (!findActivo(req.params.id)) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }
    const data = validateGasto(req.body);
    const result = db
      .prepare(
        `INSERT INTO Gastos (vehiculo_id, concepto, monto, fecha)
         VALUES (@vehiculo_id, @concepto, @monto, @fecha)`
      )
      .run({ ...data, vehiculo_id: req.params.id });
    const row = db.prepare("SELECT * FROM Gastos WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(serializeGasto(row));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/gastos/:gastoId", requireRole("admin"), (req, res) => {
  if (!findActivo(req.params.id)) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }
  const result = db
    .prepare("DELETE FROM Gastos WHERE id = ? AND vehiculo_id = ?")
    .run(req.params.gastoId, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Gasto no encontrado" });
  }
  res.status(204).send();
});

router.get("/:id/documentacion", (req, res) => {
  if (!findActivo(req.params.id)) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }
  res.json(serializeDocumentacion(obtenerDocumentacion(req.params.id), req.params.id));
});

router.put("/:id/documentacion", (req, res, next) => {
  try {
    if (!findActivo(req.params.id)) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }
    const data = validateDocumentacion(req.body);
    db.prepare(
      `INSERT INTO Documentacion (
         vehiculo_id, tiene_08, tiene_titulo, verificacion_policial_vto, vtv_vencimiento, updated_at
       ) VALUES (
         @vehiculo_id, @tiene_08, @tiene_titulo, @verificacion_policial_vto, @vtv_vencimiento, datetime('now')
       )
       ON CONFLICT(vehiculo_id) DO UPDATE SET
         tiene_08 = excluded.tiene_08,
         tiene_titulo = excluded.tiene_titulo,
         verificacion_policial_vto = excluded.verificacion_policial_vto,
         vtv_vencimiento = excluded.vtv_vencimiento,
         updated_at = datetime('now')`
    ).run({ ...data, vehiculo_id: req.params.id });

    res.json(serializeDocumentacion(obtenerDocumentacion(req.params.id), req.params.id));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/venta", (req, res) => {
  if (!findActivo(req.params.id)) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }
  const venta = serializeVenta(obtenerVenta(req.params.id));
  if (!venta) return res.status(404).json({ error: "Este vehículo no tiene una venta registrada" });
  res.json(venta);
});

router.post("/:id/venta", (req, res, next) => {
  try {
    const vehiculo = findActivo(req.params.id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });
    if (obtenerVenta(vehiculo.id)) {
      return res.status(409).json({ error: "Este vehículo ya tiene una venta registrada" });
    }

    const data = validateVenta(req.body);
    const registrar = db.transaction(() => {
      const insertado = db
        .prepare(
          `INSERT INTO Ventas (
             vehiculo_id, cliente_nombre, cliente_telefono, precio_venta_final, fecha_venta, fin_garantia
           ) VALUES (
             @vehiculo_id, @cliente_nombre, @cliente_telefono, @precio_venta_final, @fecha_venta, @fin_garantia
           )`
        )
        .run({ ...data, vehiculo_id: vehiculo.id });

      db.prepare(
        "UPDATE Vehiculos SET estado = 'Vendido', updated_at = datetime('now') WHERE id = ?"
      ).run(vehiculo.id);

      if (vehiculo.estado !== "Vendido") {
        db.prepare(
          `INSERT INTO HistorialEstados (vehiculo_id, estado_anterior, estado_nuevo, usuario_id)
           VALUES (?, ?, 'Vendido', ?)`
        ).run(vehiculo.id, vehiculo.estado, req.usuario && req.usuario.id);
      }

      return insertado.lastInsertRowid;
    });

    const ventaId = registrar();
    res.status(201).json(serializeVenta(db.prepare("SELECT * FROM Ventas WHERE id = ?").get(ventaId)));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/gestion", (req, res) => {
  const vehiculo = findActivo(req.params.id);
  if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });
  res.json({
    vehiculo: serializeVehiculo(vehiculo),
    ...calcularGestion(vehiculo),
  });
});

module.exports = router;
