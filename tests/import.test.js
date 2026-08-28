const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("import");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookie;

test.before(async () => {
  ensureDefaultAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "clave-admin-123" }),
  });
  cookie = extraerCookie(loginRes);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

function csvComoArchivo(contenido, nombre = "import.csv") {
  return new File([contenido], nombre, { type: "text/csv" });
}

test("GET /api/vehiculos/plantilla.csv devuelve encabezados y una fila de ejemplo", async () => {
  const res = await fetch(`${baseUrl}/api/vehiculos/plantilla.csv`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  const texto = await res.text();
  const lineas = texto.trim().split("\n");
  assert.equal(lineas.length, 2);
  assert.match(lineas[0], /^marca,modelo,anio,dominio,kilometraje,precio,precio_oferta,moneda,estado,notas,imagenes_url/);
  assert.match(lineas[0], /version,combustible,transmision,traccion,puertas,color,motor,potencia,carroceria,destacado,equipamiento,origen,precio_compra,fecha_ingreso$/);
});

test("POST /api/vehiculos/import crea y actualiza vehículos, reportando errores por fila", async () => {
  const csv = [
    "marca,modelo,anio,patente,km,precio,moneda,estado,notas",
    "Toyota,Hilux,2024,IMP001,0,45000,USD,Disponible,Primer ingreso",
    "Ford,Focus,2019,IMP002,50000,8000000,ARS,Reservado,",
    ",ModeloSinMarca,2020,IMP003,0,1000,ARS,Disponible,", // fila inválida: falta marca
  ].join("\n");

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.creados, 2);
  assert.equal(body.actualizados, 0);
  assert.equal(body.errores.length, 1);
  assert.equal(body.errores[0].fila, 4);
  assert.match(body.errores[0].error, /marca/);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMP001`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(lista.items.length, 1);
  assert.equal(lista.items[0].kilometraje, 0);
  assert.equal(lista.items[0].dominio, "IMP001");

  // Reimportar con la misma patente actualiza en vez de duplicar.
  const csvActualizado = [
    "marca,modelo,anio,patente,km,precio,moneda,estado,notas",
    "Toyota,Hilux SRX,2024,IMP001,10,47000,USD,Reservado,Actualizado por reimportación",
  ].join("\n");

  const formData2 = new FormData();
  formData2.append("archivo", csvComoArchivo(csvActualizado));

  const res2 = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData2,
  });
  const body2 = await res2.json();
  assert.equal(body2.creados, 0);
  assert.equal(body2.actualizados, 1);

  const listaFinal = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMP001`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(listaFinal.items.length, 1);
  assert.equal(listaFinal.items[0].modelo, "Hilux SRX");
  assert.equal(listaFinal.items[0].estado, "Reservado");
});

test("POST /api/vehiculos/import acepta la columna oferta como precio_oferta", async () => {
  const csv = [
    "marca,modelo,anio,patente,km,precio,oferta,moneda,estado",
    "Honda,Civic,2020,IMP0FE,30000,18000,15000,USD,Disponible",
  ].join("\n");

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.creados, 1);
  assert.equal(body.errores.length, 0);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMP0FE`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(lista.items[0].precio, 18000);
  assert.equal(lista.items[0].precio_oferta, 15000);
});

test("POST /api/vehiculos/import sin archivo devuelve 400", async () => {
  const formData = new FormData();
  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 400);
});

test("POST /api/vehiculos/import requiere rol admin", async () => {
  const crearVendedor = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ username: "vendedorimport", password: "clave-123456", rol: "vendedor" }),
  });
  assert.equal(crearVendedor.status, 201);

  const loginVendedor = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "vendedorimport", password: "clave-123456" }),
  });
  const cookieVendedor = extraerCookie(loginVendedor);

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo("marca,modelo,anio,dominio,precio,moneda\nA,B,2020,V1,1,ARS"));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookieVendedor },
    body: formData,
  });
  assert.equal(res.status, 403);
});

test("POST /api/vehiculos/import lee los links de fotos en el mismo orden que el export", async () => {
  const csv = [
    "marca,modelo,anio,dominio,kilometraje,precio,moneda,estado,imagenes_url",
    'Ford,Ka,2018,IMPFOT,40000,5000,USD,Disponible,"https://a.com/frente.jpg | https://a.com/lateral.jpg | https://youtu.be/abcdefghijk"',
  ].join("\n");

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.creados, 1);
  assert.equal(body.errores.length, 0);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMPFOT`, { headers: { Cookie: cookie } })
  ).json();
  assert.deepEqual(lista.items[0].imagenes_url, [
    "https://a.com/frente.jpg",
    "https://a.com/lateral.jpg",
    "https://youtu.be/abcdefghijk",
  ]);

  const exportado = await fetch(`${baseUrl}/api/vehiculos/export.csv?q=IMPFOT`, {
    headers: { Cookie: cookie },
  });
  const texto = await exportado.text();
  assert.match(texto, /https:\/\/a\.com\/frente\.jpg \| https:\/\/a\.com\/lateral\.jpg \| https:\/\/youtu\.be\/abcdefghijk/);
});

