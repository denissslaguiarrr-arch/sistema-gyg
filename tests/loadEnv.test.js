const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseEnv, loadEnv } = require("../backend/loadEnv");

test("parseEnv ignora comentarios y respeta comillas", () => {
  const parsed = parseEnv(`
# comentario
GYG_GIST_ID=abc123
GYG_GITHUB_TOKEN="ghp_xxx"
VACIO=
`);
  assert.equal(parsed.GYG_GIST_ID, "abc123");
  assert.equal(parsed.GYG_GITHUB_TOKEN, "ghp_xxx");
  assert.equal(parsed.VACIO, "");
});

test("loadEnv no pisa variables que ya están en el entorno", () => {
  const filePath = path.join(os.tmpdir(), `gyg-env-${Date.now()}.env`);
  fs.writeFileSync(filePath, "GYG_GIST_ID=desde-archivo\nGYG_IMGUR_CLIENT_ID=imgur-archivo\n");
  const env = { GYG_GIST_ID: "ya-estaba" };
  try {
    const resultado = loadEnv({ filePath, env });
    assert.equal(resultado.loaded, true);
    assert.equal(env.GYG_GIST_ID, "ya-estaba");
    assert.equal(env.GYG_IMGUR_CLIENT_ID, "imgur-archivo");
  } finally {
    fs.rmSync(filePath, { force: true });
  }
});
