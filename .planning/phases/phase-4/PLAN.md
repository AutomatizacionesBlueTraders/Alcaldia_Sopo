# Fase 4 — Panel Conductor: Ejecución de Servicios

## Goal
El conductor puede ver sus servicios asignados, iniciar y finalizar servicios, registrar kilometraje y combustible, y reportar novedades del vehículo.

## Dependencias
- Fase 1 (auth, BD)
- Fase 3 (programación, asignaciones)

## Tareas

### T4.1 — API: servicios del conductor
- [ ] `GET /api/conductor/servicios?fecha=` — servicios asignados al conductor (filtra por su ID)
- [ ] `GET /api/conductor/servicios/:id` — detalle del servicio
- [ ] `POST /api/conductor/servicios/:id/iniciar` — registra km inicial, cambia estado a EN_EJECUCION
- [ ] `POST /api/conductor/servicios/:id/finalizar` — registra km final, cambia estado a FINALIZADA
  - Activa envío de encuesta de satisfacción (evento para fase 11)
- [ ] `GET /api/conductor/vehiculo` — datos del vehículo asignado al conductor

### T4.2 — API: kilometraje y combustible
- [ ] `POST /api/conductor/combustible` — registrar tanqueo (vehiculo_id, fecha, galones, valor, km, ticket_url)
- [ ] `POST /api/conductor/combustible/ticket` — subir foto de ticket (multipart), retorna URL
- [ ] `GET /api/conductor/combustible?vehiculo_id=&limit=20` — historial de tanqueos

### T4.3 — API: novedades
- [ ] `POST /api/conductor/novedades` — reportar novedad (tipo, descripción, urgencia, puede_operar)
- [ ] `POST /api/conductor/novedades/:id/evidencia` — adjuntar foto a novedad
- [ ] `GET /api/conductor/novedades` — historial de novedades del conductor

### T4.4 — API: tecnomecánica
- [ ] `POST /api/conductor/tecnomecanica` — reportar revisión realizada (vehiculo_id, descripción, soporte_url)
- [ ] `POST /api/conductor/tecnomecanica/soporte` — subir soporte (multipart)
- [ ] `GET /api/conductor/tecnomecanica/:id` — ver estado del trámite (pendiente/aprobado/rechazado)

### T4.5 — API: documentos e información del vehículo
- [ ] `GET /api/conductor/vehiculo/documentos` — documentos del vehículo con estado de vigencia
- [ ] `GET /api/conductor/vehiculo/alertas` — alertas de vencimiento activas

### T4.6 — Frontend Conductor: Dashboard
- [ ] Servicio del día destacado (próximo o en curso)
- [ ] Lista de servicios del día con hora y estado
- [ ] Card del vehículo asignado (placa, tipo)
- [ ] Alertas activas (documentos por vencer, novedades pendientes)

### T4.7 — Frontend Conductor: Lista de servicios
- [ ] Calendario semanal con servicios asignados
- [ ] Lista de servicios con: hora, origen, destino, estado
- [ ] Acceso al detalle

### T4.8 — Frontend Conductor: Ejecución del servicio
- [ ] Vista de detalle con toda la información del servicio
- [ ] Botón "Iniciar servicio" → solicita km inicial → confirma
- [ ] Estado cambia visualmente a EN_EJECUCION
- [ ] Botón "Finalizar servicio" → solicita km final → valida que sea > km inicial → confirma
- [ ] Estado cambia a FINALIZADA

### T4.9 — Frontend Conductor: Registro de combustible
- [ ] Formulario: fecha, galones, valor (COP), km del odómetro
- [ ] Subida de foto del ticket (cámara o galería)
- [ ] Vista previa de la foto antes de enviar
- [ ] Historial de tanqueos del vehículo (últimos 30)

### T4.10 — Frontend Conductor: Reporte de novedades
- [ ] Selector de tipo de novedad
- [ ] Campo de descripción
- [ ] Selector de nivel de urgencia (baja / media / alta / crítica)
- [ ] Selector de operabilidad: puede operar / no puede operar / operación limitada
- [ ] Subida de hasta 3 fotos como evidencia
- [ ] Confirmación de envío

### T4.11 — Frontend Conductor: Reporte de tecnomecánica
- [ ] Formulario de reporte (descripción, fecha de revisión)
- [ ] Subida del soporte (foto del certificado)
- [ ] Vista del estado del trámite (pendiente validación / aprobado / rechazado)

### T4.12 — Frontend Conductor: Documentos del vehículo
- [ ] Tabla de documentos con semáforo de estado
- [ ] Alertas de vencimiento destacadas

## Criterios de Aceptación
- [ ] El conductor solo ve SUS servicios asignados, no los de otros conductores
- [ ] No puede iniciar un servicio si otro está EN_EJECUCION (un servicio a la vez)
- [ ] El km final debe ser mayor al km inicial (validación)
- [ ] Al finalizar el servicio, el estado del vehículo se actualiza con el nuevo kilometraje
- [ ] Una novedad con `puede_operar = no` alerta en el dashboard de la administradora
- [ ] El conductor no puede modificar asignaciones ni programación
