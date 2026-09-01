const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function tmpDbPath(prefix) {
  return path.join(
    os.tmpdir(),
    `gyg-${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
  );
}

function limpiarArchivosDb(dbPath) {
  for (const suffix of ["", "-shm", "-wal"]) {
    fs.rmSync(dbPath + suffix, { force: true });
  }
}

function extraerCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;
  return setCookie.split(";")[0];
}

module.exports = { tmpDbPath, limpiarArchivosDb, extraerCookie };
