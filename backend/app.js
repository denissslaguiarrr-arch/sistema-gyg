const path = require("path");
const express = require("express");
const { db, DB_PATH } = require("./db");
const vehiculosRouter = require("./routes/vehiculos");
const { ValidationError } = require("./validators/vehiculo");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  const row = db.prepare("SELECT COUNT(*) AS total FROM Vehiculos").get();
  res.json({
    ok: true,
    db: path.basename(DB_PATH),
    vehiculos: row.total,
  });
});

app.use("/api/vehiculos", vehiculosRouter);

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
