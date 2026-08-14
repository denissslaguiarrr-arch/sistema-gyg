const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateVehiculo,
  validateEstado,
  ValidationError,
} = require("../backend/validators/vehiculo");

test("valida un vehículo correcto y normaliza dominio/moneda", () => {
  const data = validateVehiculo({
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2024,
    dominio: "ab123cd",
    kilometraje: 0,
    precio: 45000,
    moneda: "usd",
    imagenes_url: "http://a.com/1.jpg, http://a.com/2.jpg",
  });

  assert.equal(data.dominio, "AB123CD");
  assert.equal(data.moneda, "USD");
  assert.equal(data.estado, "Disponible");
  assert.equal(data.origen, "Compra");
  assert.equal(data.precio_compra, null);
  assert.match(data.fecha_ingreso, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(JSON.parse(data.imagenes_url), [
    "http://a.com/1.jpg",
    "http://a.com/2.jpg",
  ]);
});

test("kilometraje vacío se normaliza a 0", () => {
  const data = validateVehiculo({
    marca: "Ford",
    modelo: "Focus",
    anio: 2020,
    dominio: "AAA111",
    precio: 100,
    moneda: "ARS",
  });
  assert.equal(data.kilometraje, 0);
});

test("rechaza campos obligatorios faltantes", () => {
  assert.throws(() => validateVehiculo({}), ValidationError);
});

test("rechaza estado y moneda inválidos con detalle de errores", () => {
  try {
    validateVehiculo({
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
      dominio: "BBB222",
      precio: 100,
      moneda: "EUR",
      estado: "Perdido",
    });
    assert.fail("debía lanzar ValidationError");
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.ok(err.errors.some((e) => e.includes("moneda")));
    assert.ok(err.errors.some((e) => e.includes("estado")));
  }
});

test("rechaza año, precio y kilometraje fuera de rango", () => {
  try {
    validateVehiculo({
      marca: "Ford",
      modelo: "Focus",
      anio: 1800,
      dominio: "CCC333",
      kilometraje: -5,
      precio: -100,
      moneda: "ARS",
    });
    assert.fail("debía lanzar ValidationError");
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.equal(err.errors.length, 3);
  }
});

test("imagenes_url acepta arreglo, CSV y JSON como string", () => {
  const csv = validateVehiculo({
    marca: "A",
    modelo: "B",
    anio: 2020,
    dominio: "D1",
    precio: 1,
    moneda: "ARS",
    imagenes_url: "a.jpg, b.jpg",
  });
  assert.deepEqual(JSON.parse(csv.imagenes_url), ["a.jpg", "b.jpg"]);

  const jsonArr = validateVehiculo({
    marca: "A",
    modelo: "B",
    anio: 2020,
    dominio: "D2",
    precio: 1,
    moneda: "ARS",
    imagenes_url: '["a.jpg","b.jpg"]',
  });
  assert.deepEqual(JSON.parse(jsonArr.imagenes_url), ["a.jpg", "b.jpg"]);

  const arr = validateVehiculo({
    marca: "A",
    modelo: "B",
    anio: 2020,
    dominio: "D3",
    precio: 1,
    moneda: "ARS",
    imagenes_url: ["a.jpg", "b.jpg"],
  });
  assert.deepEqual(JSON.parse(arr.imagenes_url), ["a.jpg", "b.jpg"]);

  const pipes = validateVehiculo({
    marca: "A",
    modelo: "B",
    anio: 2020,
    dominio: "D4",
    precio: 1,
    moneda: "ARS",
    imagenes_url: "https://a.com/frente.jpg | https://a.com/lateral.jpg | https://youtu.be/abcdefghijk",
  });
  assert.deepEqual(JSON.parse(pipes.imagenes_url), [
    "https://a.com/frente.jpg",
    "https://a.com/lateral.jpg",
    "https://youtu.be/abcdefghijk",
  ]);
});

test("validateEstado solo acepta los 3 valores permitidos", () => {
  assert.equal(validateEstado({ estado: "Vendido" }), "Vendido");
  assert.throws(() => validateEstado({ estado: "Cancelado" }), ValidationError);
  assert.throws(() => validateEstado({}), ValidationError);
});

test("precio_oferta vacío se normaliza a null", () => {
  const data = validateVehiculo({
    marca: "Ford",
    modelo: "Focus",
    anio: 2020,
    dominio: "OFE001",
    precio: 10000,
    moneda: "USD",
  });
  assert.equal(data.precio_oferta, null);
});

test("acepta un precio_oferta menor al precio de lista", () => {
  const data = validateVehiculo({
    marca: "Ford",
    modelo: "Focus",
    anio: 2020,
    dominio: "OFE002",
    precio: 10000,
    precio_oferta: 8500,
    moneda: "USD",
  });
  assert.equal(data.precio, 10000);
  assert.equal(data.precio_oferta, 8500);
});

test("acepta origen, precio_compra y fecha_ingreso", () => {
  const data = validateVehiculo({
    marca: "Ford",
    modelo: "Focus",
    anio: 2020,
    dominio: "COS001",
    precio: 10000,
    moneda: "USD",
    origen: "consignacion",
    precio_compra: 7000,
    fecha_ingreso: "2026-04-01",
  });
  assert.equal(data.origen, "Consignación");
  assert.equal(data.precio_compra, 7000);
  assert.equal(data.fecha_ingreso, "2026-04-01");
});

test("PUT conserva costo y origen si el body no los manda", () => {
  const data = validateVehiculo(
    {
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
      dominio: "COS002",
      precio: 10000,
      moneda: "USD",
    },
    { existente: { origen: "Permuta", precio_compra: 5500, fecha_ingreso: "2025-12-01" } }
  );
  assert.equal(data.origen, "Permuta");
  assert.equal(data.precio_compra, 5500);
  assert.equal(data.fecha_ingreso, "2025-12-01");
});

test("rechaza origen o precio_compra inválidos", () => {
  try {
    validateVehiculo({
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
      dominio: "COS003",
      precio: 10000,
      moneda: "USD",
      origen: "alquiler",
      precio_compra: -10,
    });
    assert.fail("debía lanzar ValidationError");
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.ok(err.errors.some((e) => e.includes("origen")));
    assert.ok(err.errors.some((e) => e.includes("precio_compra")));
  }
});

test("rechaza precio_oferta negativo o mayor/igual al precio de lista", () => {
  try {
    validateVehiculo({
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
      dominio: "OFE003",
      precio: 10000,
      precio_oferta: -1,
      moneda: "USD",
    });
    assert.fail("debía lanzar ValidationError");
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.ok(err.errors.some((e) => e.includes("precio_oferta")));
  }

  try {
    validateVehiculo({
      marca: "Ford",
      modelo: "Focus",
      anio: 2020,
      dominio: "OFE004",
      precio: 10000,
      precio_oferta: 10000,
      moneda: "USD",
    });
    assert.fail("debía lanzar ValidationError");
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.ok(err.errors.some((e) => /menor que el precio/.test(e)));
  }
});
