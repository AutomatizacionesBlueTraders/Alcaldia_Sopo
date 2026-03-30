# Fase 1 — Infraestructura Base

## Goal
Proyecto ejecutable con Docker, base de datos migrada con esquema completo y autenticación JWT por rol funcionando.

## Stack
- **Runtime:** Node.js 20 LTS
- **Backend framework:** Express.js
- **ORM/Query builder:** Knex.js (migraciones + queries)
- **Base de datos:** PostgreSQL 16
- **Autenticación:** JWT (jsonwebtoken) + bcrypt
- **Contenedores:** Docker + Docker Compose
- **Proxy:** Nginx (reverse proxy al backend)
- **Frontend base:** React 18 + Vite (estructura de 3 apps: admin, dependencia, conductor)

## Estructura del Repositorio
```
alcaldia-sopo/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── roles.js
│   │   ├── routes/
│   │   │   └── auth.js
│   │   ├── controllers/
│   │   │   └── auth.controller.js
│   │   └── app.js
│   └── package.json
├── frontend-admin/
│   ├── Dockerfile
│   └── (React + Vite)
├── frontend-dependencia/
│   ├── Dockerfile
│   └── (React + Vite)
├── frontend-conductor/
│   ├── Dockerfile
│   └── (React + Vite)
└── nginx/
    └── nginx.conf
```

## Tareas

### T1.1 — Estructura del repositorio y configuración Docker
- [ ] Crear estructura de carpetas del monorepo
- [ ] `docker-compose.yml` con servicios: `postgres`, `backend`, `nginx`
- [ ] `docker-compose.dev.yml` para desarrollo con hot reload
- [ ] `.env.example` con todas las variables necesarias
- [ ] `backend/Dockerfile` (multi-stage: dev + prod)
- [ ] `nginx/nginx.conf` con rutas a backend y frontends

### T1.2 — Base de datos: esquema completo
Crear migraciones con Knex para todas las tablas:

- [ ] `001_create_dependencias` — id, nombre, estado
- [ ] `002_create_usuarios` — id, nombre, email, password_hash, rol (ENUM: admin, dependencia, conductor), dependencia_id, activo
- [ ] `003_create_conductores` — id, usuario_id, nombre, telefono, licencia, vencimiento_licencia, estado
- [ ] `004_create_vehiculos` — id, placa, tipo (ENUM: vehiculo, maquinaria), marca, modelo, año, estado, km_actual, activo
- [ ] `005_create_solicitudes` — id, dependencia_id, usuario_id, fecha_servicio, hora_inicio, hora_fin_estimada, origen, destino, pasajeros, tipo_servicio, contacto_nombre, contacto_telefono, observaciones, estado (ENUM: todos los estados), canal (ENUM: web, whatsapp), created_at, updated_at
- [ ] `006_create_asignaciones` — id, solicitud_id, vehiculo_id, conductor_id, hora_inicio, hora_fin, notas, created_at
- [ ] `007_create_calendario_vehiculos` — id, vehiculo_id, fecha, hora_inicio, hora_fin, solicitud_id, tipo_bloqueo, estado
- [ ] `008_create_calendario_conductores` — id, conductor_id, fecha, hora_inicio, hora_fin, solicitud_id, estado
- [ ] `009_create_combustible` — id, vehiculo_id, conductor_id, fecha, galones, valor_cop, km_registro, ticket_url, created_at
- [ ] `010_create_mantenimientos` — id, vehiculo_id, tipo (ENUM: preventivo, correctivo, revision), fecha_reporte, fecha_ejecucion, descripcion, estado (ENUM: pendiente, en_proceso, completado), created_at
- [ ] `011_create_novedades` — id, vehiculo_id, conductor_id, solicitud_id, tipo, descripcion, urgencia (ENUM: baja, media, alta, critica), puede_operar (ENUM: si, no, limitado), estado, created_at
- [ ] `012_create_evidencias` — id, entidad_tipo, entidad_id, url, created_at
- [ ] `013_create_documentos` — id, vehiculo_id, tipo (ENUM: soat, seguro, tecnomecanica), fecha_expedicion, fecha_vencimiento, estado (ENUM: vigente, por_vencer, vencido), soporte_url, created_at
- [ ] `014_create_encuestas` — id, solicitud_id, calificacion (1-5), comentario, created_at
- [ ] `015_create_historial_solicitudes` — id, solicitud_id, estado_anterior, estado_nuevo, usuario_id, notas, created_at
- [ ] `016_create_transferencias` — id, solicitud_id, dependencia_origen_id, dependencia_destino_id, motivo, usuario_id, created_at

### T1.3 — Seeds de datos iniciales
- [ ] Seed de dependencias del municipio (10-15 dependencias reales)
- [ ] Seed de usuarios de prueba: 1 admin, 3 dependencias, 2 conductores
- [ ] Seed de vehículos basado en la hoja de flota activa
- [ ] Seed de conductores

### T1.4 — API de autenticación
- [ ] `POST /api/auth/login` — valida credenciales, retorna JWT (access + refresh)
- [ ] `POST /api/auth/refresh` — renueva access token con refresh token
- [ ] `POST /api/auth/logout` — invalida refresh token
- [ ] `GET /api/auth/me` — retorna datos del usuario autenticado

### T1.5 — Middleware de autorización por rol
- [ ] Middleware `requireAuth` — valida JWT en headers
- [ ] Middleware `requireRole(...roles)` — valida que el rol del usuario esté permitido
- [ ] Decorator de rutas protegidas
- [ ] Respuestas estandarizadas de error (401, 403)

### T1.6 — Frontend base: pantallas de login por rol
- [ ] `frontend-admin`: pantalla de login, redirección post-login a `/dashboard`
- [ ] `frontend-dependencia`: pantalla de login, redirección post-login a `/solicitudes`
- [ ] `frontend-conductor`: pantalla de login, redirección post-login a `/servicios`
- [ ] Manejo de token (localStorage, interceptores axios, refresh automático)
- [ ] Pantalla de "no autorizado" si rol no coincide

### T1.7 — Health check y documentación
- [ ] `GET /api/health` — retorna estado del servidor y conexión a BD
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Instrucciones de arranque en `README.md`

## Criterios de Aceptación
- [ ] `docker-compose up` levanta todos los servicios sin errores
- [ ] Las migraciones corren correctamente: `docker-compose exec backend npm run migrate`
- [ ] Los seeds cargan datos: `docker-compose exec backend npm run seed`
- [ ] `POST /api/auth/login` con credenciales válidas retorna token JWT
- [ ] Una ruta protegida con `requireRole('admin')` rechaza a un usuario de rol `conductor` con 403
- [ ] El frontend de admin redirige a login si no hay token válido
- [ ] `GET /api/health` retorna 200 con estado de BD

## Dependencias
Ninguna (fase inicial)

## Orden de Ejecución
T1.1 → T1.2 → T1.3 → T1.4 + T1.5 (paralelo) → T1.6 → T1.7
