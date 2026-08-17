const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizarGistId, GIST_ID_DEFAULT } = require("../backend/utils/gistConfig");

test("normalizarGistId acepta el ID pelado o la URL de GitHub", () => {
  assert.equal(normalizarGistId("74837d1c1f0a9a3a67e6dc5cc4fa5b6f"), "74837d1c1f0a9a3a67e6dc5cc4fa5b6f");
  assert.equal(
    normalizarGistId("https://gist.github.com/denissslaguiarrr-arch/74837d1c1f0a9a3a67e6dc5cc4fa5b6f"),
    "74837d1c1f0a9a3a67e6dc5cc4fa5b6f"
  );
  assert.equal(normalizarGistId(""), "");
  assert.equal(GIST_ID_DEFAULT, "74837d1c1f0a9a3a67e6dc5cc4fa5b6f");
});
