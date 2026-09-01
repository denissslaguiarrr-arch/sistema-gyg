function claveImgbb() {
  const desdeEnv = String(process.env.GYG_IMGBB_API_KEY || "").trim();
  if (desdeEnv) return desdeEnv;
  try {
    const { db } = require("../db");
    const row = db.prepare("SELECT imgbb_api_key FROM ConfiguracionSitio WHERE id = 1").get();
    return String((row && row.imgbb_api_key) || "").trim();
  } catch (_err) {
    return "";
  }
}

function imgbbConfigurado() {
  return Boolean(claveImgbb());
}

async function subirBufferAImgbb(buffer, { filename = "foto.jpg", fetchImpl = fetch, apiKey } = {}) {
  const key = String((apiKey !== undefined ? apiKey : claveImgbb()) || "").trim();
  if (!key) {
    const err = new Error(
      "Falta la clave de ImgBB. Creala en https://api.imgbb.com/ y pegala en Configuración del sitio."
    );
    err.status = 400;
    throw err;
  }

  const body = new URLSearchParams();
  body.set("key", key);
  body.set("image", Buffer.from(buffer).toString("base64"));
  body.set("name", filename);

  const res = await fetchImpl("https://api.imgbb.com/1/upload", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_err) {
    data = {};
  }

  const link =
    (data.data && (data.data.display_url || data.data.url || (data.data.image && data.data.image.url))) || "";
  if (!res.ok || !data.success || !link) {
    const detalle = (data.error && data.error.message) || `ImgBB respondió ${res.status}`;
    const err = new Error(`No se pudo subir la imagen a ImgBB: ${detalle}`);
    err.status = res.status === 400 ? 400 : 502;
    throw err;
  }
  return link;
}

module.exports = {
  claveImgbb,
  imgbbConfigurado,
  subirBufferAImgbb,
};
