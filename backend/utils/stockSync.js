const { db } = require("../db");

function leerMeta(clave) {
  const row = db.prepare("SELECT valor FROM Meta WHERE clave = ?").get(clave);
  return row ? row.valor : null;
}

function escribirMeta(clave, valor) {
  db.prepare("INSERT OR REPLACE INTO Meta (clave, valor) VALUES (?, ?)").run(clave, String(valor));
}

function marcarStockSucio() {
  escribirMeta("stock_changed_at", new Date().toISOString());
}

function estadoPublicacion() {
  const lastSync = leerMeta("last_sync_at");
  const changed = leerMeta("stock_changed_at");
  return {
    last_sync_at: lastSync,
    stock_changed_at: changed,
    stock_sucio: Boolean(changed && (!lastSync || changed > lastSync)),
  };
}

module.exports = {
  leerMeta,
  escribirMeta,
  marcarStockSucio,
  estadoPublicacion,
};
