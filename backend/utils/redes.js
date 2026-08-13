function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function normalizarRedSocial(valor, host) {
  let v = texto(valor);
  if (!v) return "";
  if (v.startsWith("@")) v = v.slice(1).trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${host}/${v.replace(/^\/+/, "")}`;
}

function normalizarInstagram(valor) {
  return normalizarRedSocial(valor, "www.instagram.com");
}

function normalizarFacebook(valor) {
  return normalizarRedSocial(valor, "www.facebook.com");
}

function digitosWhatsapp(valor) {
  return texto(valor).replace(/\D/g, "");
}

module.exports = {
  texto,
  normalizarRedSocial,
  normalizarInstagram,
  normalizarFacebook,
  digitosWhatsapp,
};