test("POST /api/vehiculos/import acepta un export sin encabezados y con coma extra", async () => {
  const csv = [
    "10,TOYOTA,COROLLA XEI PACK,2018,AC788QS,66000,28500000,,ARS,Disponible,,,,NAFTA,AUTOMÁTICO,DELANTERA,5,BLANCO,1.8 CVT,,,,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "11,VOLKSWAGEN,TAOS HIGHLINE,2024,AG440IZ,57000,51500000,,ARS,Disponible,,,,NAFTA,AUTOMÁTICO,DELANTERA,5,GRIS PLATA,1.4 TSI,,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "12,VOLKSWAGEN,TAOS COMFORTLINE,2024,AG410WJ,29478,45900000,,ARS,Disponible,,,,NAFTA,AUTOMÁTICO,DELANTERA,5,AZUL ATLÁNTICO,1.4 TSI,,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "13,VOLKSWAGEN,SAVEIRO,2015,PBP988,125000,16500000,,ARS,Disponible,,,,NAFTA,MANUAL,DELANTERA,2,GRIS OSCURO,1.6L,,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "14,FIAT,STRADA FREEDOM,2024,AG606BU,60976,27900000,,ARS,Disponible,,,,NAFTA,MANUAL,DELANTERA,4,NEGRO,1.3 CD,,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "15,VOLKSWAGEN,AMAROK,2016,AA415RR,175000,24900000,,ARS,Disponible,,,,DIESEL,MANUAL,4X4,2,BLANCO,2.0 TDI,140 CV a 3.500 rpm,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "16,VOLKSWAGEN,AMAROK TRENDLINE,2024,AG913VP,42000,46500000,,ARS,Disponible,,,,DIESEL,MANUAL,4X2,4,GRIS PLATA,2.0 TDI,,C. ABIERTA,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "17,VOLKSWAGEN,AMAROK TRENDLINE,2023,AG297OL,19000,39800000,,ARS,Disponible,,,,DIESEL,MANUAL,4X2,4,BLANCA,2.0L TDI,,C. ABIERTA,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "18,TOYOTA,HILUX,2016,AA568QV,175000,44800000,,ARS,Disponible,,,,DIESEL,MANUAL,4X4,4,GRIS OSCURO,2.8 TDI,,,,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "19,FORD,RANGER,2012,LWQ138,225000,19800000,,ARS,Disponible,,,,DIESEL,MANUAL,4X2,4,GRIS/CHAMPÁN,2.2L,,OTROS,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "20,TOYOTA,HILUX SR,2023,AG024IN,98000,44800000,,ARS,Disponible,,,,DIESEL,MANUAL,4X2,4,BLANCO,2.4 TDI,,,,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "21,TOYOTA,HILUX DX,2019,,0,41900000,,ARS,Disponible,,,,DIESEL,MANUAL,4X2,4,BLANCO,2.4,,,,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
    "22,VOLKSWAGEN,AMAROK TRENDLINE,2025,AH893GH,0,49800000,,ARS,Disponible,,,,DIESEL,MANUAL,4X2,4,GRIS PLATA,2.0 TDI,,NO INFORMADO,false,Compra,,2026-08-14,2026-08-14 17:03:17,2026-08-14 17:03:17",
  ].join("\n");

  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));

  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.errores.length, 0, JSON.stringify(body.errores));
  assert.equal(body.creados, 13);
  assert.equal(body.avisos.length, 1);
  assert.match(body.avisos[0].dominio, /^SD-HILUXDX-2019/);

  const corolla = await (
    await fetch(`${baseUrl}/api/vehiculos?q=AC788QS`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(corolla.items[0].marca, "TOYOTA");
  assert.equal(corolla.items[0].modelo, "COROLLA XEI PACK");
  assert.equal(corolla.items[0].origen, "Compra");
  assert.equal(corolla.items[0].destacado, false);
  assert.equal(corolla.items[0].motor, "1.8 CVT");

  const hiluxDx = await (
    await fetch(`${baseUrl}/api/vehiculos?q=SD-HILUXDX-2019`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(hiluxDx.items.length, 1);
  assert.equal(hiluxDx.items[0].modelo, "HILUX DX");
  assert.equal(hiluxDx.items[0].precio, 41900000);
});

test("POST /api/vehiculos/import no borra fotos al reimportar con imagenes_url vacío", async () => {
  const alta = [
    "marca,modelo,anio,dominio,kilometraje,precio,moneda,estado,imagenes_url",
    "Chevrolet,Onix,2021,IMPFOT2,20000,12000,USD,Disponible,https://a.com/frente.jpg | https://a.com/fondo.jpg",
  ].join("\n");
  const formAlta = new FormData();
  formAlta.append("archivo", csvComoArchivo(alta));
  const altaRes = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formAlta,
  });
  assert.equal((await altaRes.json()).creados, 1);

  const update = [
    "marca,modelo,anio,dominio,kilometraje,precio,moneda,estado,imagenes_url",
    "Chevrolet,Onix Premier,2021,IMPFOT2,21000,12500,USD,Disponible,",
  ].join("\n");
  const formUpdate = new FormData();
  formUpdate.append("archivo", csvComoArchivo(update));
  const updateRes = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formUpdate,
  });
  const updateBody = await updateRes.json();
  assert.equal(updateBody.actualizados, 1);
  assert.equal(updateBody.errores.length, 0);

  const lista = await (
    await fetch(`${baseUrl}/api/vehiculos?q=IMPFOT2`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(lista.items[0].modelo, "Onix Premier");
  assert.deepEqual(lista.items[0].imagenes_url, [
    "https://a.com/frente.jpg",
    "https://a.com/fondo.jpg",
  ]);
});

test("POST /api/vehiculos/import avisa si las fotos son solo de /uploads/", async () => {
  const csv = [
    "marca,modelo,anio,dominio,kilometraje,precio,moneda,estado,imagenes_url",
    "Fiat,Cronos,2020,IMPLOC,10000,8000,USD,Disponible,/uploads/foto-local.jpg | /uploads/otra.jpg",
  ].join("\n");
  const formData = new FormData();
  formData.append("archivo", csvComoArchivo(csv));
  const res = await fetch(`${baseUrl}/api/vehiculos/import`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.creados, 1);
  assert.equal(body.errores.length, 0);
  assert.ok(body.avisos.some((aviso) => /uploads/i.test(aviso.mensaje)));
});
