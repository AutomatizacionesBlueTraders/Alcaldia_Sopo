# ROADMAP — Sistema de Transporte Alcaldía de Sopó

## Milestone 1 — MVP Core
*Flujo principal operativo: solicitudes + programación + confirmaciones + ejecución*

### Fase 1 — Infraestructura Base
**Goal:** Proyecto ejecutable con Docker, base de datos migrada y autenticación por rol funcionando.

Entregables:
- Repositorio estructurado (monorepo: backend + frontend-admin + frontend-dep + frontend-conductor)
- Docker Compose con servicios: postgres, backend, nginx
- Esquema de base de datos completo (migraciones con todas las tablas)
- API de autenticación (login, JWT, refresh, logout)
- Middleware de autorización por rol
- Seed de datos iniciales (dependencias, usuarios de prueba, vehículos)

HU cubiertas: HU-ADMIN-01, HU-DEP-01, HU-CON-01

---

### Fase 2 — Módulo de Solicitudes Web (Dependencias)
**Goal:** Un trabajador de dependencia puede iniciar sesión, crear una solicitud de transporte, consultarla, cancelarla y transferirla desde la interfaz web.

Entregables:
- Panel de dependencia: dashboard con contadores por estado
- Formulario de creación de solicitud (todos los campos requeridos)
- Tabla de mis solicitudes con filtros y búsqueda
- Vista de detalle de solicitud
- Acción de cancelar solicitud (con motivo)
- Acción de transferir solicitud a otra dependencia
- Validaciones de formulario en frontend y backend

HU cubiertas: HU-DEP-01 a HU-DEP-16, HU-DEP-20, HU-DEP-21, HU-DEP-24

---

### Fase 3 — Panel Administradora: Solicitudes y Programación
**Goal:** La administradora puede ver todas las solicitudes, programar servicios asignando vehículo y conductor con validación de disponibilidad, y reprogramar/cancelar.

Entregables:
- Dashboard administradora: KPIs del día (nuevas, pendientes, confirmadas, servicios del día, alertas documentos)
- Tabla de solicitudes con filtros (fecha, estado, dependencia, tipo, canal)
- Vista de detalle de solicitud con identificador de canal (WhatsApp/web)
- Modal de programación: selección de vehículo disponible, conductor disponible, horario
- Validación de conflictos de horario (vehículo y conductor)
- Bloqueo de calendario al programar
- Reprogramación de servicios
- Vista de cancelaciones con liberación de recursos
- Vista de transferencias

HU cubiertas: HU-ADMIN-01 a HU-ADMIN-17

---

### Fase 4 — Panel Conductor: Ejecución de Servicios
**Goal:** El conductor puede ver sus servicios asignados, iniciar/finalizar un servicio, registrar kilometraje y combustible, y reportar novedades del vehículo.

Entregables:
- Dashboard conductor: servicios del día, próximos, vehículo asignado, alertas
- Lista de servicios con calendario
- Vista de detalle del servicio (hora, origen, destino, pasajeros, contacto, observaciones)
- Acción de iniciar servicio (cambia estado a EN_EJECUCION)
- Acción de finalizar servicio (solicita km final)
- Registro de kilometraje inicial y final con validación
- Registro manual de tanqueo (galones, valor, km)
- Subida de ticket de combustible (foto)
- Formulario de reporte de novedad (tipo, descripción, gravedad, evidencia fotográfica)
- Formulario de reporte de tecnomecánica realizada (con soporte)
- Vista de documentos del vehículo y alertas de vencimiento

HU cubiertas: HU-CON-01 a HU-CON-29

---

### Fase 5 — Bot WhatsApp: Solicitudes y Confirmaciones
**Goal:** Un solicitante puede crear una solicitud de transporte por WhatsApp usando un Flow interactivo, consultar el estado de su solicitud y confirmar/rechazar el servicio programado.

Entregables:
- Integración con Meta Business Cloud API (webhook verificado)
- Menú interactivo de bienvenida (botones)
- WhatsApp Flow para solicitud de transporte (todos los campos del formulario)
- Registro de solicitud en BD con canal = 'whatsapp'
- Mensaje de confirmación de recibo al solicitante
- Consulta de estado de solicitud por WhatsApp (ingresa número/ID)
- Envío automático de mensaje de confirmación cuando se programa el servicio
- Botones de respuesta: Confirmar / Rechazar
- Procesamiento de respuesta → actualiza estado en BD + notifica administradora
- Mensaje de recordatorio automático (24h antes del servicio)

HU cubiertas: HU-SOL-01 a HU-SOL-21

---

## Milestone 2 — Gestión de Flota

### Fase 6 — Módulo de Vehículos y Conductores (CRUD Admin)
**Goal:** La administradora puede gestionar el catálogo completo de vehículos (activos/en reposo/maquinaria) y conductores, con visualización de calendarios individuales.

