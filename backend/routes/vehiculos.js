const express = require("express");
const { db } = require("../db");
const { validateVehiculo, validateEstado } = require("../validators/vehiculo");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

const CAMPOS_ORDEN = new Set(["marca", "anio", "kilometraje", "precio", "created_at"]);
const PAGINA_TAMANIO_DEFAULT = 24;
const PAGINA_TAMANIO_MAX = 100;

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
    eliminado: !!row.eliminado,
  };
}

function findById(id, { incluirEliminados = false } = {}) {
  const row = db.prepare("SELECT * FROM Vehiculos WHERE id = ?").get(id);
  if (!row) return null;
  if (row.eliminado && !incluirEliminados) return null;
  return row;
}

function registrarCambioEstado({ vehiculoId, estadoAnterior, estadoNuevo, usuarioId }) {
  if (estadoAnterior === estadoNuevo) return;
  db.prepare(
    `INSERT INTO HistorialEstados (vehiculo_id, estado_anterior, estado_nuevo, usuario_id)
     VALUES (?, ?, ?, ?)`
  ).run(vehiculoId, estadoAnterior, estadoNuevo, usuarioId ?? null);
}

function construirFiltro(req) {
  const { q, estado, km, papelera } = req.query;
  const clauses = [`eliminado = ${papelera === "1" ? 1 : 0}`];
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

  return { where: `WHERE ${clauses.join(" AND ")}`, params };
}

function construirPaginacion(req) {
  const pagina = Math.max(1, Number.parseInt(req.query.pagina, 10) || 1);
  const porPaginaSolicitado = Number.parseInt(req.query.porPagina, 10) || PAGINA_TAMANIO_DEFAULT;
  const porPagina = Math.min(Math.max(1, porPaginaSolicitado), PAGINA_TAMANIO_MAX);
  return { pagina, porPagina, offset: (pagina - 1) * porPagina };
}

function construirOrden(req) {
  const campo = CAMPOS_ORDEN.has(req.query.orden) ? req.query.orden : "created_at";
  const direccion = req.query.direccion === "asc" ? "ASC" : "DESC";
  return `ORDER BY ${campo} ${direccion}, id ${direccion}`;
}

// Debe declararse antes de "/:id" para no ser interpretado como un id.
router.get("/resumen", (_req, res) => {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) AS disponibles,
         SUM(CASE WHEN estado = 'Reservado' THEN 1 ELSE 0 END) AS reservados,
         SUM(CASE WHEN estado = 'Vendido'   THEN 1 ELSE 0 END) AS vendidos,
         SUM(CASE WHEN moneda = 'ARS' AND estado != 'Vendido' THEN precio ELSE 0 END) AS valor_stock_ars,
         SUM(CASE WHEN moneda = 'USD' AND estado != 'Vendido' THEN precio ELSE 0 END) AS valor_stock_usd
       FROM Vehiculos
       WHERE eliminado = 0`
    )
    .get();

  res.json({
    total: row.total || 0,
    disponibles: row.disponibles || 0,
    reservados: row.reservados || 0,
    vendidos: row.vendidos || 0,
    valor_stock_ars: row.valor_stock_ars || 0,
    valor_stock_usd: row.valor_stock_usd || 0,
  });
});

router.get("/export.csv", (req, res) => {
  const { where, params } = construirFiltro(req);
  const orden = construirOrden(req);
  const rows = db.prepare(`SELECT * FROM Vehiculos ${where} ${orden}`).all(params);

  const columnas = [
    "id", "marca", "modelo", "anio", "dominio", "kilometraje",
    "precio", "moneda", "estado", "notas", "created_at", "updated_at",
  ];
  const escaparCsv = (valor) => {
    const texto = String(valor ?? "");
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const lineas = [columnas.join(",")];
  for (const row of rows) {
    lineas.push(columnas.map((campo) => escaparCsv(row[campo])).join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="stock.csv"');
  res.send(lineas.join("\n"));
});

router.get("/", (req, res) => {
  const { where, params } = construirFiltro(req);
  const orden = construirOrden(req);
  const { pagina, porPagina, offset } = construirPaginacion(req);

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM Vehiculos ${where}`).get(params);
  const rows = db
    .prepare(`SELECT * FROM Vehiculos ${where} ${orden} LIMIT @limite OFFSET @offset`)
    .all({ ...params, limite: porPagina, offset });

  res.json({
    items: rows.map(serialize),
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  });
});

