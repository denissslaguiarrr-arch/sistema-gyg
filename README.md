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
  auth.js               Hashing de contraseñas (scrypt), sesiones y roles
  middleware/
    requireAuth.js       Exige sesión activa
    requireRole.js        Exige un rol determinado (ej. admin)
  routes/
    auth.js               Login, logout, usuario actual, cambio de contraseña
    usuarios.js            Gestión de usuarios y roles (solo admin)
    vehiculos.js          CRUD, papelera, historial, resumen KPI, export CSV, paginación
    uploads.js            Subida de fotos (multer, solo admin)
    public.js              API pública de solo lectura para la ficha compartible
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
  ficha.html / ficha.js   Ficha pública de un vehículo (compartible, sin login)
  uploads/               Fotos subidas desde el panel (generado en runtime)
tests/
  validators.test.js     Casos unitarios de reglas de negocio
  auth.test.js            Login, logout, cambio de contraseña
  roles.test.js           Permisos admin vs. vendedor, gestión de usuarios
  public.test.js          Ficha pública sin sesión
  api.test.js             CRUD, papelera, historial, filtros, paginación, export CSV
```

## Cómo correr

```bash
npm install
npm test    # 37 tests automatizados
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

## Autenticación y roles

El panel completo (HTML, JS, API de vehículos y fotos subidas) requiere una
sesión activa. Las credenciales se validan contra la tabla `Usuarios`
(contraseñas con `scrypt` + salt) y la sesión se identifica con una cookie
`httpOnly` respaldada por la tabla `Sesiones` (expira a los 7 días).

Hay dos roles:

- **admin**: acceso total (alta/edición/borrado de vehículos, papelera,
  subida de fotos, gestión de usuarios).
- **vendedor**: puede ver el stock, buscar/filtrar, exportar CSV, ver el
  historial y cambiar el estado de un vehículo (Reservar/Vender/Disponible).
  No puede crear, editar ni eliminar vehículos, ni gestionar usuarios.

| Método | Ruta                     | Descripción                          | Rol |
|--------|--------------------------|----------------------------------------|-----|
| POST   | `/api/auth/login`        | Inicia sesión (`{ username, password }`) | — |
| POST   | `/api/auth/logout`       | Cierra la sesión actual                | cualquiera |
| GET    | `/api/auth/me`           | Usuario autenticado (incluye `rol`)    | cualquiera |
| PATCH  | `/api/auth/me/password`  | Cambia la contraseña propia            | cualquiera |
| GET    | `/api/usuarios`          | Lista usuarios del panel               | admin |
| POST   | `/api/usuarios`          | Crea un usuario (`{ username, password, rol }`) | admin |
| PATCH  | `/api/usuarios/:id`      | Cambia rol y/o contraseña de otro usuario | admin |
| DELETE | `/api/usuarios/:id`      | Elimina un usuario (no a uno mismo, ni al último admin) | admin |

## API REST de vehículos

| Método | Ruta                              | Descripción                                            | Rol |
|--------|------------------------------------|---------------------------------------------------------|-----|
| GET    | `/api/vehiculos`                  | Lista paginada. Filtros: `q`, `estado`, `km` (`0km`/`usado`), `papelera=1`. Orden: `orden` (`marca`/`anio`/`kilometraje`/`precio`/`created_at`), `direccion` (`asc`/`desc`). Paginación: `pagina`, `porPagina` (máx. 100) | admin, vendedor |
| GET    | `/api/vehiculos/resumen`          | KPIs: totales por estado y valor de stock activo (ARS/USD) | admin, vendedor |
| GET    | `/api/vehiculos/export.csv`       | Exporta a CSV el listado filtrado (sin paginar)         | admin, vendedor |
| GET    | `/api/vehiculos/:id`              | Obtiene un vehículo                                    | admin, vendedor |
| GET    | `/api/vehiculos/:id/historial`    | Historial de cambios de estado                         | admin, vendedor |
| POST   | `/api/vehiculos`                  | Crea un vehículo                                       | admin |
| PUT    | `/api/vehiculos/:id`              | Actualiza un vehículo (reemplazo completo)              | admin |
| PATCH  | `/api/vehiculos/:id/estado`       | Cambia solo el estado (Disponible/Reservado/Vendido)    | admin, vendedor |
| PATCH  | `/api/vehiculos/:id/restaurar`    | Restaura un vehículo desde la papelera                  | admin |
| DELETE | `/api/vehiculos/:id`              | Borrado lógico (va a la papelera)                       | admin |
| DELETE | `/api/vehiculos/:id/permanente`   | Borra definitivamente (solo si ya está en la papelera)  | admin |
| POST   | `/api/uploads`                    | Sube fotos (`multipart/form-data`, campo `imagenes`)     | admin |

`GET /api/vehiculos` devuelve `{ items, total, pagina, porPagina, totalPaginas }`.

La patente (`dominio`) es única entre los vehículos activos; intentar
duplicarla devuelve `409`. Los datos inválidos devuelven `400` con el
detalle de los errores. Toda la API de vehículos y de subida de fotos
requiere sesión (401 si no la hay, 403 si el rol no alcanza).

## Ficha pública (compartible)

`GET /api/public/vehiculos/:id` no requiere sesión y expone solo los datos
aptos para un comprador (marca, modelo, año, precio, kilometraje, estado,
fotos, notas — sin patente ni datos de auditoría). `/ficha.html?id=<id>`
es la página pública correspondiente, con botones para compartir por
WhatsApp, copiar el enlace o imprimir. Desde el panel, el botón "Ficha" de
cada vehículo abre esta página en una pestaña nueva.

## Panel de administración

Servido como estáticos desde `/public`, sin build step (Tailwind vía CDN).
Incluye:

- Login con sesión persistente, roles (admin/vendedor) y cambio de
  contraseña propio.
- Gestión de usuarios (alta, cambio de rol, baja) para administradores.
- KPIs de stock (total, por estado, valor de stock activo en ARS/USD).
- Buscador, filtros por estado/condición, orden de columnas server-side
  (marca, año, kilometraje, precio) y paginación configurable.
- Alta y edición en modal, con subida de fotos (o pegado de URLs externas).
- Badges de estado y acciones rápidas de cambio de estado en la tabla.
- Papelera (borrado lógico) con opción de restaurar o eliminar definitivamente.
- Historial de cambios de estado por vehículo.
- Ficha pública compartible/imprimible por vehículo.
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
