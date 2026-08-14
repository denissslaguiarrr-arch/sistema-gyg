const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCsv, normalizarEncabezado, listaATextoCsv, parseListaUrls } = require("../backend/utils/csv");

test("parseCsv separa filas y columnas simples", () => {
  const filas = parseCsv("marca,modelo\nToyota,Hilux\nFord,Focus\n");
  assert.deepEqual(filas, [
    ["marca", "modelo"],
    ["Toyota", "Hilux"],
    ["Ford", "Focus"],
  ]);
});

test("parseCsv respeta campos entre comillas con comas y comillas escapadas", () => {
  const filas = parseCsv('marca,notas\nToyota,"Detalle, con coma y ""comillas"""\n');
  assert.deepEqual(filas, [
    ["marca", "notas"],
    ["Toyota", 'Detalle, con coma y "comillas"'],
  ]);
});

test("parseCsv soporta saltos de línea CRLF y quita el BOM inicial", () => {
  const filas = parseCsv("\uFEFFmarca,modelo\r\nToyota,Hilux\r\n");
  assert.deepEqual(filas, [
    ["marca", "modelo"],
    ["Toyota", "Hilux"],
  ]);
});

test("parseCsv ignora la última línea vacía", () => {
  const filas = parseCsv("marca\nToyota\n\n");
  assert.equal(filas.length, 2);
});

test("normalizarEncabezado quita acentos, mayúsculas y espacios", () => {
  assert.equal(normalizarEncabezado("  Año  "), "ano");
  assert.equal(normalizarEncabezado("Patente"), "patente");
  assert.equal(normalizarEncabezado("KILOMETRAJE"), "kilometraje");
});

test("listaATextoCsv arma los links de fotos para el export", () => {
  assert.equal(listaATextoCsv('["https://i.imgur.com/a.jpg","https://i.imgur.com/b.jpg"]'), "https://i.imgur.com/a.jpg | https://i.imgur.com/b.jpg");
  assert.equal(listaATextoCsv(["https://a.com/1.jpg", "https://a.com/2.jpg"]), "https://a.com/1.jpg | https://a.com/2.jpg");
  assert.equal(listaATextoCsv(""), "");
  assert.equal(listaATextoCsv("https://a.com/1.jpg"), "https://a.com/1.jpg");
});

test("parseListaUrls conserva el orden con |, comas y JSON", () => {
  assert.deepEqual(parseListaUrls("https://a.com/1.jpg | https://a.com/2.jpg | https://youtu.be/abcdefghijk"), [
    "https://a.com/1.jpg",
    "https://a.com/2.jpg",
    "https://youtu.be/abcdefghijk",
  ]);
  assert.deepEqual(parseListaUrls("https://a.com/1.jpg, https://a.com/2.jpg"), [
    "https://a.com/1.jpg",
    "https://a.com/2.jpg",
  ]);
  assert.deepEqual(parseListaUrls(["https://a.com/frente.jpg", "https://a.com/lateral.jpg"]), [
    "https://a.com/frente.jpg",
    "https://a.com/lateral.jpg",
  ]);
});
