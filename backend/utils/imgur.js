const IMGUR_PLACEHOLDER = "TU_IMGUR_CLIENT_ID";

function clientIdImgur() {
  const desdeEnv = String(process.env.GYG_IMGUR_CLIENT_ID || "").trim();
  if (desdeEnv && desdeEnv !== IMGUR_PLACEHOLDER) return desdeEnv;
  return "";
}

function imgurConfigurado() {
  return Boolean(clientIdImgur());
}

async function subirBufferAImgur(buffer, { filename = "foto.jpg", fetchImpl = fetch } = {}) {
  const clientId = clientIdImgur();
  if (!clientId) {
    const err = new Error(
      "Imgur ya no registra Client ID para apps nuevas. Pegá un link https de la foto (imgur.com o Google Drive) o dejá que se guarde en este panel."
    );
    err.status = 400;
    throw err;
  }

  const res = await fetchImpl("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: `Client-ID ${clientId}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: Buffer.from(buffer).toString("base64"),
      type: "base64",
      name: filename,
    }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_err) {
    data = {};
  }

  const link = data && data.data && data.data.link;
  if (!res.ok || !link) {
    const detalle =
      (data.data && (data.data.error || data.data.message)) || `Imgur respondió ${res.status}`;
    const err = new Error(`No se pudo subir la imagen a Imgur: ${detalle}`);
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }

  return link;
}

module.exports = {
  IMGUR_PLACEHOLDER,
  clientIdImgur,
  imgurConfigurado,
  subirBufferAImgur,
};
