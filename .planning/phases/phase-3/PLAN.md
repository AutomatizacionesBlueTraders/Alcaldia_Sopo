# Fase 3 — Panel Administradora: Solicitudes y Programación

## Goal
La administradora puede ver todas las solicitudes del sistema, programar servicios asignando vehículo y conductor con validación de disponibilidad, reprogramar y cancelar.

## Dependencias
- Fase 1 (auth, BD)
- Fase 2 (modelo de solicitudes)

## Tareas

### T3.1 — API: solicitudes para administradora
- [ ] `GET /api/admin/solicitudes` — todas las solicitudes con filtros: fecha, estado, dependencia_id, canal, tipo_servicio
- [ ] `GET /api/admin/solicitudes/:id` — detalle completo con historial
- [ ] `PATCH /api/admin/solicitudes/:id/rechazar` — rechazar solicitud (con motivo)
- [ ] `PATCH /api/admin/solicitudes/:id/cancelar` — cancelar cualquier solicitud (admin)
- [ ] `GET /api/admin/dashboard` — KPIs del día

### T3.2 — API: programación de servicios
- [ ] `GET /api/admin/vehiculos/disponibles?fecha=&hora_inicio=&hora_fin=` — vehículos disponibles en franja horaria
- [ ] `GET /api/admin/conductores/disponibles?fecha=&hora_inicio=&hora_fin=` — conductores disponibles
- [ ] `POST /api/admin/solicitudes/:id/programar` — asignar vehículo + conductor + horario
  - Valida disponibilidad antes de guardar
  - Bloquea calendario de vehículo y conductor
  - Cambia estado a PROGRAMADA
  - Registra en historial
- [ ] `PATCH /api/admin/asignaciones/:id/reprogramar` — cambiar vehículo/conductor/horario
  - Libera bloqueos anteriores, crea nuevos
- [ ] `GET /api/admin/calendario?fecha=` — vista de servicios del día en formato timeline

### T3.3 — Frontend Admin: Dashboard
- [ ] Cards de KPIs: Nuevas hoy, Pendientes programación, Pendientes confirmación, Confirmadas, En ejecución, Servicios del día
- [ ] Lista de servicios del día (hora, destino, conductor, vehículo, estado)
- [ ] Alertas: documentos por vencer, novedades abiertas
- [ ] Acceso rápido por sección

### T3.4 — Frontend Admin: Gestión de solicitudes
- [ ] Tabla principal con todas las solicitudes
- [ ] Columnas: ID, Fecha, Dependencia, Origen→Destino, Pasajeros, Estado, Canal (ícono WhatsApp/web), Acciones
- [ ] Filtros: fecha (rango), estado (multi-select), dependencia, tipo de servicio, canal
- [ ] Badge de estado con colores diferenciados
- [ ] Paginación

### T3.5 — Frontend Admin: Detalle y programación
- [ ] Vista de detalle de solicitud con toda la información
- [ ] Panel lateral de programación (aparece si estado = PENDIENTE_PROGRAMACION)
- [ ] Selector de fecha/hora del servicio
- [ ] Selector de vehículo (muestra disponibles en esa franja, con placa y tipo)
- [ ] Selector de conductor (muestra disponibles en esa franja, con nombre)
- [ ] Alerta visual si hay conflicto de horario
- [ ] Botón "Programar" — confirma la asignación
- [ ] Línea de tiempo de historial de estados

### T3.6 — Frontend Admin: Vista de reprogramación
- [ ] Modal de reprogramación accesible desde solicitudes PROGRAMADAS
- [ ] Permite cambiar vehículo, conductor, fecha u hora
- [ ] Muestra disponibilidad actualizada al cambiar parámetros

### T3.7 — Frontend Admin: Cancelaciones y rechazos
- [ ] Modal de cancelación con campo de motivo
- [ ] Modal de rechazo con campo de motivo
- [ ] Vista de solicitudes canceladas (separada o filtro)

## Criterios de Aceptación
- [ ] La administradora ve TODAS las solicitudes de TODAS las dependencias
- [ ] Al intentar programar con un vehículo ocupado, el sistema lo bloquea y muestra error claro
- [ ] Al programar, el estado cambia a PROGRAMADA y queda registrado en el historial
- [ ] Los calendarios de vehículo y conductor se bloquean con el horario asignado
- [ ] La reprogramación libera el bloqueo anterior y crea uno nuevo
- [ ] Un usuario con rol `dependencia` recibe 403 al acceder a rutas de admin
