const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizarGistId,
  GIST_ID_DEFAULT,
  tokenGithubUsable,
  elegirToken,
} = require("../backend/utils/gistConfig");

test("normalizarGistId acepta el ID pelado o la URL de GitHub", () => {
  assert.equal(normalizarGistId("74837d1c1f0a9a3a67e6dc5cc4fa5b6f"), "74837d1c1f0a9a3a67e6dc5cc4fa5b6f");
  assert.equal(
    normalizarGistId("https://gist.github.com/denissslaguiarrr-arch/74837d1c1f0a9a3a67e6dc5cc4fa5b6f"),
    "74837d1c1f0a9a3a67e6dc5cc4fa5b6f"
  );
  assert.equal(normalizarGistId(""), "");
  assert.equal(GIST_ID_DEFAULT, "");
});

test("tokenGithubUsable ignora el placeholder del env.example", () => {
  assert.equal(tokenGithubUsable(""), false);
  assert.equal(tokenGithubUsable("ghp_pegá_tu_token"), false);
  assert.equal(tokenGithubUsable("ghp_pega_tu_token"), false);
  assert.equal(tokenGithubUsable("token-desde-el-panel"), true);
});

test("elegirToken no deja que el placeholder pise el token del panel", () => {
  assert.equal(elegirToken("ghp_pegá_tu_token", "token-real"), "token-real");
  assert.equal(elegirToken("token-de-prueba", "token-del-panel"), "token-de-prueba");
  assert.equal(elegirToken("", ""), "");
});
