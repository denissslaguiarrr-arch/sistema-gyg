const express = require("express");
const multer = require("multer");
const { db } = require("../db");
const requireRole = require("../middleware/requireRole");
const { ValidationError } = require("../validators/vehiculo");
const { parseCsvFlexible, esFilaDeEncabezados, normalizarEncabezado } = require("../utils/csv");
const {
  ESTADOS_USO,
  edicionActual,
  parseEdicion,
  leerConfig,
  estimarPrecio,
  buscarEnGuia,
  normalizarEstadoUso,
} = require("../utils/tasacion");

const router = express.Router();
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const COLUMNAS_GUIA = ["marca", "modelo", "version", "anio", "precio_revista", "moneda", "edicion"];

function leerMeta(clave) {
  const row = db.prepare("SELECT valor FROM Meta WHERE clave = ?").get(clave);
  return row ? row.valor : "";
}

function escribirMeta(clave, valor) {
  db.prepare("INSERT OR REPLACE INTO Meta (clave, valor) VALUES (?, ?)").run(clave, String(valor));
}

function configGuardada() {
  try {
    return leerConfig(JSON.parse(leerMeta("tasacion_config") || "{}"));
  } catch (_err) {
    return leerConfig({});
  }
}

function resumenGuia() {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total, MAX(edicion) AS edicion
         FROM GuiaPrecios`
    )
    .get();
  return {
    total: row.total || 0,
    edicion: row.edicion || "",
  };
}

function filaPublica(row) {
  return {
    id: row.id,
    marca: row.marca,
    modelo: row.modelo,
    version: row.version,
    anio: row.anio,
    precio_revista: row.precio_revista,
    moneda: row.moneda,
    edicion: row.edicion,
  };
}

function validarFilaGuia(body, { exigirId = false } = {}) {
  const errors = [];
  const marca = String(body.marca || "").trim();
  const modelo = String(body.modelo || "").trim();
  const version = String(body.version || "").trim();
  const anio = Number(body.anio);
  const precio = Number(body.precio_revista ?? body.precio);
  const moneda = String(body.moneda || "USD").trim().toUpperCase();
  const edicion = parseEdicion(body.edicion);

  if (exigirId && !Number.isInteger(Number(body.id))) errors.push("id inválido");
  if (!marca) errors.push("marca es obligatoria");
  if (!modelo) errors.push("modelo es obligatorio");
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) errors.push("anio inválido");
  if (!Number.isFinite(precio) || precio <= 0) errors.push("precio_revista debe ser mayor a 0");
  if (!["ARS", "USD"].includes(moneda)) errors.push("moneda debe ser ARS o USD");

  if (errors.length) throw new ValidationError(errors);
  return { marca, modelo, version, anio, precio_revista: precio, moneda, edicion };
}

function upsertGuia(fila) {
  const existente = db
    .prepare(
      `SELECT id FROM GuiaPrecios
        WHERE lower(marca) = lower(@marca)
          AND lower(modelo) = lower(@modelo)
          AND lower(version) = lower(@version)
          AND anio = @anio
          AND edicion = @edicion`
    )
    .get(fila);

  if (existente) {
    db.prepare(
      `UPDATE GuiaPrecios
          SET precio_revista = @precio_revista,
              moneda = @moneda,
              updated_at = datetime('now')
        WHERE id = @id`
    ).run({ ...fila, id: existente.id });
    return { id: existente.id, creado: false };
  }

  const result = db
    .prepare(
      `INSERT INTO GuiaPrecios (marca, modelo, version, anio, precio_revista, moneda, edicion)
       VALUES (@marca, @modelo, @version, @anio, @precio_revista, @moneda, @edicion)`
    )
    .run(fila);
  return { id: result.lastInsertRowid, creado: true };
}

router.get("/estado", (_req, res) => {
  res.json({
    ...resumenGuia(),
    estados: ESTADOS_USO,
    km_anio: configGuardada().km_anio,
  });
});

router.get("/config", requireRole("admin"), (_req, res) => {
  res.json(configGuardada());
});

router.put("/config", requireRole("admin"), (req, res) => {
  const actual = configGuardada();
  const proxima = leerConfig({ ...actual, ...(req.body || {}) });
  escribirMeta("tasacion_config", JSON.stringify(proxima));
  res.json(proxima);
});

router.get("/guia", requireRole("admin"), (req, res) => {
  const q = String(req.query.q || "").trim();
  let sql = `SELECT * FROM GuiaPrecios`;
  const params = [];
  if (q) {
    sql += ` WHERE marca LIKE ? OR modelo LIKE ? OR version LIKE ?`;
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY edicion DESC, marca, modelo, anio DESC, version LIMIT 80`;
  const items = db.prepare(sql).all(...params).map(filaPublica);
  res.json({ ...resumenGuia(), items });
});

router.get("/plantilla.csv", requireRole("admin"), (_req, res) => {
  const ejemplo = ["Toyota", "Hilux", "SRV 4x4", "2015", "18500", "USD", edicionActual()];
  const csv = [COLUMNAS_GUIA.join(","), ejemplo.join(",")].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="plantilla-guia-precios.csv"');
  res.send(csv);
});

router.post("/guia", requireRole("admin"), (req, res) => {
  const fila = validarFilaGuia(req.body || {});
  const result = upsertGuia(fila);
  const row = db.prepare("SELECT * FROM GuiaPrecios WHERE id = ?").get(result.id);
  res.status(result.creado ? 201 : 200).json(filaPublica(row));
});

