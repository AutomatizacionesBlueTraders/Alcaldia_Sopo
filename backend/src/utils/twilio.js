// Envía notificaciones a n8n con accion + datos — n8n formatea y envía vía Twilio
const n8nUrl = process.env.N8N_INTERNAL_URL || 'http://n8n:5678';

async function notificarN8n(accion, datos) {
  try {
    const resp = await fetch(`${n8nUrl}/webhook/wa-salida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, ...datos })
    });
    if (!resp.ok) console.error('[n8n] Error al notificar:', resp.status);
  } catch (err) {
    console.error('[n8n] Error de red:', err.message);
  }
}

module.exports = { notificarN8n };