router.get("/:id/historial", (req, res) => {
  if (!findById(req.params.id, { incluirEliminados: true })) {
    return res.status(404).json({ error: "Vehículo no encontrado" });
  }

  const historial = db
    .prepare(
      `SELECT HistorialEstados.id, HistorialEstados.estado_anterior, HistorialEstados.estado_nuevo,
              HistorialEstados.creado_at, Usuarios.username
       FROM HistorialEstados
       LEFT JOIN Usuarios ON Usuarios.id = HistorialEstados.usuario_id
       WHERE vehiculo_id = ?
       ORDER BY HistorialEstados.creado_at DESC, HistorialEstados.id DESC`
    )
    .all(req.params.id);

  res.json(historial);
});

router.get("/:id", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Vehículo no encontrado" });
  res.json(serialize(row));
});

router.post("/", requireRole("admin"), (req, res, next) => {
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

    registrarCambioEstado({
      vehiculoId: result.lastInsertRowid,
      estadoAnterior: null,
      estadoNuevo: data.estado,
      usuarioId: req.usuario && req.usuario.id,
    });

    res.status(201).json(serialize(findById(result.lastInsertRowid)));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireRole("admin"), (req, res, next) => {
  try {
    const existente = findById(req.params.id);
    if (!existente) return res.status(404).json({ error: "Vehículo no encontrado" });

    const data = validateVehiculo(req.body);
    db.prepare(
      `UPDATE Vehiculos SET
         marca = @marca, modelo = @modelo, anio = @anio, dominio = @dominio,
         kilometraje = @kilometraje, precio = @precio, moneda = @moneda,
         estado = @estado, imagenes_url = @imagenes_url, notas = @notas,
         updated_at = datetime('now')
       WHERE id = @id`
    ).run({ ...data, id: req.params.id });

    registrarCambioEstado({
      vehiculoId: req.params.id,
      estadoAnterior: existente.estado,
      estadoNuevo: data.estado,
      usuarioId: req.usuario && req.usuario.id,
    });

    res.json(serialize(findById(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// Acción rápida: cambiar únicamente el estado sin pasar por el formulario completo.
// Disponible para admin y vendedor: es la tarea diaria más común del vendedor.
router.patch("/:id/estado", (req, res, next) => {
  try {
    const existente = findById(req.params.id);
    if (!existente) return res.status(404).json({ error: "Vehículo no encontrado" });

    const estado = validateEstado(req.body);
    db.prepare(
      "UPDATE Vehiculos SET estado = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(estado, req.params.id);

    registrarCambioEstado({
      vehiculoId: req.params.id,
      estadoAnterior: existente.estado,
      estadoNuevo: estado,
      usuarioId: req.usuario && req.usuario.id,
    });

    res.json(serialize(findById(req.params.id)));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/restaurar", requireRole("admin"), (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM Vehiculos WHERE id = ?").get(req.params.id);
    if (!row || !row.eliminado) {
      return res.status(404).json({ error: "Vehículo no encontrado en la papelera" });
    }

    db.prepare(
      "UPDATE Vehiculos SET eliminado = 0, eliminado_en = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(req.params.id);

    res.json(serialize(findById(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// Elimina definitivamente un vehículo que ya estaba en la papelera.
router.delete("/:id/permanente", requireRole("admin"), (req, res) => {
  const result = db
    .prepare("DELETE FROM Vehiculos WHERE id = ? AND eliminado = 1")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Vehículo no encontrado en la papelera" });
  }
  res.status(204).send();
});

// Borrado lógico: el vehículo pasa a la papelera y puede restaurarse.
router.delete("/:id", requireRole("admin"), (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Vehículo no encontrado" });

  db.prepare(
    "UPDATE Vehiculos SET eliminado = 1, eliminado_en = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(req.params.id);

  res.status(204).send();
});

module.exports = router;
