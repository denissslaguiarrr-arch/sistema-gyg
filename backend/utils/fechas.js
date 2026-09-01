const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function hoyIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseFechaIso(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { vacio: true, valor: null };
  }
  const texto = String(value).trim().slice(0, 10);
  const match = FECHA_ISO.exec(texto);
  if (!match) return { error: true, valor: null };
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return { error: true, valor: null };
  }
  return { vacio: false, error: false, valor: texto };
}

function masMeses(iso, meses) {
  const parsed = parseFechaIso(iso);
  if (!parsed.valor) return null;
  const [y, m, d] = parsed.valor.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + meses);
  return dt.toISOString().slice(0, 10);
}

function diasDesde(fechaIso) {
  const parsed = parseFechaIso(fechaIso);
  if (!parsed.valor) return null;
  const inicio = Date.parse(`${parsed.valor}T00:00:00Z`);
  const hoy = Date.parse(`${hoyIso()}T00:00:00Z`);
  return Math.max(0, Math.round((hoy - inicio) / 86400000));
}

function diasHasta(fechaIso) {
  const parsed = parseFechaIso(fechaIso);
  if (!parsed.valor) return null;
  const fin = Date.parse(`${parsed.valor}T00:00:00Z`);
  const hoy = Date.parse(`${hoyIso()}T00:00:00Z`);
  return Math.round((fin - hoy) / 86400000);
}

module.exports = {
  hoyIso,
  parseFechaIso,
  masMeses,
  diasDesde,
  diasHasta,
};
