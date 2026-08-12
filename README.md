# Sistema GYG

Sistema de Control de Stock y Gestión para una concesionaria de vehículos.

Fase 1: panel de administración y backend locales (Node.js + Express + SQLite).
La sincronización con la nube (JSON/Gist) queda para una fase posterior.

## Estructura

```
backend/     Express + acceso a SQLite
db/           schema.sql y archivo SQLite (generado en runtime)
public/       Panel de administración (Paso 3)
```

## Cómo correr

```bash
npm install
npm start
```

El servidor queda en `http://localhost:3000`.
`GET /api/health` confirma que Express y SQLite están operativos.
