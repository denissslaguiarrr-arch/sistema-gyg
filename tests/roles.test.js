const test = require("node:test");
const assert = require("node:assert/strict");
const { tmpDbPath, limpiarArchivosDb, extraerCookie } = require("./helpers");

const dbPath = tmpDbPath("roles");
process.env.GYG_DB_PATH = dbPath;
process.env.GYG_ADMIN_USER = "admin";
process.env.GYG_ADMIN_PASSWORD = "clave-admin-123";

const app = require("../backend/app");
const { ensureDefaultAdmin } = require("../backend/auth");

let server;
let baseUrl;
let cookieAdmin;
let cookieVendedor;
let vendedorId;
let vehiculoId;

async function login(username, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(res.status, 200);
  return extraerCookie(res);
}

function conCookie(cookie, extra = {}) {
  return { "Content-Type": "application/json", Cookie: cookie, ...extra };
}

test.before(async () => {
  ensureDefaultAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  cookieAdmin = await login("admin", "clave-admin-123");

  const crearVendedor = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({ username: "vendedor1", password: "clave-vendedor-123", rol: "vendedor" }),
  });
  assert.equal(crearVendedor.status, 201);
  vendedorId = (await crearVendedor.json()).id;

  cookieVendedor = await login("vendedor1", "clave-vendedor-123");

  const crearVehiculo = await fetch(`${baseUrl}/api/vehiculos`, {
    method: "POST",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({
      marca: "Toyota",
      modelo: "Corolla",
      anio: 2022,
      dominio: "ROL123",
      precio: 20000,
      moneda: "USD",
    }),
  });
  assert.equal(crearVehiculo.status, 201);
  vehiculoId = (await crearVehiculo.json()).id;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  limpiarArchivosDb(dbPath);
});

test("un vendedor puede listar vehículos, ver resumen y cambiar el estado", async () => {
  const lista = await fetch(`${baseUrl}/api/vehiculos`, { headers: conCookie(cookieVendedor) });
  assert.equal(lista.status, 200);

  const resumen = await fetch(`${baseUrl}/api/vehiculos/resumen`, { headers: conCookie(cookieVendedor) });
  assert.equal(resumen.status, 200);

  const cambioEstado = await fetch(`${baseUrl}/api/vehiculos/${vehiculoId}/estado`, {
    method: "PATCH",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({ estado: "Reservado" }),
  });
  assert.equal(cambioEstado.status, 200);
});

test("un vendedor no puede crear, editar ni eliminar vehículos", async () => {
  const crear = await fetch(`${baseUrl}/api/vehiculos`, {
    method: "POST",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({ marca: "A", modelo: "B", anio: 2020, dominio: "X1", precio: 1, moneda: "ARS" }),
  });
  assert.equal(crear.status, 403);

  const editar = await fetch(`${baseUrl}/api/vehiculos/${vehiculoId}`, {
    method: "PUT",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({
      marca: "Toyota", modelo: "Corolla", anio: 2022, dominio: "ROL123", precio: 1, moneda: "ARS",
    }),
  });
  assert.equal(editar.status, 403);

  const eliminar = await fetch(`${baseUrl}/api/vehiculos/${vehiculoId}`, {
    method: "DELETE",
    headers: conCookie(cookieVendedor),
  });
  assert.equal(eliminar.status, 403);

  const restaurar = await fetch(`${baseUrl}/api/vehiculos/${vehiculoId}/restaurar`, {
    method: "PATCH",
    headers: conCookie(cookieVendedor),
  });
  assert.equal(restaurar.status, 403);

  const purgar = await fetch(`${baseUrl}/api/vehiculos/${vehiculoId}/permanente`, {
    method: "DELETE",
    headers: conCookie(cookieVendedor),
  });
  assert.equal(purgar.status, 403);
});

test("un vendedor no puede subir fotos ni gestionar usuarios", async () => {
  const subirFoto = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    headers: { Cookie: cookieVendedor },
    body: new URLSearchParams(),
  });
  assert.equal(subirFoto.status, 403);

  const listarUsuarios = await fetch(`${baseUrl}/api/usuarios`, { headers: conCookie(cookieVendedor) });
  assert.equal(listarUsuarios.status, 403);

  const crearUsuario = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: conCookie(cookieVendedor),
    body: JSON.stringify({ username: "otro", password: "123456" }),
  });
  assert.equal(crearUsuario.status, 403);
});

test("gestión de usuarios: validaciones y reglas de negocio (admin)", async () => {
  const passwordCorta = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({ username: "corto", password: "123" }),
  });
  assert.equal(passwordCorta.status, 400);

  const usernameDuplicado = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({ username: "vendedor1", password: "clave-123456" }),
  });
  assert.equal(usernameDuplicado.status, 409);

  const noPuedeEliminarseASiMismo = await fetch(`${baseUrl}/api/usuarios/1`, {
    method: "DELETE",
    headers: conCookie(cookieAdmin),
  });
  assert.equal(noPuedeEliminarseASiMismo.status, 400);

  const noPuedeQuedarSinAdmins = await fetch(`${baseUrl}/api/usuarios/1`, {
    method: "PATCH",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({ rol: "vendedor" }),
  });
  assert.equal(noPuedeQuedarSinAdmins.status, 400);

  // Promover al vendedor a admin permite luego eliminar al admin original sin violar la
  // regla de "al menos un admin". La eliminación la hace el nuevo admin, no el propio
  // usuario (nadie puede eliminarse a sí mismo, sea o no el último admin).
  const promover = await fetch(`${baseUrl}/api/usuarios/${vendedorId}`, {
    method: "PATCH",
    headers: conCookie(cookieAdmin),
    body: JSON.stringify({ rol: "admin" }),
  });
  assert.equal(promover.status, 200);

  const cookieNuevoAdmin = await login("vendedor1", "clave-vendedor-123");
  const eliminarOriginal = await fetch(`${baseUrl}/api/usuarios/1`, {
    method: "DELETE",
    headers: conCookie(cookieNuevoAdmin),
  });
  assert.equal(eliminarOriginal.status, 204);
});