router.delete("/guia/:id", requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id inválido" });
  const result = db.prepare("DELETE FROM GuiaPrecios WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "No está en la guía" });
  res.status(204).end();
});

router.post("/guia/import", requireRole("admin"), importUpload.single("archivo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Debés adjuntar un archivo CSV (campo 'archivo')" });
  }

  const filas = parseCsvFlexible(req.file.buffer.toString("utf8"));
  if (!filas.length) {
    return res.status(400).json({ error: "El CSV no tiene filas de datos" });
  }

  let encabezados;
  let filasDatos;
  if (esFilaDeEncabezados(filas[0])) {
    encabezados = filas[0].map(normalizarEncabezado);
    filasDatos = filas.slice(1);
  } else {
    encabezados = COLUMNAS_GUIA;
    filasDatos = filas;
  }

  const alias = {
    marca: ["marca"],
    modelo: ["modelo"],
    version: ["version", "versión", "versiones"],
    anio: ["anio", "año", "ano", "year"],
    precio_revista: ["precio_revista", "precio", "valor", "revista"],
    moneda: ["moneda"],
    edicion: ["edicion", "edición", "mes"],
  };

  function valorDe(fila, campo) {
    const nombres = alias[campo] || [campo];
    for (const nombre of nombres) {
      const idx = encabezados.indexOf(nombre);
      if (idx >= 0 && fila[idx] !== undefined) return fila[idx];
    }
    return "";
  }

  const reemplazar = String(req.query.reemplazar || req.body?.reemplazar || "1") !== "0";
  const edicionDefault = parseEdicion(req.body?.edicion);
  const errores = [];
  const validas = [];

  filasDatos.forEach((fila, i) => {
    const nro = i + (esFilaDeEncabezados(filas[0]) ? 2 : 1);
    try {
      validas.push(
        validarFilaGuia({
          marca: valorDe(fila, "marca"),
          modelo: valorDe(fila, "modelo"),
          version: valorDe(fila, "version"),
          anio: valorDe(fila, "anio"),
          precio_revista: valorDe(fila, "precio_revista"),
          moneda: valorDe(fila, "moneda") || "USD",
          edicion: valorDe(fila, "edicion") || edicionDefault,
        })
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        errores.push({ fila: nro, errores: err.errors });
      } else {
        errores.push({ fila: nro, errores: [err.message] });
      }
    }
  });

  if (!validas.length) {
    return res.status(400).json({ error: "Ninguna fila se pudo cargar", errores });
  }

  const tx = db.transaction(() => {
    if (reemplazar) db.prepare("DELETE FROM GuiaPrecios").run();
    let creados = 0;
    let actualizados = 0;
    for (const fila of validas) {
      const r = upsertGuia(fila);
      if (r.creado) creados += 1;
      else actualizados += 1;
    }
    return { creados, actualizados };
  });

  const resultado = tx();
  res.json({
    ok: true,
    ...resultado,
    omitidas: errores.length,
    errores,
    ...resumenGuia(),
  });
});

router.post("/estimar", (req, res) => {
  const body = req.body || {};
  const marca = String(body.marca || "").trim();
  const modelo = String(body.modelo || "").trim();
  const version = String(body.version || "").trim();
  const anio = Number(body.anio);
  const km = body.km === undefined || body.km === "" ? 0 : Number(body.km);
  const estado = normalizarEstadoUso(body.estado);
  const errors = [];

  if (!marca) errors.push("marca es obligatoria");
  if (!modelo) errors.push("modelo es obligatorio");
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) errors.push("anio inválido");
  if (!Number.isInteger(km) || km < 0) errors.push("km debe ser un entero mayor o igual a 0");
  if (errors.length) throw new ValidationError(errors);

  const resumen = resumenGuia();
  if (!resumen.total) {
    return res.status(409).json({
      error: "Todavía no hay precios de revista cargados. Pedile al encargado que cargue la guía de este mes.",
      ...resumen,
    });
  }

  const filas = db.prepare("SELECT * FROM GuiaPrecios").all();
  const hallado = buscarEnGuia(filas, { marca, modelo, version, anio });

  if (!hallado.encontrados.length) {
    return res.status(404).json({
      error: `No hay ${marca} ${modelo} ${anio} en la guía de este mes. El encargado lo puede agregar.`,
      ...resumen,
    });
  }

  if (hallado.necesita_version) {
    return res.json({
      necesita_version: true,
      mensaje: "Hay varias versiones de ese auto. Elegí cuál es.",
      candidatos: hallado.encontrados.map(filaPublica),
      ...resumen,
    });
  }

  const fila = hallado.encontrados[0];
  const anioActual = new Date().getFullYear();
  const estimado = estimarPrecio({
    precioRevista: fila.precio_revista,
    moneda: fila.moneda,
    anio,
    km,
    estado,
    anioActual,
    config: configGuardada(),
  });

  res.json({
    ok: true,
    necesita_version: false,
    vehiculo: { marca, modelo, version: version || fila.version, anio, km, estado },
    guia: filaPublica(fila),
    anio_cercano: hallado.anio_usado !== anio ? hallado.anio_usado : null,
    estimado,
    ...resumen,
  });
});

module.exports = router;
