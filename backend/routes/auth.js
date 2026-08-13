const express = require("express");
const { db } = require("../db");
const {
  verifyPassword,
  hashPassword,
  crearSesion,
  destruirSesion,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} = require("../auth");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: SESSION_TTL_MS,
};

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  const usuario = db
    .prepare("SELECT * FROM Usuarios WHERE username = ?")
    .get(String(username).trim());

  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const { token } = crearSesion(usuario.id);
  res.cookie(SESSION_COOKIE, token, COOKIE_OPTS);
  res.json({ ok: true, usuario: { id: usuario.id, username: usuario.username } });
});

router.post("/logout", (req, res) => {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  destruirSesion(token);
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ usuario: req.usuario });
});

router.patch("/me/password", requireAuth, (req, res) => {
  const { passwordActual, passwordNueva } = req.body || {};
  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: "Debés indicar la contraseña actual y la nueva" });
  }
  if (String(passwordNueva).length < 6) {
    return res
      .status(400)
      .json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }

  const usuario = db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(req.usuario.id);
  if (!verifyPassword(passwordActual, usuario.password_hash)) {
    return res.status(401).json({ error: "La contraseña actual es incorrecta" });
  }

  db.prepare("UPDATE Usuarios SET password_hash = ? WHERE id = ?").run(
    hashPassword(passwordNueva),
    usuario.id
  );
  res.json({ ok: true });
});

module.exports = router;
