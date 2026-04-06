// Envía un mensaje WhatsApp via Twilio REST API (sin dependencia npm)
async function enviarWhatsApp(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // ej: whatsapp:+573156277828

  if (!sid || !token || !from) {
    console.warn('[Twilio] Credenciales no configuradas, mensaje no enviado');
    return;
  }

  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const params = new URLSearchParams({ From: from, To: toFormatted, Body: body });

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!resp.ok) {
      const err = await resp.json();
      console.error('[Twilio] Error al enviar:', err);
    }
    return resp.ok;
  } catch (err) {
    console.error('[Twilio] Error de red:', err.message);
  }
}

module.exports = { enviarWhatsApp };
