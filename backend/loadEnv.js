const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", ".env");

function parseEnv(contenido) {
  const vars = {};
  for (const linea of String(contenido || "").split(/\r?\n/)) {
    const texto = linea.trim();
    if (!texto || texto.startsWith("#")) continue;
    const igual = texto.indexOf("=");
    if (igual <= 0) continue;
    const clave = texto.slice(0, igual).trim();
    let valor = texto.slice(igual + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    vars[clave] = valor;
  }
  return vars;
}

function loadEnv({ filePath = ENV_PATH, env = process.env } = {}) {
  if (!fs.existsSync(filePath)) return { loaded: false, keys: [] };
  const parsed = parseEnv(fs.readFileSync(filePath, "utf8"));
  const keys = [];
  for (const [clave, valor] of Object.entries(parsed)) {
    if (env[clave] === undefined || env[clave] === "") {
      env[clave] = valor;
      keys.push(clave);
    }
  }
  return { loaded: true, keys };
}

module.exports = { ENV_PATH, parseEnv, loadEnv };
