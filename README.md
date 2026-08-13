# Sistema GYG

Sistema de Control de Stock y Gestión para una concesionaria de vehículos.

Fase 1: panel de administración y backend locales (Node.js + Express + SQLite).
La sincronización con la nube (JSON/Gist) queda para una fase posterior.

## Estructura

```
backend/
  server.js             Arranque de Express, admin inicial, backups programados
  app.js                App de Express (separada del listen() para poder testearla)
  db.js                 Conexión síncrona con better-sqlite3 y aplicación del schema
  auth.js               Hashing de contraseñas (scrypt) y sesiones
  middleware/
    requireAuth.js       Middleware que protege rutas /api
  routes/
    auth.js               Login, logout, usuario actual, cambio de contraseña
    vehiculos.js          CRUD, papelera, historial, resumen KPI, export CSV
    uploads.js            Subida de fotos (multer)
  scripts/
    backup.js             Backup manual/programado de la base SQLite
db/
  schema.sql            Definición de tablas (Vehiculos, Usuarios, Sesiones, HistorialEstados, Meta)
  concesionaria.db       Archivo SQLite (generado en runtime, no versionado)
  backups/               Backups automáticos (generado en runtime, no versionado)
public/
  login.html / login.js  Pantalla de acceso (pública)
  index.html             Panel de administración (Tailwind CDN)
  app.js                 Lógica del panel en Vanilla JS
  uploads/               Fotos subidas desde el panel (generado en runtime)
tests/
  validators.test.js     Casos unitarios de reglas de negocio
  auth.test.js            Login, logout, cambio de contraseña
  api.test.js             CRUD, papelera, historial, filtros, export CSV
```

## Cómo correr

```bash
npm install
npm test    # 28 tests automatizados
npm start   # http://localhost:3000
```

Al arrancar por primera vez se crea un usuario administrador y se imprime la
contraseña generada en la consola del servidor (usuario `admin`, contraseña
`admin123` por defecto). **Cambiala apenas ingreses** desde el panel (botón
"Cambiar contraseña"). También podés definir las credenciales iniciales por
variables de entorno antes del primer arranque:

```bash
GYG_ADMIN_USER=admin GYG_ADMIN_PASSWORD=una-clave-segura npm start
```

`GET /api/health` (sin autenticación) confirma que Express y SQLite están
operativos.

## Autenticación

El panel completo (HTML, JS, API de vehículos y fotos subidas) requiere una
sesión activa. Las credenciales se validan contra la tabla `Usuarios`
(contraseñas con `scrypt` + salt) y la sesión se identifica con una cookie
`httpOnly` respaldada por la tabla `Sesiones` (expira a los 7 días).

| Método | Ruta                     | Descripción                          |
|--------|--------------------------|----------------------------------------|
| POST   | `/api/auth/login`        | Inicia sesión (`{ username, password }`) |
| POST   | `/api/auth/logout`       | Cierra la sesión actual                |
| GET    | `/api/auth/me`           | Usuario autenticado                    |
| PATCH  | `/api/auth/me/password`  | Cambia la contraseña propia            |

## API REST de vehículos

| Método | Ruta                              | Descripción                                            |
|--------|------------------------------------|---------------------------------------------------------|
| GET    | `/api/vehiculos`                  | Lista vehículos. Filtros: `q`, `estado`, `km` (`0km`/`usado`), `papelera=1` |
| GET    | `/api/vehiculos/resumen`          | KPIs: totales por estado y valor de stock activo (ARS/USD) |
| GET    | `/api/vehiculos/export.csv`       | Exporta a CSV el listado filtrado                      |
| GET    | `/api/vehiculos/:id`              | Obtiene un vehículo                                    |
| GET    | `/api/vehiculos/:id/historial`    | Historial de cambios de estado                         |
| POST   | `/api/vehiculos`                  | Crea un vehículo                                       |
| PUT    | `/api/vehiculos/:id`              | Actualiza un vehículo (reemplazo completo)              |
| PATCH  | `/api/vehiculos/:id/estado`       | Cambia solo el estado (Disponible/Reservado/Vendido)    |
| PATCH  | `/api/vehiculos/:id/restaurar`    | Restaura un vehículo desde la papelera                  |
| DELETE | `/api/vehiculos/:id`              | Borrado lógico (va a la papelera)                       |
| DELETE | `/api/vehiculos/:id/permanente`   | Borra definitivamente (solo si ya está en la papelera)  |
| POST   | `/api/uploads`                    | Sube fotos (`multipart/form-data`, campo `imagenes`)     |

La patente (`dominio`) es única entre los vehículos activos; intentar
duplicarla devuelve `409`. Los datos inválidos devuelven `400` con el
detalle de los errores. Toda la API de vehículos y de subida de fotos
requiere sesión (401 si no la hay).

## Panel de administración

Servido como estáticos desde `/public`, sin build step (Tailwind vía CDN).
Incluye:

- Login con sesión persistente y cambio de contraseña propio.
- KPIs de stock (total, por estado, valor de stock activo en ARS/USD).
- Buscador, filtros por estado/condición y orden de columnas (marca, año,
  kilometraje, precio).
- Alta y edición en modal, con subida de fotos (o pegado de URLs externas).
- Badges de estado y acciones rápidas de cambio de estado en la tabla.
- Papelera (borrado lógico) con opción de restaurar o eliminar definitivamente.
- Historial de cambios de estado por vehículo.
- Exportación a CSV del listado filtrado.

## Backups

```bash
npm run backup
```

Genera una copia de `db/concesionaria.db` en `db/backups/` (usando el modo
`backup()` de SQLite, seguro incluso con el servidor corriendo) y conserva
las últimas 30 por defecto (`GYG_BACKUP_MAX`). El servidor además programa
un backup automático cada 24 horas mientras esté corriendo
(`GYG_BACKUP_INTERVAL_HOURS=0` lo desactiva).

## Próxima fase

La sincronización con la nube (JSON/Gist) queda para una fase posterior.
La tabla `Meta` y las columnas `created_at`/`updated_at` ya están
preparadas para ese flujo.

## Pendientes conocidos / ideas a futuro

- Roles/permisos (hoy todos los usuarios autenticados tienen acceso total).
- Paginación server-side si el stock crece mucho.
- Ficha imprimible/compartible por vehículo.
