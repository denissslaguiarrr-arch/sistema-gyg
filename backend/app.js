const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { db, DB_PATH } = require("./db");
const { obtenerSesion, SESSION_COOKIE } = require("./auth");
const authRouter = require("./routes/auth");
const vehiculosRouter = require("./routes/vehiculos");
const uploadsRouter = require("./routes/uploads");
const requireAuth = require("./middleware/requireAuth");
const { ValidationError } = require("./validators/vehiculo");

const app = express();
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const RUTAS_PUBLICAS = new Set(["/login.html", "/login.js"]);

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
app.use("/api/vehiculos", requireAuth, vehiculosRouter);
app.use("/api/uploads", requireAuth, uploadsRouter);

// El resto del panel (HTML/JS/fotos subidas) requiere sesión activa;
// login.html y login.js quedan públicos para poder autenticarse.
app.use((req, res, next) => {
  if (RUTAS_PUBLICAS.has(req.path)) return next();

  const token = req.cookies ? req.cookies[SESSION_COOKIE] : undefined;
  const sesion = obtenerSesion(token);
  if (sesion) {
    req.usuario = { id: sesion.usuario_id, username: sesion.username };
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
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
