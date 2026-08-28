const express = require("express");
const multer = require("multer");
const { db } = require("../db");
const { validateVehiculo, validateEstado } = require("../validators/vehiculo");
const requireRole = require("../middleware/requireRole");
const { parseCsvFlexible, esFilaDeEncabezados, alinearColumnas, normalizarEncabezado, listaATextoCsv } = require("../utils/csv");
const { esFotoLocal } = require("../utils/fotos");
const { diasDesde } = require("../utils/fechas");
const erpRouter = require("./erp");

const router = express.Router();
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const CAMPOS_ORDEN = new Set(["marca", "anio", "kilometraje", "precio", "created_at"]);
const PAGINA_TAMANIO_DEFAULT = 24;
const PAGINA_TAMANIO_MAX = 100;

// Columnas que se cargan/editan a través del formulario. Se centralizan acá
// para armar los INSERT/UPDATE sin repetir la lista en cada ruta.
const COLUMNAS_VEHICULO = [
  "marca", "modelo", "anio", "dominio", "kilometraje", "precio", "precio_oferta", "moneda", "estado",
  "imagenes_url", "notas", "version", "combustible", "transmision", "traccion",
  "puertas", "color", "motor", "potencia", "carroceria", "destacado", "equipamiento",
  "origen", "precio_compra", "fecha_ingreso",
];

// Encabezados aceptados por columna, ya normalizados (minúsculas, sin acentos).
// Permite que el CSV venga de una planilla armada por alguien que use "patente"
// en vez de "dominio", "km" en vez de "kilometraje", etc.
const ALIAS_COLUMNAS = {
  marca: ["marca"],
  modelo: ["modelo"],
  anio: ["anio", "ano"],
  dominio: ["dominio", "patente"],
  kilometraje: ["kilometraje", "km", "kms"],
  precio: ["precio"],
  precio_oferta: ["precio_oferta", "preciooferta", "precio oferta", "oferta"],
  moneda: ["moneda"],
  estado: ["estado"],
  notas: ["notas", "detalle", "detalles", "descripcion"],
  imagenes_url: ["imagenes_url", "imagenes", "fotos", "imagen"],
  version: ["version"],
  combustible: ["combustible"],
  transmision: ["transmision"],
  traccion: ["traccion"],
  puertas: ["puertas"],
  color: ["color"],
  motor: ["motor"],
  potencia: ["potencia"],
  carroceria: ["carroceria", "carrocería"],
  destacado: ["destacado"],
  equipamiento: ["equipamiento", "equipo", "extras"],
  origen: ["origen"],
  precio_compra: ["precio_compra", "preciocompra", "precio compra", "costo", "precio costo"],
  fecha_ingreso: ["fecha_ingreso", "fechaingreso", "fecha ingreso", "ingreso"],
};

const COLUMNAS_EXPORT = [
  "id", "marca", "modelo", "anio", "dominio", "kilometraje", "precio", "precio_oferta", "moneda", "estado",
  "notas", "imagenes_url", "version", "combustible", "transmision", "traccion", "puertas", "color", "motor",
  "potencia", "carroceria", "destacado", "origen", "precio_compra", "fecha_ingreso",
  "created_at", "updated_at",
];

const COLUMNAS_PLANTILLA = [
  "marca", "modelo", "anio", "dominio", "kilometraje", "precio", "precio_oferta", "moneda", "estado",
  "notas", "imagenes_url", "version", "combustible", "transmision", "traccion", "puertas", "color",
  "motor", "potencia", "carroceria", "destacado", "equipamiento", "origen", "precio_compra", "fecha_ingreso",
];

function indiceDesdeEncabezados(encabezados) {
  const indice = {};
  for (const [campo, alias] of Object.entries(ALIAS_COLUMNAS)) {
    const posicion = encabezados.findIndex((h) => alias.includes(h));
    if (posicion !== -1) indice[campo] = posicion;
  }
  return indice;
}

function encabezadosPorDefecto(primeraFila) {
  const primera = String((primeraFila && primeraFila[0]) || "").trim();
  const columnas = /^\d+$/.test(primera) ? COLUMNAS_EXPORT : COLUMNAS_PLANTILLA;
  return columnas.map(normalizarEncabezado);
}

function slugDominioParte(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);
}

function dominioYaUsado(candidato, usadosEnEsteArchivo) {
  if (usadosEnEsteArchivo.has(candidato)) return true;
  return !!db
    .prepare("SELECT id FROM Vehiculos WHERE dominio = ? COLLATE NOCASE AND eliminado = 0")
    .get(candidato);
}

