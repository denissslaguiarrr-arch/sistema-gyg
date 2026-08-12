const path = require("path");
const express = require("express");
const { db, DB_PATH } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Verificación de que Express y SQLite arrancaron correctamente.
// Las rutas REST de vehículos se agregan en el Paso 2.
app.get("/api/health", (_req, res) => {
  const row = db.prepare("SELECT COUNT(*) AS total FROM Vehiculos").get();
  res.json({
    ok: true,
    db: path.basename(DB_PATH),
    vehiculos: row.total,
  });
});

app.listen(PORT, () => {
  console.log(`GYG local escuchando en http://localhost:${PORT}`);
  console.log(`SQLite: ${DB_PATH}`);
});
