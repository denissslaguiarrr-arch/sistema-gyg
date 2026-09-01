/* Helpers de fotos/videos para el panel y la ficha (sin require). */
(function (global) {
  function esFotoLocal(url) {
    const texto = String(url || "").trim();
    return texto.startsWith("/uploads/") || /localhost|127\.0\.0\.1/i.test(texto);
  }

  function idGoogleDrive(url) {
    const texto = String(url || "");
    const porPath = texto.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (porPath) return porPath[1];
    const porQuery = texto.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return porQuery ? porQuery[1] : null;
  }

  function idYoutube(url) {
    const match = String(url || "").match(
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
    if (yt) return "https://img.youtube.com/vi/" + yt + "/hqdefault.jpg";
    return "";
  }

  function urlEmbedVideo(url) {
    const yt = idYoutube(url);
    if (yt) return "https://www.youtube.com/embed/" + yt;
    const vimeo = idVimeo(url);
    if (vimeo) return "https://player.vimeo.com/video/" + vimeo;
    const driveId = idGoogleDrive(url);
    if (driveId && esVideo(url)) {
      return "https://drive.google.com/file/d/" + driveId + "/preview";
    }
    return String(url || "").trim();
  }

  function normalizarUrlImgur(url) {
    const texto = String(url || "").trim();
    if (!/imgur\.com/i.test(texto)) return "";
    if (/imgur\.com\/(?:a|gallery|t|user|hot|new|upload)\b/i.test(texto)) return "";
    const directo = texto.match(/i\.imgur\.com\/([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)?/i);
    const pagina = directo || texto.match(/imgur\.com\/(?:download\/)?([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)?/i);
    if (!pagina) return "";
    const reservados = { a: 1, gallery: 1, t: 1, upload: 1, signin: 1, privacy: 1, tos: 1, help: 1, meme: 1 };
    if (reservados[pagina[1].toLowerCase()]) return "";
    const ext = (pagina[2] || ".jpg").replace(/^\./, "");
    return "https://i.imgur.com/" + pagina[1] + "." + ext;
  }

  function normalizarUrlFoto(url) {
    const texto = String(url || "").trim();
    if (!texto) return "";
    if (esVideo(texto)) return texto;
    const imgur = normalizarUrlImgur(texto);
    if (imgur) return imgur;
    const drive = idGoogleDrive(texto);
    if (/drive\.google\.com/i.test(texto) && drive) {
      return "https://drive.google.com/thumbnail?id=" + drive + "&sz=w2000";
    }
    return texto;
  }

  function normalizarUrlVideo(url) {
    const texto = String(url || "").trim();
    if (!texto) return "";
    const yt = idYoutube(texto);
    if (yt) return "https://www.youtube.com/watch?v=" + yt;
    const drive = idGoogleDrive(texto);
    if (drive) return "https://drive.google.com/file/d/" + drive + "/preview";
    return texto;
  }

  function miniaturaDe(url) {
    if (esVideo(url)) return miniaturaVideo(url);
    return normalizarUrlFoto(url);
  }

  function portadaDe(urls) {
    const lista = Array.isArray(urls) ? urls : [];
    for (let i = 0; i < lista.length; i += 1) {
      const url = lista[i];
      if (esVideo(url)) {
        const thumb = miniaturaVideo(url);
        if (thumb) return thumb;
        continue;
      }
      if (String(url || "").trim()) return url;
    }
    return "";
  }

  function describirMedia(url) {
    if (esVideo(url)) {
      const embed = urlEmbedVideo(url);
      const esIframe = /youtube\.com\/embed|vimeo\.com\/video|drive\.google\.com/.test(embed);
      return {
        tipo: esIframe ? "iframe" : "video",
        src: embed,
        thumbnail: miniaturaVideo(url),
        esVideo: true,
      };
    }
    return { tipo: "img", src: normalizarUrlFoto(url), thumbnail: normalizarUrlFoto(url), esVideo: false };
  }

  global.GygMedia = {
    esFotoLocal,
    esVideo,
    idYoutube,
    miniaturaDe,
    miniaturaVideo,
    normalizarUrlFoto,
    normalizarUrlVideo,
    urlEmbedVideo,
    portadaDe,
    describirMedia,
  };
})(window);
