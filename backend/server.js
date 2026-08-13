require("./loadEnv").loadEnv();

const app = require("./app");
const { DB_PATH } = require("./db");
const { ensureDefaultAdmin, limpiarSesionesExpiradas } = require("./auth");
const { crearBackup } = require("./scripts/backup");

const PORT = process.env.PORT || 3000;

const adminCreado = ensureDefaultAdmin();
if (adminCreado) {
  console.log("=".repeat(60));
  console.log("Se creó el usuario administrador inicial del panel:");
  console.log(`  Usuario:    ${adminCreado.username}`);
  console.log(`  Contraseña: ${adminCreado.password}`);
  if (!adminCreado.passwordDefinidaPorEnv) {
    console.log("  Cambiala apenas ingreses (menú de usuario > Cambiar contraseña).");
  }
  console.log("=".repeat(60));
}

limpiarSesionesExpiradas();
setInterval(limpiarSesionesExpiradas, 60 * 60 * 1000).unref();

const BACKUP_INTERVAL_HOURS = Number(process.env.GYG_BACKUP_INTERVAL_HOURS ?? 24);
if (BACKUP_INTERVAL_HOURS > 0) {
  setInterval(() => {
    crearBackup().catch((err) =>
      console.error("No se pudo generar el backup automático:", err.message)
    );
  }, BACKUP_INTERVAL_HOURS * 60 * 60 * 1000).unref();
}

app.listen(PORT, () => {
  console.log(`GYG local escuchando en http://localhost:${PORT}`);
  console.log(`SQLite: ${DB_PATH}`);
});
