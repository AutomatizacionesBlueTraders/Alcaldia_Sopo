# Despliegue del frontend en Vercel

Estos pasos dejan **el frontend en Vercel** y **el backend + DB + n8n** en su lugar actual (EasyPanel). Es la opción recomendada — no requiere reescribir el backend.

## 1. Pre-requisitos

- Cuenta en Vercel (gratuita sirve).
- El backend debe estar expuesto públicamente con HTTPS. En EasyPanel ya lo está vía el proxy `/api`.
- Dominio del backend (ej. `https://backend.transporte-sopo.easypanel.host`).

## 2. Importar el repo en Vercel

1. Vercel → *Add New Project* → conectar GitHub → elegir el repo `Alcaldia_sopo`.
2. **Root Directory**: `frontend`  (muy importante).
3. Framework preset: `Vite` (lo detecta solo).
4. El `vercel.json` del repo ya define `buildCommand`, `outputDirectory` y los rewrites SPA.

## 3. Variables de entorno en Vercel

En *Project Settings → Environment Variables* agregar:

| Variable | Valor | Scope |
|---|---|---|
| `VITE_API_BASE_URL` | `https://TU-BACKEND.easypanel.host/api` | Production, Preview, Development |

**OJO**: debe terminar en `/api` (el prefix de tus rutas) y sin slash al final. Ejemplo:
`https://backend.transporte-sopo.easypanel.host/api`

## 4. Ajustes en el backend (EasyPanel)

En las variables de entorno del backend agregar:

| Variable | Valor |
|---|---|
| `APP_URL` | `https://TU-APP.vercel.app` |
| `CORS_ORIGINS` | `https://TU-APP.vercel.app,https://*.vercel.app` |
| `RESEND_API_KEY` | (tu key de Resend) |
| `RESEND_FROM_EMAIL` | ej. `noreply@transporte.sopo.gov.co` |
| `RESEND_FROM_NAME` | `Alcaldía de Sopó — Transporte` |
| `PASSWORD_RESET_TTL_MIN` | `60` |

- `APP_URL` se usa para construir los enlaces que van en los correos (bienvenida / reset). Debe apuntar al dominio **Vercel**.
- `CORS_ORIGINS` debe incluir exactamente el dominio Vercel (el preview `vercel.app` y el custom que agregues).

## 5. Probar

1. Deploy manual en Vercel → esperar build OK.
2. Abrir `https://TU-APP.vercel.app/login`.
3. Login con admin seed → verificar que llega a `/admin`.
4. Crear usuario nuevo desde `/admin/usuarios` → verificar que llega el correo con enlace que apunta a `https://TU-APP.vercel.app/restablecer-password?token=...`.

## 6. Dominio custom (opcional)

1. Vercel → *Domains* → agregar (ej. `transporte.sopo.gov.co`).
2. Actualizar en el backend:
   - `APP_URL=https://transporte.sopo.gov.co`
   - `CORS_ORIGINS=https://transporte.sopo.gov.co`

## 7. ¿Qué NO se mueve a Vercel?

- Backend Node/Express → queda en EasyPanel.
- PostgreSQL + pgvector → queda en EasyPanel.
- Uploads de audios / archivos (`/uploads`) → se sirven desde el backend.
- n8n → queda externo (ya lo está).
- Webhooks de Twilio → apuntan al backend de EasyPanel.

Si algún día quieres mover también el backend a Vercel serverless, hay que:
- Mover DB a Neon / Supabase / Vercel Postgres (con pgvector).
- Refactorizar `app.js` a serverless functions (carpeta `api/`).
- Mover migraciones a un CI step (no corren al arrancar como ahora).
- Mover uploads a Vercel Blob o S3.

Ese trabajo no está hecho en este PR.
