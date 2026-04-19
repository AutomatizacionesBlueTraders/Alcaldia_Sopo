const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'whatsapp');

const EXT_BY_CONTENT_TYPE = {
  'audio/ogg': 'ogg',
  'audio/ogg; codecs=opus': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/amr': 'amr',
};

function extFromContentType(ct) {
  if (!ct) return 'bin';
  const key = ct.split(';')[0].trim().toLowerCase();
  return EXT_BY_CONTENT_TYPE[key] || EXT_BY_CONTENT_TYPE[ct.toLowerCase()] || 'bin';
}

async function ensureDir() {
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });
}

/**
 * Descarga un audio de Twilio y lo guarda en /uploads/whatsapp/
 * Solo procesa content-type "audio/*". Devuelve { path, contentType } o null si no es audio.
 */
async function descargarAudioTwilio({ mediaUrl, messageSid }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.error('[twilioMedia] Faltan TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN');
    return null;
  }
  if (!mediaUrl || !messageSid) return null;

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  try {
    const resp = await fetch(mediaUrl, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      redirect: 'follow',
    });

    if (!resp.ok) {
      console.error(`[twilioMedia] HTTP ${resp.status} al descargar ${mediaUrl}`);
      return null;
    }

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('audio/')) {
      return null;
    }

    await ensureDir();
    const ext = extFromContentType(contentType);
    const filename = `${messageSid}.${ext}`;
    const fullPath = path.join(UPLOADS_DIR, filename);

    const arrayBuffer = await resp.arrayBuffer();
    await fsp.writeFile(fullPath, Buffer.from(arrayBuffer));

    return {
      // Se sirve bajo /api/uploads para pasar el proxy inverso en producción
      path: `/api/uploads/whatsapp/${filename}`,
      contentType: contentType.split(';')[0].trim(),
    };
  } catch (err) {
    console.error(`[twilioMedia] Error al descargar ${mediaUrl}: ${err.message}`);
    return null;
  }
}

module.exports = { descargarAudioTwilio };
