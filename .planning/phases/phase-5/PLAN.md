# Fase 5 — Bot WhatsApp: Solicitudes y Confirmaciones

## Goal
Un solicitante puede crear una solicitud de transporte por WhatsApp usando un Flow interactivo, consultar el estado, y confirmar/rechazar el servicio programado. El sistema envía confirmaciones y recordatorios automáticos.

## Dependencias
- Fase 1 (BD, backend)
- Fase 2 (lógica de solicitudes)
- Fase 3 (lógica de programación — para saber cuándo enviar confirmación)

## Integración
- **API:** Meta Business Cloud API (Graph API v19+)
- **Flows:** WhatsApp Flows (formularios nativos en la app)
- **Webhook:** recibe mensajes entrantes
- **Envío:** API de mensajes (texto, botones, flows)

## Variables de entorno necesarias
```
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_FLOW_ID_SOLICITUD=
META_APP_SECRET=
```

## Tareas

### T5.1 — Configuración del webhook
- [ ] `GET /api/whatsapp/webhook` — verificación del webhook (challenge de Meta)
- [ ] `POST /api/whatsapp/webhook` — recepción de mensajes/eventos
- [ ] Validación de firma HMAC-SHA256 con `META_APP_SECRET`
- [ ] Router de tipos de mensaje: texto, botón, flow_response, interactivo

### T5.2 — Menú interactivo de bienvenida
Cuando el usuario escribe por primera vez (o envía cualquier texto libre):
- [ ] Responder con mensaje de bienvenida + botones interactivos:
  1. Solicitar servicio
  2. Consultar solicitud
  3. Ver servicios disponibles
  4. Cómo solicitar
- [ ] Manejo de estado de conversación en BD (tabla `whatsapp_sesiones`: phone, estado, contexto, updated_at)

### T5.3 — WhatsApp Flow: formulario de solicitud
- [ ] Diseñar JSON del Flow con todos los campos:
  - Dependencia (lista desplegable desde BD)
  - Fecha del servicio (date picker)
  - Hora de inicio / Hora estimada de fin
  - Lugar de salida
  - Destino
  - Número de pasajeros (número)
  - Nombre del solicitante
  - Teléfono de contacto
  - Tipo de servicio (lista)
  - Observaciones (opcional)
- [ ] Endpoint para datos dinámicos del Flow: `POST /api/whatsapp/flow-data` (retorna lista de dependencias y tipos de servicio)
- [ ] Al completar el Flow, el webhook recibe `flow_response` y crea la solicitud en BD (canal: whatsapp)
- [ ] Enviar mensaje de confirmación: "Tu solicitud fue registrada ✅ Radicado: #XXX"

### T5.4 — Consulta de estado por WhatsApp
- [ ] Al seleccionar "Consultar solicitud", pedir el número de radicado
- [ ] Buscar en BD y retornar estado actual + detalles básicos
- [ ] Si no existe, mensaje de error amigable

### T5.5 — Envío automático de confirmación al programar
- [ ] Cuando la administradora programa un servicio (Fase 3), el sistema:
  - Obtiene el teléfono del contacto de la solicitud
  - Envía mensaje con detalles del servicio programado:
    - Fecha y hora
    - Vehículo (placa)
    - Conductor (nombre)
  - Incluye botones: ✅ Confirmar / ❌ Rechazar

### T5.6 — Procesamiento de confirmación/rechazo
- [ ] Al recibir respuesta de botón:
  - Confirmar → cambia estado a CONFIRMADA, notifica en dashboard admin
  - Rechazar → cambia estado a NO_CONFIRMADA, notifica en dashboard admin
- [ ] Enviar mensaje de acuse de recibo al usuario

### T5.7 — Recordatorio automático
- [ ] Job programado (cron) que corre cada hora
- [ ] Busca servicios CONFIRMADOS con fecha = mañana que no hayan recibido recordatorio
- [ ] Envía mensaje de recordatorio: "Recordatorio: mañana a las HH:MM tienes un servicio de transporte a [destino]"
- [ ] Marca el servicio como "recordatorio_enviado" para no duplicar

### T5.8 — Respuestas para opciones del menú
- [ ] "Ver servicios disponibles" → mensaje de texto con lista de tipos de servicio
- [ ] "Cómo solicitar" → mensaje con instrucciones de uso del bot

### T5.9 — Manejo de errores y flujos incompletos
- [ ] Timeout de sesión (30 min sin respuesta → reinicia estado)
- [ ] Mensaje de "no entiendo" para texto libre fuera de flujo
- [ ] Reintento si el Flow fue interrumpido

## Criterios de Aceptación
- [ ] El webhook pasa la verificación de Meta correctamente
- [ ] Al escribir al número, el bot responde con el menú en menos de 3 segundos
- [ ] El Flow de solicitud guarda todos los campos en la BD
- [ ] La solicitud creada por WhatsApp aparece en el panel admin con indicador de canal
- [ ] Al programar el servicio, el solicitante recibe el mensaje de confirmación automáticamente
- [ ] Al responder "Confirmar", el estado cambia a CONFIRMADA en la BD
- [ ] El recordatorio NO se envía dos veces al mismo servicio
- [ ] La firma HMAC del webhook es validada en cada petición