function generarDominioTemporal(marca, modelo, anio, usadosEnEsteArchivo) {
  const modeloSlug = slugDominioParte(modelo) || slugDominioParte(marca) || "SINPAT";
  const anioParte = String(anio || "").replace(/\D/g, "").slice(0, 4) || "0000";
  const base = `SD-${modeloSlug}-${anioParte}`;
  let candidato = base;
  let n = 1;
  while (dominioYaUsado(candidato, usadosEnEsteArchivo)) {
    n += 1;
    candidato = `${base}-${n}`;
  }
  usadosEnEsteArchivo.add(candidato);
  return candidato;
}

function serialize(row) {
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
  // Si hay oferta, el orden por precio usa el valor que realmente se cobra.
  const expresion = campo === "precio" ? "COALESCE(precio_oferta, precio)" : campo;
  return `ORDER BY ${expresion} ${direccion}, id ${direccion}`;
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
         SUM(CASE WHEN moneda = 'ARS' AND estado != 'Vendido' THEN COALESCE(precio_oferta, precio) ELSE 0 END) AS valor_stock_ars,
         SUM(CASE WHEN moneda = 'USD' AND estado != 'Vendido' THEN COALESCE(precio_oferta, precio) ELSE 0 END) AS valor_stock_usd
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

  const columnas = COLUMNAS_EXPORT;
  const escaparCsv = (valor) => {
    const texto = String(valor ?? "");
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const lineas = [columnas.join(",")];
  for (const row of rows) {
    lineas.push(
      columnas
        .map((campo) => {
          const valor = campo === "imagenes_url" ? listaATextoCsv(row.imagenes_url) : row[campo];
          return escaparCsv(valor);
        })
        .join(",")
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="stock.csv"');
  res.send(`\uFEFF${lineas.join("\n")}`);
});

router.get("/plantilla.csv", (_req, res) => {
  const escaparCsv = (valor) => {
    const texto = String(valor ?? "");
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const ejemplo = [
    "Toyota", "Hilux", "2024", "AB123CD", "0", "45000", "42000", "USD", "Disponible", "Único dueño",
    "https://ejemplo.com/foto1.jpg | https://ejemplo.com/foto2.jpg", "SRX 4x4", "Diesel", "Automática", "4x4", 4, "Blanco",
    "2.8L", "204cv", "Pickup", "1", "Aire acondicionado, Bluetooth, Cámara de retroceso",
    "Compra", "40000", "2026-01-15",
  ];
  const csv = [COLUMNAS_PLANTILLA.join(","), ejemplo.map(escaparCsv).join(",")].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="plantilla-vehiculos.csv"');
  res.send(csv);
});

// Importación masiva desde un CSV. Actualiza por patente si ya existe un
// vehículo activo con ese dominio; si no, lo crea. No falla todo el archivo
// por una fila con errores: reporta cuáles se pudieron procesar y cuáles no.
router.post("/import", requireRole("admin"), importUpload.single("archivo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Debés adjuntar un archivo CSV (campo 'archivo')" });
  }

  const filas = parseCsvFlexible(req.file.buffer.toString("utf8"));
  if (!filas.length) {
    return res.status(400).json({ error: "El CSV no tiene filas de datos" });
  }

  let encabezados;
  let filasDatos;
  let numeroPrimeraFila;
  if (esFilaDeEncabezados(filas[0])) {
    encabezados = filas[0].map(normalizarEncabezado);
    filasDatos = filas.slice(1);
    numeroPrimeraFila = 2;
  } else {
    encabezados = encabezadosPorDefecto(filas[0]);
    filasDatos = filas;
    numeroPrimeraFila = 1;
  }

  if (!filasDatos.length) {
    return res.status(400).json({ error: "El CSV no tiene filas de datos" });
  }

  const indice = indiceDesdeEncabezados(encabezados);
  const usadosEnEsteArchivo = new Set();
  const resultado = { creados: 0, actualizados: 0, errores: [], avisos: [] };

  filasDatos.forEach((filaCruda, i) => {
    const numeroFila = i + numeroPrimeraFila;
    if (filaCruda.every((valor) => String(valor || "").trim() === "")) return;

    const fila = alinearColumnas(filaCruda, encabezados.length);
    const obtener = (campo) => (indice[campo] !== undefined ? fila[indice[campo]] : undefined);

    try {
      let dominioBusqueda =
        typeof obtener("dominio") === "string" ? obtener("dominio").trim().toUpperCase() : "";
      let avisoDominio = null;
      if (!dominioBusqueda) {
        dominioBusqueda = generarDominioTemporal(
          obtener("marca"),
          obtener("modelo"),
          obtener("anio"),
          usadosEnEsteArchivo
        );
        avisoDominio = `Sin patente: se asignó ${dominioBusqueda}`;
      } else {
        usadosEnEsteArchivo.add(dominioBusqueda);
      }

      const existente = db
        .prepare("SELECT * FROM Vehiculos WHERE dominio = ? COLLATE NOCASE AND eliminado = 0")
        .get(dominioBusqueda);

      let imagenesValor = obtener("imagenes_url");
      if (existente && (imagenesValor === undefined || String(imagenesValor).trim() === "")) {
        imagenesValor = existente.imagenes_url;
      }

      const data = validateVehiculo({
        marca: obtener("marca"),
        modelo: obtener("modelo"),
        anio: obtener("anio"),
        dominio: dominioBusqueda,
        kilometraje: obtener("kilometraje"),
        precio: obtener("precio"),
        precio_oferta: obtener("precio_oferta"),
        moneda: obtener("moneda"),
        estado: obtener("estado"),
        notas: obtener("notas"),
        imagenes_url: imagenesValor,
        version: obtener("version"),
        combustible: obtener("combustible"),
        transmision: obtener("transmision"),
        traccion: obtener("traccion"),
        puertas: obtener("puertas"),
        color: obtener("color"),
        motor: obtener("motor"),
        potencia: obtener("potencia"),
        carroceria: obtener("carroceria"),
        destacado: obtener("destacado"),
        equipamiento: obtener("equipamiento"),
        origen: obtener("origen"),
        precio_compra: obtener("precio_compra"),
        fecha_ingreso: obtener("fecha_ingreso"),
      }, { existente });

      if (existente) {
        db.prepare(
          `UPDATE Vehiculos SET
             ${COLUMNAS_VEHICULO.map((c) => `${c} = @${c}`).join(", ")},
             updated_at = datetime('now')
           WHERE id = @id`
        ).run({ ...data, id: existente.id });

        registrarCambioEstado({
          vehiculoId: existente.id,
          estadoAnterior: existente.estado,
          estadoNuevo: data.estado,
          usuarioId: req.usuario && req.usuario.id,
        });
        resultado.actualizados += 1;
      } else {
        const insertado = db
          .prepare(
            `INSERT INTO Vehiculos (${COLUMNAS_VEHICULO.join(", ")})
             VALUES (${COLUMNAS_VEHICULO.map((c) => `@${c}`).join(", ")})`
          )
          .run(data);

        registrarCambioEstado({
          vehiculoId: insertado.lastInsertRowid,
          estadoAnterior: null,
          estadoNuevo: data.estado,
          usuarioId: req.usuario && req.usuario.id,
        });
        resultado.creados += 1;
      }

      if (avisoDominio) {
        resultado.avisos.push({
          fila: numeroFila,
          dominio: data.dominio,
          mensaje: avisoDominio,
        });
      }

      let urlsFotos = [];
      try {
        urlsFotos = JSON.parse(data.imagenes_url || "[]");
      } catch (_err) {
        urlsFotos = [];
      }
      const soloLocales = urlsFotos.length > 0 && urlsFotos.every((u) => esFotoLocal(u));
      if (soloLocales) {
        resultado.avisos.push({
          fila: numeroFila,
          dominio: data.dominio,
          mensaje:
            "Las fotos son de la otra PC (/uploads/). Copiá la carpeta public\\uploads o subí las fotos de nuevo arrastrándolas (con ImgBB se guarda el link https).",
        });
      }
    } catch (err) {
      const detalle = Array.isArray(err.errors) ? err.errors.join("; ") : err.message || "Error desconocido";
      resultado.errores.push({
        fila: numeroFila,
        dominio: obtener("dominio") || "(sin patente)",
        error: detalle,
      });
    }
  });

  res.json(resultado);
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

router.use(erpRouter);

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
        `INSERT INTO Vehiculos (${COLUMNAS_VEHICULO.join(", ")})
         VALUES (${COLUMNAS_VEHICULO.map((c) => `@${c}`).join(", ")})`
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

    const data = validateVehiculo(req.body, { existente });
    db.prepare(
      `UPDATE Vehiculos SET
         ${COLUMNAS_VEHICULO.map((c) => `${c} = @${c}`).join(", ")},
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