Entregables:
- CRUD de vehículos (placa, tipo, marca, modelo, estado, km actual)
- CRUD de conductores (nombre, teléfono, licencia, vencimiento licencia, estado)
- Vista de flota con estado actual de cada vehículo
- Calendario de vehículo (servicios asignados, bloqueos)
- Agenda de conductor (servicios asignados, horarios)
- Soft delete (desactivar, no eliminar)

HU cubiertas: HU-ADMIN-18 a HU-ADMIN-22

---

### Fase 7 — Control de Combustible
**Goal:** La administradora puede ver el historial completo de combustible por vehículo con métricas de consumo, y el conductor puede registrar tanqueos con foto de ticket.

Entregables:
- Panel de combustible para administradora
- Tabla de registros por vehículo (fecha, galones, valor, km, ticket)
- Métricas de consumo: día / semana / mes / año
- Visor de ticket de combustible (imagen)
- Historial de combustible para el conductor (solo su vehículo)
- Exportación de datos a CSV/Excel

HU cubiertas: HU-ADMIN-23, HU-ADMIN-24, HU-CON-12 a HU-CON-14

---

### Fase 8 — Novedades y Mantenimiento
**Goal:** El conductor reporta daños con evidencia fotográfica y nivel de gravedad; la administradora recibe las novedades, decide si el vehículo va a mantenimiento y hace seguimiento.

Entregables:
- Formulario de novedad del conductor (tipo, descripción, urgencia, puede_operar, fotos)
- Panel de novedades para administradora con estado (pendiente, en revisión, enviado a mantenimiento, resuelto)
- Acción de enviar vehículo a mantenimiento (cambia estado del vehículo)
- Registro de mantenimiento (tipo, fecha, descripción, estado)
- Historial de mantenimientos por vehículo
- Notificación WhatsApp al conductor cuando se resuelve la novedad

HU cubiertas: HU-ADMIN-25, HU-ADMIN-26, HU-CON-15 a HU-CON-18

---

### Fase 9 — Control Documental
**Goal:** La administradora puede registrar y consultar documentos del parque automotor (SOAT, seguro, tecnomecánica) con alertas de vencimiento.

Entregables:
- CRUD de documentos por vehículo (tipo, fecha expedición, fecha vencimiento, soporte)
- Tipos: SOAT, Seguro, Tecnomecánica
- Semáforo de estado (vigente / por vencer / vencido)
- Alertas en dashboard administradora de documentos próximos a vencer (30/15/0 días)
- Validación de tecnomecánica reportada por conductor (flujo aprobación)
- Alertas en dashboard conductor de documentos de su vehículo
- Notificación WhatsApp automática cuando un documento está por vencer

HU cubiertas: HU-ADMIN-27 a HU-ADMIN-29, HU-CON-19 a HU-CON-23

---

## Milestone 3 — Módulos Avanzados

### Fase 10 — Reportes e Indicadores
**Goal:** La administradora puede consultar reportes agregados del sistema y exportarlos.

Entregables:
- Reporte de servicios (por fecha, dependencia, conductor, vehículo, estado)
- Reporte de uso de flota (km recorridos, servicios por vehículo)
- Reporte de consumo de combustible (por vehículo, por período)
- Reporte de mantenimientos
- Trazabilidad completa de solicitudes (historial de cambios de estado)
- Exportación a Excel/PDF

HU cubiertas: HU-ADMIN-35 a HU-ADMIN-38

---

### Fase 11 — Encuestas de Satisfacción
**Goal:** Al finalizar un servicio el sistema envía automáticamente una encuesta por WhatsApp al solicitante, y la administradora puede ver los resultados.

Entregables:
- Envío automático de encuesta por WhatsApp al finalizar servicio
- Formulario de calificación (1-5 estrellas + comentario)
- Registro de respuestas en BD
- Panel de resultados de encuestas para administradora (calificación promedio, historial)

HU cubiertas: HU-SOL-18, HU-SOL-19, HU-ADMIN-34

---

### Fase 12 — Gestión de Usuarios y Dependencias (Admin)
**Goal:** La administradora puede crear y administrar usuarios del sistema, asignar roles y gestionar dependencias.

Entregables:
- CRUD de dependencias (nombre, estado)
- CRUD de usuarios (nombre, email, rol, dependencia)
- Asignación de roles
- Restablecimiento de contraseña

HU cubiertas: HU-ADMIN-30 a HU-ADMIN-33, HU-ADMIN-38

---

## Estado del Proyecto

| Fase | Nombre | Estado |
|------|--------|--------|
| 1 | Infraestructura Base | Pendiente |
| 2 | Solicitudes Web (Dependencias) | Pendiente |
| 3 | Panel Administradora + Programación | Pendiente |
| 4 | Panel Conductor | Pendiente |
| 5 | Bot WhatsApp | Pendiente |
| 6 | Vehículos y Conductores (CRUD) | Pendiente |
| 7 | Control de Combustible | Pendiente |
| 8 | Novedades y Mantenimiento | Pendiente |
| 9 | Control Documental | Pendiente |
| 10 | Reportes e Indicadores | Pendiente |
| 11 | Encuestas de Satisfacción | Pendiente |
| 12 | Gestión de Usuarios y Dependencias | Pendiente |
