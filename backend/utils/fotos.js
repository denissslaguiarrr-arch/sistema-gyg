// Las fotos subidas al panel quedan en /uploads/... (solo localhost).
// El catálogo de Blogger necesita un https:// público para poder mostrarlas.

function esFotoLocal(url) {
  const texto = String(url || "").trim();
  if (!texto) return false;
  if (texto.startsWith("/uploads/")) return true;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\//i.test(texto);
}

function idGoogleDrive(url) {
  const texto = String(url || "");
  const porPath = texto.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (porPath) return porPath[1];
  const porQuery = texto.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return porQuery ? porQuery[1] : null;
}

function normalizarUrlFoto(url) {
  const texto = String(url || "").trim();
  if (!texto) return "";

  const driveId = idGoogleDrive(texto);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`;
  }

  return texto.replace(/^http:\/\//i, "https://");
}

function esUrlPublica(url) {
  const texto = String(url || "").trim();
  if (!texto) return false;
  if (esFotoLocal(texto)) return false;
  try {
    const parsed = new URL(texto);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1";
  } catch (_err) {
    return false;
  }
}

function fotosParaCatalogo(urls) {
  const lista = Array.isArray(urls) ? urls : [];
  const fotos = [];
  let omitidasLocales = 0;

  for (const url of lista) {
    if (esFotoLocal(url)) {
      omitidasLocales += 1;
      continue;
    }
    const normalizada = normalizarUrlFoto(url);
    if (esUrlPublica(normalizada)) fotos.push(normalizada);
  }

  return { fotos, omitidasLocales };
}

module.exports = {
  esFotoLocal,
  esUrlPublica,
  idGoogleDrive,
  normalizarUrlFoto,
  fotosParaCatalogo,
};
