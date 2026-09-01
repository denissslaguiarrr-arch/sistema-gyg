const test = require("node:test");
const assert = require("node:assert/strict");
const { subirBufferAImgbb } = require("../backend/utils/imgbb");

test("subirBufferAImgbb exige una clave", async () => {
  const anterior = process.env.GYG_IMGBB_API_KEY;
  delete process.env.GYG_IMGBB_API_KEY;
  try {
    await subirBufferAImgbb(Buffer.from("x"), { apiKey: "", fetchImpl: async () => ({}) });
    assert.fail("debía exigir clave");
  } catch (err) {
    assert.match(err.message, /ImgBB/);
    assert.equal(err.status, 400);
  } finally {
    if (anterior === undefined) delete process.env.GYG_IMGBB_API_KEY;
    else process.env.GYG_IMGBB_API_KEY = anterior;
  }
});

test("subirBufferAImgbb envía la clave y devuelve display_url", async () => {
  const link = await subirBufferAImgbb(Buffer.from("foto"), {
    apiKey: "clave-test",
    filename: "auto.jpg",
    fetchImpl: async (_url, opciones) => {
      assert.match(String(opciones.body), /clave-test/);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { display_url: "https://i.ibb.co/abc/auto.jpg", url: "https://i.ibb.co/abc/auto.jpg" },
        }),
      };
    },
  });
  assert.equal(link, "https://i.ibb.co/abc/auto.jpg");
});
