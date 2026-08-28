const express = require("express");
const { db } = require("../db");
const { validateVehiculo } = require("../validators/vehiculo");
const { publicarEnGist, obtenerGistActual, mapearVehiculoDesdeGist } = require("../sync/gist");
const { credencialesGist } = require("../utils/gistConfig");

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
    direccion: row.direccion || "",
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

    const credenciales = credencialesGist();
    const resultado = await publicarEnGist({
      gistId: credenciales.gistId,
      token: credenciales.token,
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
    let status = err.status || 500;
    if (status === 401 || status === 403) status = 502;
    res.status(status).json({ error: err.message || "No se pudo publicar" });
  }
});

const COLUMNAS_VEHICULO = [
  "marca", "modelo", "anio", "dominio", "kilometraje", "precio", "precio_oferta", "moneda", "estado",
  "imagenes_url", "notas", "version", "combustible", "transmision", "traccion",
  "puertas", "color", "motor", "potencia", "carroceria", "destacado", "equipamiento",
  "origen", "precio_compra", "fecha_ingreso",
];

function slugDominioParte(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);
}

function generarDominioTemporal(marca, modelo, anio, usados) {
  const modeloSlug = slugDominioParte(modelo) || slugDominioParte(marca) || "SINPAT";
  const anioParte = String(anio || "").replace(/\D/g, "").slice(0, 4) || "0000";
  const base = `SD-${modeloSlug}-${anioParte}`;
  let candidato = base;
  let n = 1;
  while (
    usados.has(candidato) ||
    db.prepare("SELECT id FROM Vehiculos WHERE dominio = ? COLLATE NOCASE AND eliminado = 0").get(candidato)
  ) {
    n += 1;
    candidato = `${base}-${n}`;
  }
  usados.add(candidato);
  return candidato;
}

function registrarCambioEstado({ vehiculoId, estadoAnterior, estadoNuevo, usuarioId }) {
  if (estadoAnterior === estadoNuevo) return;
  db.prepare(
    `INSERT INTO HistorialEstados (vehiculo_id, estado_anterior, estado_nuevo, usuario_id)
     VALUES (?, ?, ?, ?)`
  ).run(vehiculoId, estadoAnterior, estadoNuevo, usuarioId ?? null);
}

function completarConfigDesdeGist(site) {
  if (!site || typeof site !== "object") return false;
  const actual = db.prepare("SELECT * FROM ConfiguracionSitio WHERE id = 1").get() || {};
  const vacio = (valor) => !String(valor || "").trim();
  db.prepare(
    `UPDATE ConfiguracionSitio SET
       nombre = @nombre, tagline = @tagline, whatsapp = @whatsapp,
       instagram = @instagram, facebook = @facebook,
       contacto_titulo = @contactoTitulo, contacto_texto = @contactoTexto,
       direccion = @direccion,
       footer_text = @footerText, hero_image = @heroImage,
       updated_at = datetime('now')
     WHERE id = 1`
  ).run({
    nombre: vacio(actual.nombre) ? String(site.name || "").trim() : actual.nombre,
    tagline: vacio(actual.tagline) ? String(site.tagline || "").trim() : actual.tagline,
    whatsapp: vacio(actual.whatsapp) ? String(site.whatsapp || "").trim() : actual.whatsapp,
    instagram: vacio(actual.instagram) ? String(site.instagram || "").trim() : actual.instagram,
    facebook: vacio(actual.facebook) ? String(site.facebook || "").trim() : actual.facebook,
    contactoTitulo: vacio(actual.contacto_titulo) || actual.contacto_titulo === "Contactanos"
      ? String(site.contactoTitulo || actual.contacto_titulo || "Contactanos").trim()
      : actual.contacto_titulo,
    contactoTexto: vacio(actual.contacto_texto) ? String(site.contactoTexto || "").trim() : actual.contacto_texto,
    direccion: vacio(actual.direccion) ? String(site.direccion || "").trim() : actual.direccion,
    footerText: vacio(actual.footer_text) ? String(site.footerText || "").trim() : actual.footer_text,
    heroImage: vacio(actual.hero_image) ? String(site.heroImage || "").trim() : actual.hero_image,
  });
  return true;
}

router.post("/traer", async (req, res) => {
  try {
    const credenciales = credencialesGist();
    if (!credenciales.gistId) {
      return res.status(400).json({
        error: "Falta el ID del Gist. Pegalo en Configuración del sitio.",
      });
    }

    const stock = await obtenerGistActual({
      gistId: credenciales.gistId,
      token: credenciales.token,
    });
    const vehiculosGist = Array.isArray(stock.vehicles) ? stock.vehicles : [];
    if (!vehiculosGist.length) {
      return res.status(400).json({ error: "El Gist no tiene vehículos para traer" });
    }

    completarConfigDesdeGist(stock.site);

    const usados = new Set();
    const resultado = { creados: 0, actualizados: 0, errores: [], avisos: [] };

    vehiculosGist.forEach((vehiculoGist, i) => {
      const numero = i + 1;
      try {
        const mapeado = mapearVehiculoDesdeGist(vehiculoGist);
        let dominio = String(mapeado.dominio || "").trim().toUpperCase();
        if (!dominio) {
          dominio = generarDominioTemporal(mapeado.marca, mapeado.modelo, mapeado.anio, usados);
          resultado.avisos.push({
            fila: numero,
            dominio,
            mensaje: `Sin patente: se asignó ${dominio}`,
          });
        } else {
          usados.add(dominio);
        }

        const existente = db
          .prepare("SELECT * FROM Vehiculos WHERE dominio = ? COLLATE NOCASE AND eliminado = 0")
          .get(dominio);

        const body = { ...mapeado, dominio };
        if (!body.fecha_ingreso) delete body.fecha_ingreso;
        if (existente && (!body.imagenes_url || body.imagenes_url.length === 0)) {
          body.imagenes_url = existente.imagenes_url;
        }

        const data = validateVehiculo(body, { existente });

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
      } catch (err) {
        const detalle = Array.isArray(err.errors) ? err.errors.join("; ") : err.message || "Error desconocido";
        resultado.errores.push({
          fila: numero,
          dominio: (vehiculoGist && (vehiculoGist.patente || vehiculoGist.dominio)) || "(sin patente)",
          error: detalle,
        });
      }
    });

    res.json({
      ok: true,
      ...resultado,
      vehiculosEnGist: vehiculosGist.length,
    });
  } catch (err) {
    let status = err.status || 500;
    if (status === 401 || status === 403) status = 502;
    res.status(status).json({ error: err.message || "No se pudo traer el stock del Gist" });
  }
});

module.exports = router;
