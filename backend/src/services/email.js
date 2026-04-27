// Envío de emails transaccionales vía Resend (HTTP directo).
// Un fallo enviando correo NUNCA debe tumbar el flujo: se loguea y se
// devuelve false para que el llamador decida qué hacer.

const RESEND_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada — email omitido', { to, subject });
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
  const fromName = process.env.RESEND_FROM_NAME || 'Alcaldía de Sopó';
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const payload = { from, to: [to], subject, html };
  if (text) payload.text = text;

  try {
    const resp = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('[email] envío falló', {
        to, subject, status: resp.status, body: body.slice(0, 500),
      });
      return false;
    }
    const data = await resp.json().catch(() => ({}));
    console.log('[email] enviado', { to, subject, resend_id: data.id });
    return true;
  } catch (err) {
    console.error('[email] excepción', { to, subject, error: err.message });
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Bloque visual del código OTP. Letter-spacing alto + monoespaciada para que
// el usuario lo lea de un vistazo. Mantenerlo simple por compatibilidad
// con clientes de correo viejos (Outlook clásico, etc.).
function codeBlockHtml(code, ttlMin) {
  const parts = String(code).split('');
  return `
    <div style="margin:24px 0;padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">
        Tu código de verificación
      </p>
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;
                color:#0f172a;letter-spacing:10px;">
        ${parts.map((d) => escapeHtml(d)).join('')}
      </p>
      <p style="margin:12px 0 0 0;font-size:12px;color:#94a3b8;">
        Expira en ${ttlMin} minuto${ttlMin === 1 ? '' : 's'}.
      </p>
    </div>`;
}

function baseTemplate({ title, leadHtml, code, ttlMin, codeEntryUrl, ctaLabel, ctaUrl }) {
  const codeHtml = code ? codeBlockHtml(code, ttlMin) : '';

  const stepsHtml = (code && codeEntryUrl) ? `
    <p style="margin:0 0 8px 0;"><strong>Pasos:</strong></p>
    <ol style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
      <li style="margin-bottom:6px;">Abre esta página:
        <br><a href="${codeEntryUrl}" style="color:#1e40af;word-break:break-all;">${codeEntryUrl}</a>
      </li>
      <li>Pega el código y elige tu nueva contraseña.</li>
    </ol>` : '';

  const ctaHtml = (ctaLabel && ctaUrl) ? `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">
      ¿Prefieres un atajo? Este botón puede no funcionar en correos corporativos
      (Outlook / Microsoft Defender suelen reescribir el enlace y romperlo).
      Si pasa eso, usa el código de arriba.
    </p>
    <p style="margin:16px 0 0 0;">
      <a href="${ctaUrl}"
         style="display:inline-block;padding:10px 20px;background:#1e40af;color:#fff;
                text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
        ${escapeHtml(ctaLabel)}
      </a>
    </p>` : '';

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560"
             style="max-width:560px;background:#ffffff;border-radius:8px;padding:32px;
                    color:#0f172a;font-size:15px;line-height:1.6;">
        <tr><td>
          <h1 style="font-size:22px;margin:0 0 16px 0;color:#1e3a8a;">${escapeHtml(title)}</h1>
          ${leadHtml}
          ${codeHtml}
          ${stepsHtml}
          ${ctaHtml}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Alcaldía Municipal de Sopó — Sistema de Transporte.<br>
            Este es un mensaje automático, no respondas a este correo.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Versión texto plano: algunos filtros corporativos solo dejan pasar el text/plain,
// y los códigos en plain text llegan siempre intactos.
function buildPlainText({ saludo, intro, code, ttlMin, codeEntryUrl, ctaLabel, ctaUrl }) {
  const lines = [];
  lines.push(saludo);
  lines.push('');
  lines.push(intro);
  lines.push('');
  if (code) {
    lines.push('Tu código de verificación:');
    lines.push(`    ${code}`);
    lines.push(`(Expira en ${ttlMin} minuto${ttlMin === 1 ? '' : 's'})`);
    lines.push('');
  }
  if (codeEntryUrl) {
    lines.push('Ingrésalo en esta página:');
    lines.push(codeEntryUrl);
    lines.push('');
  }
  if (ctaUrl) {
    lines.push(`Atajo opcional (puede no funcionar en correos corporativos):`);
    lines.push(ctaUrl);
    lines.push('');
  }
  lines.push('—');
  lines.push('Alcaldía Municipal de Sopó — Sistema de Transporte.');
  lines.push('Mensaje automático — no respondas a este correo.');
  return lines.join('\n');
}

async function sendWelcomeEmail({ to, nombre, setupLink, code, codeEntryUrl, ttlMin = 60 }) {
  const leadHtml = `
    <p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
    <p>Se ha creado tu cuenta en el Sistema de Transporte de la Alcaldía de Sopó.
       Para comenzar, define tu contraseña con el código de abajo.</p>`;
  const html = baseTemplate({
    title: 'Bienvenido',
    leadHtml,
    code,
    ttlMin,
    codeEntryUrl,
    ctaLabel: 'Configurar contraseña',
    ctaUrl: setupLink,
  });
  const text = buildPlainText({
    saludo: `Hola ${nombre},`,
    intro: 'Se ha creado tu cuenta en el Sistema de Transporte de la Alcaldía de Sopó. Para comenzar, define tu contraseña.',
    code,
    ttlMin,
    codeEntryUrl,
    ctaUrl: setupLink,
  });
  return sendEmail({
    to,
    subject: 'Bienvenido — configura tu contraseña',
    html,
    text,
  });
}

async function sendPasswordResetEmail({ to, nombre, resetLink, code, codeEntryUrl, ttlMin = 60 }) {
  const leadHtml = `
    <p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña.
       Usa el código de abajo para crear una nueva.</p>
    <p style="color:#64748b;font-size:13px;">
       Si no solicitaste este cambio, ignora este correo.
    </p>`;
  const html = baseTemplate({
    title: 'Restablecer contraseña',
    leadHtml,
    code,
    ttlMin,
    codeEntryUrl,
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetLink,
  });
  const text = buildPlainText({
    saludo: `Hola ${nombre},`,
    intro: 'Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este correo.',
    code,
    ttlMin,
    codeEntryUrl,
    ctaUrl: resetLink,
  });
  return sendEmail({
    to,
    subject: 'Restablece tu contraseña',
    html,
    text,
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
