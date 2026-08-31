// Credenciales para publicar stock.json. El .env gana si tiene un token
// real; un valor de ejemplo no pisa lo pegado en Configuración del sitio.

const GIST_ID_DEFAULT = "";

function normalizarGistId(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  const desdeUrl = texto.match(/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]+)/i);
  if (desdeUrl) return desdeUrl[1];
  const hex = texto.match(/^[0-9a-f]{20,}$/i);
  return hex ? hex[0] : texto;
}

// Iniciar.bat copiaba env.example con "ghp_pegá_tu_token". GitHub lo rechaza
// con 401 y, si el .env gana, pisa el token real pegado en el panel.
function tokenGithubUsable(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return false;
  if (/peg[aá]|tu_token|your.?token|changeme|placeholder|xxxx+/i.test(texto)) return false;
  return true;
}

function elegirToken(envToken, dbToken) {
  if (tokenGithubUsable(envToken)) return String(envToken).trim();
  if (tokenGithubUsable(dbToken)) return String(dbToken).trim();
  return "";
}

function credencialesGist() {
  const envGist = normalizarGistId(process.env.GYG_GIST_ID);
  const envToken = elegirToken(process.env.GYG_GITHUB_TOKEN, "");

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

  const token = elegirToken(process.env.GYG_GITHUB_TOKEN, dbToken);
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
  tokenGithubUsable,
  elegirToken,
  credencialesGist,
};
