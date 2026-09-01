const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const js = fs.readFileSync(path.join(__dirname, "../blogger/gyg-showroom.js"), "utf8");
const start = js.indexOf("function publicVehicles");
const end = js.indexOf("function findVehicle");
assert.ok(start >= 0 && end > start, "no se encontraron las funciones del carrusel");
const { pickCarouselVehicles } = new Function(
  `${js.slice(start, end)}; return { publicVehicles, pickCarouselVehicles };`
)();

function auto(parcial) {
  return {
    id: parcial.id,
    status: parcial.status || "disponible",
    categoria: "usado",
    destacado: !!parcial.destacado,
    anio: parcial.anio || 2020,
  };
}

test("pickCarouselVehicles prioriza destacados y omite vendidos", () => {
  const data = {
    vehicles: [
      auto({ id: "v", status: "vendido", destacado: true, anio: 2024 }),
      auto({ id: "a", anio: 2018 }),
      auto({ id: "d", destacado: true, anio: 2015 }),
      auto({ id: "b", anio: 2022 }),
      auto({ id: "r", status: "reservado", anio: 2023 }),
    ],
  };
  const picked = pickCarouselVehicles(data, 8);
  assert.deepEqual(
    picked.map((v) => v.id),
    ["d", "b", "a", "r"]
  );
});

test("pickCarouselVehicles recorta al límite", () => {
  const data = {
    vehicles: [1, 2, 3, 4, 5].map((n) => auto({ id: `n${n}`, anio: 2020 + n })),
  };
  assert.equal(pickCarouselVehicles(data, 3).length, 3);
  assert.equal(pickCarouselVehicles(data, 3)[0].id, "n5");
});
