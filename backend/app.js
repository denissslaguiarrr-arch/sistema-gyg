const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { db, DB_PATH } = require("./db");
const { obtenerSesion, SESSION_COOKIE } = require("./auth");
const authRouter = require("./routes/auth");
const vehiculosRouter = require("./routes/vehiculos");
const uploadsRouter = require("./routes/uploads");
const usuariosRouter = require("./routes/usuarios");
const publicRouter = require("./routes/public");
const configRouter = require("./routes/config");
const syncRouter = require("./routes/sync");
const tasacionRouter = require("./routes/tasacion");
const requireAuth = require("./middleware/requireAuth");
const requireRole = require("./middleware/requireRole");
const { ValidationError } = require("./validators/vehiculo");

const app = express();
const PUBLIC_DIR = path.join(__dirname, "..", "public");
// La ficha de un vehículo está pensada para compartirse con compradores
// que no tienen (ni deben tener) acceso al panel de administración.
const RUTAS_PUBLICAS = new Set([
  "/login.html",
  "/login.js",
  "/ficha.html",
  "/ficha.js",
  "/catalogo.html",
  "/catalogo.js",
  "/media.js",
  "/brand.js",
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
]);

function esRutaPublica(pathname) {
  if (RUTAS_PUBLICAS.has(pathname)) return true;
  if (pathname.startsWith("/uploads/")) return true;
  if (pathname.startsWith("/brand/")) return true;
  return false;
}

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM Vehiculos WHERE eliminado = 0")
    .get();
  res.json({
    ok: true,
    db: path.basename(DB_PATH),
    vehiculos: row.total,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/vehiculos", requireAuth, vehiculosRouter);
app.use("/api/uploads", requireAuth, requireRole("admin"), uploadsRouter);
app.use("/api/usuarios", requireAuth, requireRole("admin"), usuariosRouter);
app.use("/api/config", requireAuth, configRouter);
app.use("/api/sync", requireAuth, requireRole("admin"), syncRouter);
app.use("/api/tasacion", requireAuth, tasacionRouter);

// El resto del panel (HTML/JS/fotos subidas) requiere sesión activa;
// login.html y login.js quedan públicos para poder autenticarse.
app.use((req, res, next) => {
  // Las fotos de los vehículos también son públicas: se muestran en la ficha
  // compartible, que no requiere sesión.
  if (esRutaPublica(req.path)) return next();

  const token = req.cookies ? req.cookies[SESSION_COOKIE] : undefined;
  const sesion = obtenerSesion(token);
  if (sesion) {
    req.usuario = { id: sesion.usuario_id, username: sesion.username, rol: sesion.rol };
    return next();
  }

  if (req.path === "/" || req.path.endsWith(".html")) {
    return res.redirect("/login.html");
  }
  return res.status(401).json({ error: "No autenticado" });
});

app.use(express.static(PUBLIC_DIR));

app.use((err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: "Datos inválidos", detalles: err.errors });
  }
  if (err && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res
      .status(409)
      .json({ error: "Ya existe un vehículo con esa patente (dominio)" });
  }
  if (err && typeof err.code === "string" && err.code.startsWith("SQLITE")) {
    console.error(err);
    return res.status(500).json({
      error:
        "No se pudo guardar en la base de datos. Cerrá el servidor (Ctrl+C) y volvé a correr npm start para actualizarla.",
    });
  }
  if (err && err.name === "MulterError") {
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
  }
  if (err && ["ENOENT", "EACCES", "EPERM"].includes(err.code)) {
    console.error(err);
    return res.status(500).json({ error: `No se pudo guardar el archivo: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: err && err.message ? err.message : "Error interno del servidor" });
});

module.exports = app;
