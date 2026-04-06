// Envía un mensaje WhatsApp llamando al webhook de n8n (n8n se encarga de enviar via Twilio)
async function enviarWhatsApp(to, body) {
  const n8nUrl = process.env.N8N_INTERNAL_URL || 'http://n8n:5678';
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  try {
    const resp = await fetch(`${n8nUrl}/webhook/wa-salida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toFormatted, body })
    });
    if (!resp.ok) console.error('[n8n/WhatsApp] Error al enviar:', resp.status);
    return resp.ok;
  } catch (err) {
    console.error('[n8n/WhatsApp] Error de red:', err.message);
  }
}

module.exports = { enviarWhatsApp };
