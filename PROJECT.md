# Sistema de Gestión de Transporte — Alcaldía de Sopó

## Descripción
Sistema integral para gestionar solicitudes de transporte, asignación de flota, control de combustible, mantenimiento y control documental del parque automotor de la Alcaldía de Sopó.

## Objetivo
Reemplazar el proceso manual basado en hojas de cálculo y WhatsApp informal por una plataforma centralizada con bot de WhatsApp, interfaces web por rol y automatización de flujos administrativos.

## Infraestructura
- **Despliegue:** Docker Compose en VPS existente
- **Backend:** Node.js + Express
- **Frontend:** React (Vite) — interfaces independientes por rol
- **Base de datos:** PostgreSQL
- **WhatsApp:** Meta Business API (Cloud API + Flows)
- **Archivos:** Almacenamiento local en VPS (volumen Docker)
- **Auth:** JWT con control de acceso por rol

## Roles
| Rol | Acceso |
|-----|--------|
| Administradora | Control total — única que agenda y asigna recursos |
| Dependencia | Solicita, consulta, cancela, transfiere |
| Conductor | Ejecuta servicios, registra información operativa |
| Sistema | Automatiza notificaciones, confirmaciones, encuestas |

## Estados de Solicitud
`BORRADOR` → `ENVIADA` → `PENDIENTE_PROGRAMACION` → `PROGRAMADA` → `PENDIENTE_CONFIRMACION` → `CONFIRMADA` / `NO_CONFIRMADA` → `EN_EJECUCION` → `FINALIZADA`

Estados alternos: `CANCELADA`, `RECHAZADA`, `TRANSFERIDA`

## Reglas de Negocio
- Solo la administradora agenda y asigna recursos
- Las dependencias no pueden asignar vehículos ni conductores
- Los conductores no modifican la programación
- Todo debe tener trazabilidad completa
- No se eliminan datos — solo se desactivan (soft delete)

## Milestone Actual
**Milestone 1 — MVP Core**

## Progreso
Ver `.planning/ROADMAP.md`
