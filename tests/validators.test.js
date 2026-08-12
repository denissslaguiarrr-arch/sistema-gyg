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
});

test("validateEstado solo acepta los 3 valores permitidos", () => {
  assert.equal(validateEstado({ estado: "Vendido" }), "Vendido");
  assert.throws(() => validateEstado({ estado: "Cancelado" }), ValidationError);
  assert.throws(() => validateEstado({}), ValidationError);
});
