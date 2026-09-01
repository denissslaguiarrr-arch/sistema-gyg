const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseCsv,
  parseCsvFlexible,
  esFilaDeEncabezados,
  alinearColumnas,
  normalizarEncabezado,
  listaATextoCsv,
  parseListaUrls,
} = require("../backend/utils/csv");

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

test("esFilaDeEncabezados reconoce Marca/Modelo y no una fila de stock", () => {
  assert.equal(esFilaDeEncabezados(["id", "marca", "modelo", "anio"]), true);
  assert.equal(esFilaDeEncabezados(["10", "TOYOTA", "COROLLA XEI PACK", "2018"]), false);
});

test("parseCsvFlexible elige punto y coma si Excel armó más columnas", () => {
  const filas = parseCsvFlexible("marca;modelo;anio\nToyota;Hilux;2024\n");
  assert.deepEqual(filas[0], ["marca", "modelo", "anio"]);
  assert.deepEqual(filas[1], ["Toyota", "Hilux", "2024"]);
});

test("alinearColumnas corrige la coma extra entre carroceria y destacado", () => {
  const corolla =
    "10,TOYOTA,COROLLA XEI PACK,2018,AC788QS,66000,28500000,,ARS,Disponible,,,,NAFTA,AUTOMÁTICO,DELANTERA,5,BLANCO,1.8 CVT,,,,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17";
  const fila = parseCsv(corolla)[0];
  assert.equal(fila.length, 28);
  const alineada = alinearColumnas(fila, 27);
  assert.equal(alineada.length, 27);
  assert.equal(alineada[1], "TOYOTA");
  assert.equal(alineada[18], "1.8 CVT");
  assert.equal(alineada[21], "false");
  assert.equal(alineada[22], "Compra");
});

test("alinearColumnas recorta una columna vacía al final sin tocar potencia", () => {
  const fila = parseCsv(
    "11,VOLKSWAGEN,TAOS HIGHLINE,2024,AG440IZ,57000,51500000,,ARS,Disponible,,,,NAFTA,AUTOMÁTICO,DELANTERA,5,GRIS PLATA,1.4 TSI,,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17,"
  )[0];
  assert.equal(fila.length, 28);
  const alineada = alinearColumnas(fila, 27);
  assert.equal(alineada.length, 27);
  assert.equal(alineada[20], "NO INFORMADO");
  assert.equal(alineada[21], "false");
});
