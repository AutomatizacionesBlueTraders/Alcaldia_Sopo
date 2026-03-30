# Fase 2 — Módulo de Solicitudes Web (Dependencias)

## Goal
Un trabajador de dependencia puede iniciar sesión, crear una solicitud de transporte, ver el estado de sus solicitudes, cancelar y transferir desde la interfaz web.

## Dependencias
- Fase 1 completada (auth, BD, estructura)

## Tareas

### T2.1 — API: endpoints de solicitudes (dependencia)
- [ ] `POST /api/solicitudes` — crear solicitud (canal: web, estado inicial: ENVIADA)
- [ ] `GET /api/solicitudes?dependencia_id=&estado=&fecha=` — listar solicitudes de mi dependencia
- [ ] `GET /api/solicitudes/:id` — detalle de solicitud (solo si pertenece a mi dependencia)
- [ ] `PATCH /api/solicitudes/:id/cancelar` — cancelar con motivo (registra en historial)
- [ ] `POST /api/solicitudes/:id/transferir` — transferir a otra dependencia (registra en transferencias)
- [ ] `GET /api/dependencias` — lista de dependencias activas (para selector en transferir)
- [ ] Validaciones: fecha no puede ser en el pasado, campos obligatorios

### T2.2 — API: catálogos para formulario
- [ ] `GET /api/catalogos/tipos-servicio` — lista de tipos de servicio disponibles
- [ ] `GET /api/catalogos/origenes` — lista de lugares comunes de salida

### T2.3 — Frontend Dependencia: Dashboard
- [ ] Contadores por estado: pendientes, programadas, confirmadas, canceladas, transferidas
- [ ] Listado de solicitudes recientes (últimas 10)
- [ ] Acceso rápido a "Nueva solicitud"

### T2.4 — Frontend Dependencia: Crear solicitud
- [ ] Formulario con todos los campos:
  - Fecha del servicio (date picker, mín: mañana)
  - Hora de inicio y hora estimada de fin
  - Lugar de salida (origen)
  - Destino
  - Número de pasajeros
  - Tipo de servicio (selector)
  - Nombre del contacto
  - Teléfono del contacto
  - Observaciones (opcional)
- [ ] Validaciones en tiempo real
- [ ] Pantalla de confirmación antes de enviar
- [ ] Mensaje de éxito con número de radicado

### T2.5 — Frontend Dependencia: Mis solicitudes
- [ ] Tabla con columnas: ID, fecha, destino, estado, canal, acciones
- [ ] Filtros: por estado, por fecha (rango)
- [ ] Búsqueda por destino u observaciones
- [ ] Paginación (20 por página)
- [ ] Indicador visual de estado (badge de color por estado)

### T2.6 — Frontend Dependencia: Detalle de solicitud
- [ ] Vista completa de todos los campos
- [ ] Historial de cambios de estado (línea de tiempo)
- [ ] Botón "Cancelar" (visible solo si estado lo permite: ENVIADA, PENDIENTE_PROGRAMACION)
- [ ] Botón "Transferir" (visible solo si estado lo permite)
- [ ] Si está PROGRAMADA: muestra vehículo y conductor asignado

### T2.7 — Frontend Dependencia: Modal de cancelación
- [ ] Campo de motivo (obligatorio, mínimo 20 caracteres)
- [ ] Confirmación antes de proceder
- [ ] Actualización en tiempo real del estado en la tabla

### T2.8 — Frontend Dependencia: Modal de transferencia
- [ ] Selector de dependencia destino
- [ ] Campo de motivo
- [ ] Confirmación

## Criterios de Aceptación
- [ ] Un usuario de dependencia puede crear una solicitud y recibe un ID de radicado
- [ ] La solicitud aparece en la tabla con estado ENVIADA
- [ ] Un usuario de dependencia NO puede ver solicitudes de otra dependencia
- [ ] La cancelación registra motivo y fecha en el historial
- [ ] La transferencia aparece en la tabla de la dependencia destino
- [ ] Los filtros de la tabla funcionan correctamente
- [ ] Un usuario con rol distinto a `dependencia` recibe 403 al acceder a estas rutas

## Estados permitidos para cancelar
`ENVIADA`, `PENDIENTE_PROGRAMACION`

## Estados permitidos para transferir
`ENVIADA`, `PENDIENTE_PROGRAMACION`
