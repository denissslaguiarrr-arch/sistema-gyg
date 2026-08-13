const crypto = require("crypto");
const { db } = require("./db");

const SESSION_COOKIE = "gyg_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días
const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return hashBuffer.length === derived.length && crypto.timingSafeEqual(hashBuffer, derived);
}

// Crea el usuario administrador inicial si todavía no hay ninguno.
// Devuelve las credenciales generadas (solo la primera vez) o null si ya existía un usuario.
function ensureDefaultAdmin() {
  const total = db.prepare("SELECT COUNT(*) AS total FROM Usuarios").get().total;
  if (total > 0) return null;

  const username = process.env.GYG_ADMIN_USER || "admin";
  const passwordDefinidaPorEnv = Boolean(process.env.GYG_ADMIN_PASSWORD);
  const password = process.env.GYG_ADMIN_PASSWORD || "admin123";

  db.prepare("INSERT INTO Usuarios (username, password_hash) VALUES (?, ?)").run(
    username,
    hashPassword(password)
  );

  return { username, password, passwordDefinidaPorEnv };
}

function crearSesion(usuarioId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare("INSERT INTO Sesiones (token, usuario_id, expira_en) VALUES (?, ?, ?)").run(
    token,
    usuarioId,
    expiraEn
  );
  return { token, expiraEn, maxAgeMs: SESSION_TTL_MS };
}

function obtenerSesion(token) {
  if (!token) return null;

  const sesion = db
    .prepare(
      `SELECT Sesiones.token, Sesiones.expira_en, Usuarios.id AS usuario_id, Usuarios.username
       FROM Sesiones
       JOIN Usuarios ON Usuarios.id = Sesiones.usuario_id
       WHERE Sesiones.token = ?`
    )
    .get(token);

  if (!sesion) return null;

  if (new Date(sesion.expira_en).getTime() < Date.now()) {
    db.prepare("DELETE FROM Sesiones WHERE token = ?").run(token);
    return null;
  }

  return sesion;
}

function destruirSesion(token) {
  if (!token) return;
  db.prepare("DELETE FROM Sesiones WHERE token = ?").run(token);
}

function limpiarSesionesExpiradas() {
  db.prepare("DELETE FROM Sesiones WHERE expira_en < datetime('now')").run();
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  hashPassword,
  verifyPassword,
  ensureDefaultAdmin,
  crearSesion,
  obtenerSesion,
  destruirSesion,
  limpiarSesionesExpiradas,
};
