# Sistema GYG

Sistema de Control de Stock y Gestión para una concesionaria de vehículos.

- **Fase 1**: panel de administración y backend locales (Node.js + Express + SQLite).
- **Fase 2**: publicación del stock a un catálogo web público (ej. un sitio de
  Blogger) vía un Gist de GitHub, con un botón "Publicar en la web" desde el
  panel. Ver la sección [Publicar en la web](#publicar-en-la-web-fase-2).

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
    vehiculos.js          CRUD, papelera, historial, resumen KPI, export/import CSV, paginación
    uploads.js            Subida de fotos (local + Imgur, solo admin)
    public.js              API pública de solo lectura para la ficha compartible
    config.js              Configuración del catálogo público (nombre, WhatsApp, redes, etc.)
    sync.js                 Endpoint que publica el stock en el Gist (fase 2)
  sync/
    gist.js                 Mapeo de datos y publicación en el Gist (GitHub API)
  scripts/
    backup.js             Backup manual/programado de la base SQLite
  utils/
    csv.js                 Parser CSV (RFC 4180) reutilizado por export/import
    fotos.js               URLs públicas vs locales para el catálogo web
    imgur.js               Subida a Imgur (Client-ID) para fotos del sitio

db/
  schema.sql            Definición de tablas (Vehiculos, Usuarios, Sesiones, HistorialEstados, ConfiguracionSitio, Meta)
  concesionaria.db       Archivo SQLite (generado en runtime, no versionado)
  backups/               Backups automáticos (generado en runtime, no versionado)
public/
  login.html / login.js  Pantalla de acceso (pública)
  index.html             Panel de administración (Tailwind CDN)
  app.js                 Lógica del panel en Vanilla JS
  ficha.html / ficha.js   Ficha pública de un vehículo (compartible, sin login)
  catalogo.html / .js     Catálogo público (mobile, zoom, contacto y redes)
  uploads/               Fotos subidas desde el panel (generado en runtime)
blogger/
  tema.xml               Tema de Blogger (XML) con el catálogo incrustado
tests/
  validators.test.js     Casos unitarios de reglas de negocio
  auth.test.js            Login, logout, cambio de contraseña
  roles.test.js           Permisos admin vs. vendedor, gestión de usuarios
  public.test.js          Ficha pública sin sesión
  csv.test.js             Parser CSV (comillas, comas, BOM, acentos)
  import.test.js          Importación masiva de vehículos por CSV
  config.test.js          Configuración del catálogo público
  gist.test.js            Mapeo de datos y publicación en el Gist (fetch mockeado)
  blogger-tema.test.js    El tema de Blogger conserva el diseño GyG y el zoom
  fotos.test.js           URLs públicas vs locales para Blogger
  imgur.test.js           Subida a Imgur (fetch mockeado)
  sync.test.js            Endpoint /api/sync/publicar (fetch mockeado)
  api.test.js             CRUD, papelera, historial, filtros, paginación, export CSV
```

## Cómo correr

```bash
npm install
npm test
npm start   # http://localhost:3000
```

En Windows, para una demo en otra PC, lo más simple es copiar `env.example`
a `.env`, completar tokens y correr:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\iniciar.ps1
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

## Preparar el sistema en otra PC (Windows)

El stock **no viaja con Git**: `db/concesionaria.db` queda en cada máquina.
Si querés mostrar los mismos autos, copiá ese archivo desde la PC original
a `db\concesionaria.db` en esta (con el servidor parado).

1. Instalá [Git](https://git-scm.com/download/win) y **[Node.js 22 LTS](https://nodejs.org)**
   (botón verde **LTS**, no Current/24).
2. **Cerrá y volvé a abrir** PowerShell.
3. Andá al Escritorio (no uses `C:\Windows\system32`):

```powershell
cd $env:USERPROFILE\Desktop
git clone https://github.com/denissslaguiarrr-arch/sistema-gyg.git
cd sistema-gyg
git checkout cursor/paso-1-schema-servidor-9f90
```

4. Completá las claves una sola vez:

```powershell
copy env.example .env
notepad .env
```

Pegá `GYG_GITHUB_TOKEN` (permiso `gist`) y `GYG_IMGUR_CLIENT_ID`. El
`GYG_GIST_ID` ya viene cargado. Guardá y cerrá el Bloc de notas.

5. Arranque:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\iniciar.ps1
```

6. En el navegador: http://localhost:3000  
   Usuario `admin` / contraseña `admin123`.

7. Para el cliente: cargá 1 o 2 autos con fotos (arrastrar a la dropzone),
   **Configuración del sitio** (WhatsApp real), **Publicar en la web**, y
   abrí https://gyg-automotores.blogspot.com/

### Si `npm install` falla (better-sqlite3 / Visual Studio / express)

Eso pasa sobre todo con **Node 24** (Current): `better-sqlite3` 11 no trae
binarios listos y Windows intenta compilar C++ sin Visual Studio. El script
igual seguía a `npm start` y terminaba en `Cannot find module 'express'`.

En la PC de la demo:

```powershell
cd $env:USERPROFILE\Desktop\sistema-gyg
git pull
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
powershell -ExecutionPolicy Bypass -File scripts\iniciar.ps1
```

Si sigue fallando, instalá Node **22 LTS** (desinstalá el 24 o dejá el 22
primero en el PATH), cerrá PowerShell, borra `node_modules` y repetí el
script. No hace falta instalar Visual Studio.

Si ves `EPERM` en `tar-fs` (OneDrive), cerrá el Explorador sobre esa carpeta
y borra `node_modules` de nuevo. Si persiste, copiá el proyecto fuera de
OneDrive (por ejemplo `C:\sistema-gyg`).

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
| GET    | `/api/vehiculos/plantilla.csv`    | Descarga una plantilla CSV de ejemplo para importar     | admin, vendedor |
| POST   | `/api/vehiculos/import`           | Importa vehículos desde un CSV (`multipart/form-data`, campo `archivo`) | admin |
| GET    | `/api/vehiculos/:id`              | Obtiene un vehículo                                    | admin, vendedor |
| GET    | `/api/vehiculos/:id/historial`    | Historial de cambios de estado                         | admin, vendedor |
| POST   | `/api/vehiculos`                  | Crea un vehículo                                       | admin |
| PUT    | `/api/vehiculos/:id`              | Actualiza un vehículo (reemplazo completo)              | admin |
| PATCH  | `/api/vehiculos/:id/estado`       | Cambia solo el estado (Disponible/Reservado/Vendido)    | admin, vendedor |
| PATCH  | `/api/vehiculos/:id/restaurar`    | Restaura un vehículo desde la papelera                  | admin |
| DELETE | `/api/vehiculos/:id`              | Borrado lógico (va a la papelera)                       | admin |
| DELETE | `/api/vehiculos/:id/permanente`   | Borra definitivamente (solo si ya está en la papelera)  | admin |
| POST   | `/api/uploads`                    | Sube fotos locales (`/uploads/...`, solo el panel)       | admin |
| POST   | `/api/uploads/imgur`              | Sube fotos a Imgur y devuelve URLs públicas `https://`   | admin |

`GET /api/vehiculos` devuelve `{ items, total, pagina, porPagina, totalPaginas }`.

La patente (`dominio`) es única entre los vehículos activos; intentar
duplicarla devuelve `409`. Los datos inválidos devuelven `400` con el
detalle de los errores. Toda la API de vehículos y de subida de fotos
requiere sesión (401 si no la hay, 403 si el rol no alcanza).

### Campos opcionales para el catálogo público

Además de los campos obligatorios (marca, modelo, año, patente, kilometraje,
precio, moneda, estado), cada vehículo acepta estos campos opcionales
—pensados para completar la ficha del catálogo web—: `precio_oferta`,
`version`, `combustible`, `transmision`, `traccion`, `puertas`, `color`,
`motor`, `potencia`, `carroceria`, `destacado` (booleano) y `equipamiento`
(lista). Si no se completan, quedan vacíos y simplemente no se muestran en
la ficha.

`precio_oferta` es opcional. Si se carga, tiene que ser menor que el precio
de lista: el panel y la ficha tachan el precio original y muestran la
oferta. Al publicar, viaja al Gist en el campo `precio_oferta` (o `null`
si no hay). El catálogo de Blogger hoy muestra `precio`; para que también
se vea la oferta en el sitio hay que usar `precio_oferta` en esa plantilla.

## Importar vehículos desde CSV

Desde el panel, el botón "Importar CSV" (solo admin) abre un modal donde se
puede descargar una plantilla de ejemplo y subir un archivo `.csv` con las
columnas `marca, modelo, anio, dominio, kilometraje, precio, precio_oferta, moneda, estado,
notas, imagenes_url`. También acepta los alias `patente` (en vez de
`dominio`), `km` (en vez de `kilometraje`) y `oferta` (en vez de
`precio_oferta`), pensados para planillas armadas
a mano en Excel/Google Sheets.

Reglas de importación:

- Si la **patente ya existe** entre los vehículos activos, se **actualiza**
  ese vehículo (sin duplicar).
- Si no existe, se **crea** uno nuevo.
- El archivo se procesa fila por fila: una fila con datos inválidos **no
  aborta el resto de la importación**; se reporta en la respuesta junto con
  el número de fila y el motivo (por ejemplo, "Fila 5 (CSV004): marca es
  obligatoria").
- Cada alta o cambio de estado producido por la importación queda registrado
  en el historial del vehículo, igual que si se hiciera manualmente.

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

## Publicar en la web (fase 2)

El panel puede publicar el stock activo en un **Gist de GitHub** (un archivo
`stock.json` público) que alimenta un catálogo web (por ejemplo, un sitio de
Blogger con una plantilla que lee ese mismo Gist). El botón **"Publicar en
la web"** (solo admin) hace esto manualmente, cuando vos lo decidís.

### Configuración necesaria (una sola vez)

1. Generá un **Personal Access Token** de GitHub con permiso **`gist`**
   únicamente: [github.com/settings/tokens](https://github.com/settings/tokens/new).
2. Definí estas variables de entorno antes de arrancar el servidor (o
   agregalas como secretos si corrés esto en Cursor Cloud Agents):
   - `GYG_GIST_ID`: el ID del Gist que ya tiene (o va a tener) el `stock.json`.
   - `GYG_GITHUB_TOKEN`: el token generado en el paso 1.

```bash
GYG_GIST_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx GYG_GITHUB_TOKEN=ghp_xxx npm start
```

Sin estas dos variables, el botón "Publicar en la web" devuelve un error
explicando cuál falta configurar; el resto del sistema funciona igual.

### Qué hace "Publicar en la web"

- Toma todos los vehículos activos (no eliminados) y los mapea al esquema
  que espera el catálogo público: `status` (disponible/reservado/vendido en
  minúsculas), `categoria` (`0km` si el kilometraje es 0, `usado` si no),
  `patente`, `descripcion`, `fotos`, `equipamiento`, `precio_oferta`, `ingreso`, `updatedAt`, etc.
- Combina la **Configuración del sitio** (nombre, tagline, WhatsApp, texto de
  pie, imagen de portada — editable desde el botón "Configuración del sitio")
  con lo que ya hubiera en el Gist: si un campo local está vacío, no pisa lo
  que ya estaba publicado.
- Conserva la estructura de páginas (`pages`) que ya tenga el Gist tal cual
  está: esta fase no incluye una pantalla para editar la navegación del sitio.
- Actualiza únicamente el archivo `stock.json` del Gist indicado; no toca
  nada más del sitio.

Las fotos que arrastrás a la dropzone del formulario se suben a **Imgur**
y quedan con un link `https://i.imgur.com/...`, que Blogger sí puede
mostrar. Para eso hace falta un Client-ID:

1. Creá una app en [api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient)
   (Anonymous usage, sin callback).
2. Copiá el **Client ID**.
3. Antes de `npm start`:

```powershell
$env:GYG_IMGUR_CLIENT_ID="TU_CLIENT_ID"
npm start
```

También podés pegar el Client ID en `public/app.js` (`IMGUR_CLIENT_ID`),
pero la variable de entorno es más cómoda: no se pisa con `git pull`.

Las fotos viejas en `/uploads/...` **solo se ven en el panel local**. Al
publicar, esas rutas se omiten y el panel avisa cuántas quedaron afuera.

### Fotos recortadas, celular y Contacto (Blogger)

Los cambios van **sobre el tema GyG que ya tenían** (Syne/Manrope, vitrina,
hero), no sobre el catálogo corto de 477 líneas.

- La foto grande usa `object-fit: contain` y se puede ampliar (tocar, pellizcar o +/−).
- En el celular hay margen inferior para que Contacto no se corte.
- El título de Contacto es **Contactanos**. Instagram y Facebook se cargan
  en el panel; si el campo está vacío, esa red no aparece.

Para actualizar el blog (hacé una copia de seguridad antes):

1. Blogger → **Tema** → **Copia de seguridad** → descargar.
2. **Tema** → **Editar HTML**.
3. Seleccioná todo y pegá `blogger/tema.xml`.
4. Guardá. Si Blogger rechaza el XML, restaurá la copia del paso 1.
5. En el panel: Instagram / Facebook / texto de contacto y **Publicar en la web**.

Si cambiaste `blogger/gyg-showroom.css` o `.js`, regenerá el XML con
`npm run blogger`.

### Configuración del sitio

Desde el botón **"Configuración del sitio"** (solo admin) se edita el
nombre de la concesionaria, la frase/tagline, el número de WhatsApp (con
código de país, sin `+`), el texto de pie de página y la imagen de portada.
Estos datos se guardan localmente y se incluyen la próxima vez que
publiques.

## Próxima fase

Quedan como posibles mejoras futuras: publicación automática (en vez de
manual), edición de la estructura de páginas del catálogo desde el panel, e
IDs no secuenciales para la ficha pública.
