const { obtenerSesion, SESSION_COOKIE } = require("../auth");

function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  const sesion = obtenerSesion(token);

  if (!sesion) {
    return res.status(401).json({ error: "No autenticado" });
  }

  req.usuario = { id: sesion.usuario_id, username: sesion.username };
  next();
}

module.exports = requireAuth;
