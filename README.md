# Sistema GYG

Sistema de Control de Stock y Gestión para una concesionaria de vehículos.

Fase 1: panel de administración y backend locales (Node.js + Express + SQLite).
La sincronización con la nube (JSON/Gist) queda para una fase posterior.

## Estructura

```
backend/
  server.js           Arranque de Express, estáticos y manejo de errores
  db.js               Conexión síncrona con better-sqlite3 y aplicación del schema
  routes/vehiculos.js  Endpoints REST de vehículos
  validators/vehiculo.js  Reglas de negocio y validación de entrada
db/
  schema.sql          Definición de tablas (Vehiculos, Meta)
  concesionaria.db     Archivo SQLite (generado en runtime, no versionado)
public/
  index.html          Panel de administración (Tailwind CDN)
  app.js              Lógica del panel en Vanilla JS
```

## Cómo correr

```bash
npm install
npm start
```

El servidor queda en `http://localhost:3000`.
`GET /api/health` confirma que Express y SQLite están operativos.

## API REST

| Método | Ruta                        | Descripción                                  |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/api/vehiculos`            | Lista vehículos. Filtros: `q`, `estado`, `km` (`0km`/`usado`) |
| GET    | `/api/vehiculos/:id`        | Obtiene un vehículo                          |
| POST   | `/api/vehiculos`            | Crea un vehículo                             |
| PUT    | `/api/vehiculos/:id`        | Actualiza un vehículo (reemplazo completo)   |
| PATCH  | `/api/vehiculos/:id/estado` | Cambia solo el estado (Disponible/Reservado/Vendido) |
| DELETE | `/api/vehiculos/:id`        | Elimina un vehículo                          |

La patente (`dominio`) es única; intentar duplicarla devuelve `409`.
Los datos inválidos devuelven `400` con el detalle de los errores.

## Panel de administración

Servido como estáticos desde `/public`, sin build step (Tailwind vía CDN).
Incluye buscador, filtros por estado/condición, alta y edición en modal,
badges de estado y acciones rápidas de cambio de estado en la tabla.

## Próxima fase

La sincronización con la nube (JSON/Gist) queda para una fase posterior.
La tabla `Meta` y las columnas `created_at`/`updated_at` ya están
preparadas para ese flujo.
