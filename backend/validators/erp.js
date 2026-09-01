const { ValidationError, parseBooleano } = require("./vehiculo");
const { hoyIso, parseFechaIso, masMeses } = require("../utils/fechas");

function validateGasto(body = {}) {
  const errors = [];
  const concepto = typeof body.concepto === "string" ? body.concepto.trim() : "";
  const monto = Number(body.monto);
  const fechaParsed = parseFechaIso(body.fecha);

  if (!concepto) errors.push("concepto es obligatorio");
  if (!Number.isFinite(monto) || monto < 0) {
    errors.push("monto debe ser un número mayor o igual a 0");
  }
  if (fechaParsed.error) errors.push("fecha debe ser YYYY-MM-DD");

  if (errors.length) throw new ValidationError(errors);

  return {
    concepto,
    monto,
    fecha: fechaParsed.vacio ? hoyIso() : fechaParsed.valor,
  };
}

function validateDocumentacion(body = {}) {
  const errors = [];
  const policial = parseFechaIso(body.verificacion_policial_vto);
  const vtv = parseFechaIso(body.vtv_vencimiento);

  if (policial.error) errors.push("verificacion_policial_vto debe ser YYYY-MM-DD (o vacío)");
  if (vtv.error) errors.push("vtv_vencimiento debe ser YYYY-MM-DD (o vacío)");
  if (errors.length) throw new ValidationError(errors);

  return {
    tiene_08: parseBooleano(body.tiene_08) ? 1 : 0,
    tiene_titulo: parseBooleano(body.tiene_titulo) ? 1 : 0,
    verificacion_policial_vto: policial.vacio ? null : policial.valor,
    vtv_vencimiento: vtv.vacio ? null : vtv.valor,
  };
}

function validateVenta(body = {}) {
  const errors = [];
  const cliente_nombre = typeof body.cliente_nombre === "string" ? body.cliente_nombre.trim() : "";
  const cliente_telefono =
    typeof body.cliente_telefono === "string" ? body.cliente_telefono.trim() : "";
  const precio = Number(body.precio_venta_final);
  const fechaParsed = parseFechaIso(body.fecha_venta);
  const garantiaParsed = parseFechaIso(body.fin_garantia);

  if (!cliente_nombre) errors.push("cliente_nombre es obligatorio");
  if (!Number.isFinite(precio) || precio < 0) {
    errors.push("precio_venta_final debe ser un número mayor o igual a 0");
  }
  if (fechaParsed.error) errors.push("fecha_venta debe ser YYYY-MM-DD");
  if (garantiaParsed.error) errors.push("fin_garantia debe ser YYYY-MM-DD (o vacío)");

  if (errors.length) throw new ValidationError(errors);

  const fecha_venta = fechaParsed.vacio ? hoyIso() : fechaParsed.valor;
  const fin_garantia = garantiaParsed.vacio ? masMeses(fecha_venta, 3) : garantiaParsed.valor;

  return {
    cliente_nombre,
    cliente_telefono,
    precio_venta_final: precio,
    fecha_venta,
    fin_garantia,
  };
}

module.exports = {
  validateGasto,
  validateDocumentacion,
  validateVenta,
};
