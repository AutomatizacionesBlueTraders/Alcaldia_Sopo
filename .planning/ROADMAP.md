# ROADMAP — Sistema de Transporte Alcaldía de Sopó
*Demo modular — prioridad: modificabilidad*

## Stack
- **Backend:** Node.js + Express + Knex.js
- **Frontend:** React 18 + Vite + Tailwind CSS (app única, rutas por rol)
- **BD:** PostgreSQL 16
- **Automatización:** n8n (flujos WhatsApp, notificaciones)
- **Deploy:** Docker en EasyPanel (VPS)

## Milestone 1 — MVP Core

### Fase 1 — Infraestructura + Base de Datos
**Goal:** Proyecto Docker listo para EasyPanel, BD migrada con esquema completo, backend con auth JWT funcionando.

Entregables:
- Estructura del proyecto (monorepo: backend + frontend)
- Dockerfiles listos para EasyPanel (backend, frontend, postgres)
- Esquema de BD completo (migraciones Knex)
- Seeds con datos de prueba
- API de autenticación JWT
- Middleware de autorización por rol
- Health check

---

### Fase 2 — Backend API Completo
**Goal:** Todos los endpoints para los 3 roles (admin, dependencia, conductor) funcionando.

Entregables:
- API de solicitudes (CRUD + estados + historial)
- API de programación (asignar vehículo + conductor + validar disponibilidad)
- API de ejecución de servicios (iniciar, finalizar, km)
- API de combustible, novedades, documentos
- API de dashboard/KPIs por rol
- API de catálogos

HU cubiertas: todas las HU-ADMIN, HU-DEP, HU-CON

---

### Fase 3 — Frontend: Panel de Dependencia
**Goal:** Un trabajador de dependencia puede crear solicitudes, ver estado, cancelar y transferir.

Entregables:
- Login con redirección por rol
- Dashboard de dependencia (contadores por estado)
- Formulario de creación de solicitud
- Tabla de mis solicitudes (filtros, búsqueda, paginación)
- Detalle de solicitud con historial
- Cancelar y transferir solicitud

HU cubiertas: HU-DEP-01 a HU-DEP-24

---

### Fase 4 — Frontend: Panel Administradora
**Goal:** La administradora ve todas las solicitudes, programa servicios, gestiona flota.

Entregables:
- Dashboard con KPIs del día
- Tabla de todas las solicitudes (filtros por estado, dependencia, canal, fecha)
- Programación: asignar vehículo + conductor con validación de disponibilidad
- Reprogramar / cancelar / rechazar
- CRUD vehículos y conductores
- Control documental con alertas de vencimiento
- Vista de novedades y mantenimiento
- Vista de combustible con métricas

HU cubiertas: HU-ADMIN-01 a HU-ADMIN-38

---

### Fase 5 — Frontend: Panel Conductor
**Goal:** El conductor ve sus servicios, los ejecuta, registra km/combustible y reporta novedades.

Entregables:
- Dashboard del día (servicios, vehículo asignado, alertas)
- Lista/calendario de servicios
- Iniciar y finalizar servicio (con km)
- Registro de combustible con foto de ticket
- Reporte de novedades con evidencia fotográfica
- Vista de documentos del vehículo

HU cubiertas: HU-CON-01 a HU-CON-29

---

### Fase 6 — Flujos n8n: WhatsApp y Automatización
**Goal:** n8n maneja solicitudes por WhatsApp, confirmaciones, recordatorios y notificaciones automáticas.

Entregables:
- Contenedor n8n conectado al backend
- Flujo: recepción de solicitud por WhatsApp → crea en BD vía API
- Flujo: consulta de estado por WhatsApp
- Flujo: notificación al programar → botones confirmar/rechazar
- Flujo: recordatorio 24h antes del servicio
- Flujo: encuesta de satisfacción al finalizar servicio

HU cubiertas: HU-SOL-01 a HU-SOL-21

---

## Milestone 2 — Reportes y Mejoras

### Fase 7 — Reportes e Indicadores
**Goal:** Reportes agregados con exportación a Excel/PDF.

HU cubiertas: HU-ADMIN-35 a HU-ADMIN-38

---

## Estado del Proyecto

| Fase | Nombre | Estado |
|------|--------|--------|
| 1 | Infraestructura + BD | En progreso |
| 2 | Backend API Completo | Pendiente |
| 3 | Frontend: Dependencia | Pendiente |
| 4 | Frontend: Administradora | Pendiente |
| 5 | Frontend: Conductor | Pendiente |
| 6 | Flujos n8n | Pendiente |
| 7 | Reportes | Pendiente |
