const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { DB_PATH } = require("../db");

const BACKUPS_DIR = path.join(path.dirname(DB_PATH), "backups");
const MAX_BACKUPS = Number(process.env.GYG_BACKUP_MAX || 30);

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function podarBackupsAntiguos() {
  const archivos = fs
    .readdirSync(BACKUPS_DIR)
    .filter((nombre) => nombre.startsWith("concesionaria-") && nombre.endsWith(".db"))
    .sort();

  const sobrantes = archivos.length - MAX_BACKUPS;
  for (let i = 0; i < sobrantes; i += 1) {
    fs.unlinkSync(path.join(BACKUPS_DIR, archivos[i]));
  }
}

async function crearBackup() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`No existe la base de datos en ${DB_PATH}`);
  }

  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const destino = path.join(BACKUPS_DIR, `concesionaria-${timestamp()}.db`);

  const origen = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    await origen.backup(destino);
  } finally {
    origen.close();
  }

  podarBackupsAntiguos();
  return destino;
}

module.exports = { crearBackup, BACKUPS_DIR };

if (require.main === module) {
  crearBackup()
    .then((destino) => {
      console.log(`Backup creado: ${destino}`);
    })
    .catch((err) => {
      console.error("Error al crear el backup:", err.message);
      process.exitCode = 1;
    });
}
