// Credenciales para publicar stock.json. El .env gana si está; si no, se
// usan los valores pegados en Configuración del sitio. El Gist de G&G ya
// existe, así que el ID viene por defecto y en la PC solo falta el token.

const GIST_ID_DEFAULT = "74837d1c1f0a9a3a67e6dc5cc4fa5b6f";

function normalizarGistId(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  const desdeUrl = texto.match(/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]+)/i);
  if (desdeUrl) return desdeUrl[1];
  const hex = texto.match(/^[0-9a-f]{20,}$/i);
  return hex ? hex[0] : texto;
}

function credencialesGist() {
  const envGist = normalizarGistId(process.env.GYG_GIST_ID);
  const envToken = String(process.env.GYG_GITHUB_TOKEN || "").trim();

  let dbGist = "";
  let dbToken = "";
  try {
    const { db } = require("../db");
    const row = db.prepare("SELECT gist_id, github_token FROM ConfiguracionSitio WHERE id = 1").get();
    dbGist = normalizarGistId(row && row.gist_id);
    dbToken = String((row && row.github_token) || "").trim();
  } catch (_err) {
    dbGist = "";
    dbToken = "";
  }

  const token = envToken || dbToken;
  return {
    gistId: envGist || dbGist || GIST_ID_DEFAULT,
    token,
    gistIdEnEnv: Boolean(envGist),
    tokenEnEnv: Boolean(envToken),
    tokenConfigurado: Boolean(token),
  };
}

module.exports = {
  GIST_ID_DEFAULT,
  normalizarGistId,
  credencialesGist,
};
