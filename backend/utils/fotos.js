// Las fotos subidas al panel quedan en /uploads/... (solo localhost).
// El catálogo de Blogger necesita un https:// público para poder mostrarlas.
// El orden de la lista se conserva: la primera foto es la portada.

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

function idYoutube(url) {
  const texto = String(url || "");
  const match = texto.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function idVimeo(url) {
  const match = String(url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function esVideo(url) {
  const texto = String(url || "").trim().toLowerCase();
  if (!texto) return false;
  if (idYoutube(texto) || idVimeo(texto)) return true;
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/.test(texto)) return true;
  if (/drive\.google\.com\/file\/d\/[^/]+\/preview/.test(texto)) return true;
  return false;
}

function miniaturaVideo(url) {
  const yt = idYoutube(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return "";
}

function urlEmbedVideo(url) {
  const yt = idYoutube(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const vimeo = idVimeo(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
  const driveId = idGoogleDrive(url);
  if (driveId && esVideo(url)) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  return String(url || "").trim();
}

function normalizarUrlVideo(url) {
  const texto = String(url || "").trim();
  if (!texto) return "";
  const yt = idYoutube(texto);
  if (yt) return `https://www.youtube.com/watch?v=${yt}`;
  const driveId = idGoogleDrive(texto);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
  return texto.replace(/^http:\/\//i, "https://");
}

function normalizarUrlFoto(url) {
  const texto = String(url || "").trim();
  if (!texto) return "";
  if (esVideo(texto)) return texto;

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

function mediaParaCatalogo(urls) {
  const lista = Array.isArray(urls) ? urls : [];
  const fotos = [];
  const videos = [];
  const media = [];
  let omitidasLocales = 0;

  for (const url of lista) {
    if (esFotoLocal(url)) {
      omitidasLocales += 1;
      continue;
    }
    if (esVideo(url)) {
      const normalizada = normalizarUrlVideo(url);
      if (!esUrlPublica(normalizada)) continue;
      const item = {
        tipo: "video",
        url: normalizada,
        thumbnail: miniaturaVideo(url),
        embed: urlEmbedVideo(url),
      };
      videos.push(item);
      media.push(item);
      continue;
    }
    const normalizada = normalizarUrlFoto(url);
    if (esUrlPublica(normalizada)) {
      fotos.push(normalizada);
      media.push({ tipo: "foto", url: normalizada, thumbnail: normalizada });
    }
  }

  return { fotos, videos, media, omitidasLocales };
}

function fotosParaCatalogo(urls) {
  const resultado = mediaParaCatalogo(urls);
  return { fotos: resultado.fotos, omitidasLocales: resultado.omitidasLocales };
}

function portadaDe(urls) {
  const lista = Array.isArray(urls) ? urls : [];
  for (const url of lista) {
    if (esVideo(url)) {
      const thumb = miniaturaVideo(url);
      if (thumb) return thumb;
      continue;
    }
    if (String(url || "").trim()) return url;
  }
  return "";
}

module.exports = {
  esFotoLocal,
  esUrlPublica,
  esVideo,
  idGoogleDrive,
  idYoutube,
  idVimeo,
  miniaturaVideo,
  urlEmbedVideo,
  normalizarUrlFoto,
  normalizarUrlVideo,
  mediaParaCatalogo,
  fotosParaCatalogo,
  portadaDe,
};
