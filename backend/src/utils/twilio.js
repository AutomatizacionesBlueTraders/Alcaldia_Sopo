// Envía notificaciones a n8n con accion + datos — n8n formatea y envía vía Twilio
const n8nUrl = process.env.N8N_INTERNAL_URL || 'http://n8n:5678';
const n8nWebhookPath = process.env.N8N_WEBHOOK_SALIDA || 'wa-salida';

async function notificarN8n(accion, datos) {
  const url = `${n8nUrl}/webhook/${n8nWebhookPath}`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, ...datos })
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error(`[n8n] Error al notificar (${accion}) ${resp.status} ${url}: ${body.substring(0, 200)}`);
    } else {
      console.log(`[n8n] Notificación enviada (${accion}) solicitud=${datos.solicitud_id || '?'}`);
    }
  } catch (err) {
    console.error(`[n8n] Error de red al notificar (${accion}) ${url}: ${err.message}`);
  }
}

module.exports = { notificarN8n };
