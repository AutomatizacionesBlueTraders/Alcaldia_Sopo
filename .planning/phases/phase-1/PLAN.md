# Fase 1 — Infraestructura + Base de Datos

## Goal
Proyecto Docker listo para EasyPanel, BD migrada con esquema completo, backend con auth JWT funcionando.

## Stack
- **Runtime:** Node.js 20 LTS
- **Backend:** Express.js + Knex.js
- **BD:** PostgreSQL 16
- **Frontend base:** React 18 + Vite + Tailwind CSS
- **Deploy:** Docker containers para EasyPanel

## Estructura
```
alcaldia-sopo/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── knexfile.js
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── db/
│       │   ├── migrations/
│       │   └── seeds/
│       ├── middleware/
│       ├── routes/
│       └── controllers/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
├── docker-compose.yml
├── .env.example
└── nginx/
    └── default.conf
```

## Tareas

### T1.1 — Estructura + Docker
- [ ] Crear carpetas backend/ y frontend/
- [ ] docker-compose.yml con: postgres, backend, frontend, n8n
- [ ] Dockerfiles (backend: node, frontend: nginx)
- [ ] nginx/default.conf para frontend
- [ ] .env.example

### T1.2 — Backend base
- [ ] package.json con dependencias
- [ ] app.js con Express configurado (cors, json, routes)
- [ ] knexfile.js configurado
- [ ] GET /api/health

### T1.3 — Migraciones BD
- [ ] dependencias
- [ ] usuarios
- [ ] conductores
- [ ] vehiculos
- [ ] solicitudes
- [ ] asignaciones
- [ ] calendario_vehiculos
- [ ] calendario_conductores
- [ ] combustible
- [ ] mantenimientos
- [ ] novedades
- [ ] evidencias
- [ ] documentos
- [ ] encuestas
- [ ] historial_solicitudes
- [ ] transferencias

### T1.4 — Seeds
- [ ] Dependencias reales del municipio
- [ ] Usuarios de prueba (1 admin, 3 deps, 2 conductores)
- [ ] Vehículos de la flota
- [ ] Conductores

### T1.5 — Auth JWT
- [ ] POST /api/auth/login
- [ ] POST /api/auth/refresh
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me
- [ ] Middleware requireAuth
- [ ] Middleware requireRole(...roles)

### T1.6 — Frontend base
- [ ] Vite + React + Tailwind configurado
- [ ] Pantalla de login
- [ ] Routing por rol (admin→/admin, dep→/solicitudes, conductor→/servicios)
- [ ] AuthContext + protección de rutas
- [ ] Axios con interceptores (JWT refresh)

## Criterios de Aceptación
- [ ] docker compose up levanta todo sin errores
- [ ] Migraciones corren correctamente
- [ ] Seeds cargan datos
- [ ] Login retorna JWT válido
- [ ] Ruta protegida rechaza rol incorrecto con 403
- [ ] Frontend redirige a login sin token
- [ ] Health check retorna 200
