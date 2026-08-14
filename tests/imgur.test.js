const test = require("node:test");
const assert = require("node:assert/strict");
const { subirBufferAImgur } = require("../backend/utils/imgur");

test("subirBufferAImgur exige GYG_IMGUR_CLIENT_ID", async () => {
  const anterior = process.env.GYG_IMGUR_CLIENT_ID;
  delete process.env.GYG_IMGUR_CLIENT_ID;
  try {
    await assert.rejects(
      () => subirBufferAImgur(Buffer.from("abc")),
      /Imgur ya no registra Client ID/
    );
  } finally {
    if (anterior === undefined) delete process.env.GYG_IMGUR_CLIENT_ID;
    else process.env.GYG_IMGUR_CLIENT_ID = anterior;
  }
});

test("subirBufferAImgur envía Client-ID y devuelve el link público", async () => {
  const anterior = process.env.GYG_IMGUR_CLIENT_ID;
  process.env.GYG_IMGUR_CLIENT_ID = "mi-client-id";

  let headers;
  let body;
  const fetchImpl = async (_url, opciones) => {
    headers = opciones.headers;
    body = JSON.parse(opciones.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { link: "https://i.imgur.com/abc123.jpg" } }),
    };
  };

  try {
    const link = await subirBufferAImgur(Buffer.from("hola"), {
      filename: "auto.jpg",
      fetchImpl,
    });
    assert.equal(link, "https://i.imgur.com/abc123.jpg");
    assert.equal(headers.Authorization, "Client-ID mi-client-id");
    assert.equal(body.type, "base64");
    assert.equal(body.name, "auto.jpg");
  } finally {
    if (anterior === undefined) delete process.env.GYG_IMGUR_CLIENT_ID;
    else process.env.GYG_IMGUR_CLIENT_ID = anterior;
  }
});
