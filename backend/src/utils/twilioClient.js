// Cliente mínimo para la API REST de Twilio. Usamos fetch + Basic Auth
// en vez del SDK para no añadir dependencia. Solo se usa al abrir un hilo
// de conversación o al servir media; el dashboard no consulta Twilio en
// las vistas de lista / estadísticas (esas van contra whatsapp_mensajes).

function creds() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN en el entorno');
  }
  return {
    sid,
    token,
    authHeader: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
  };
}

function waPrefix(telefono) {
  // Twilio espera el formato "whatsapp:+<dígitos>".
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return null;
  return `whatsapp:+${digits}`;
}

// Lista de mensajes filtrada por From o To. Devuelve el array crudo de Twilio.
async function listMessages({ from, to, limit = 200 }) {
  const { sid, authHeader } = creds();
  const params = new URLSearchParams();
  if (from) params.set('From', from);
  if (to) params.set('To', to);
  params.set('PageSize', String(Math.min(limit, 1000)));

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?${params}`;
  const resp = await fetch(url, { headers: { Authorization: authHeader } });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Twilio ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.messages || [];
}

// Trae entrantes + salientes de un teléfono, los normaliza y ordena cronológicamente.
async function fetchHilo(telefono, { limit = 200 } = {}) {
  const wa = waPrefix(telefono);
  if (!wa) throw new Error('Teléfono inválido');

  const [entrantes, salientes] = await Promise.all([
    listMessages({ from: wa, limit }),
    listMessages({ to: wa, limit }),
  ]);

  const merge = [...entrantes, ...salientes].map(normalizarMensaje);

  // Dedupe por sid por si un mismo mensaje apareció en ambas queries
  const vistos = new Set();
  const unicos = [];
  for (const m of merge) {
    if (vistos.has(m.sid)) continue;
    vistos.add(m.sid);
    unicos.push(m);
  }

  unicos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return unicos;
}

function normalizarMensaje(tw) {
  // Twilio devuelve 'direction': "inbound" | "outbound-api" | "outbound-reply" ...
  // Simplificamos a in/out.
  const dirRaw = String(tw.direction || '');
  const direccion = dirRaw.startsWith('inbound') ? 'in' : 'out';
  const numMedia = parseInt(tw.num_media) || 0;

  return {
    sid: tw.sid,
    direccion,
    from: tw.from,
    to: tw.to,
    body: tw.body || '',
    num_media: numMedia,
    status: tw.status,
    error_code: tw.error_code,
    fecha: tw.date_sent || tw.date_created,
    // Si hay media, el frontend arma la URL proxy usando sid + índice
    media: numMedia > 0
      ? Array.from({ length: numMedia }, (_, i) => ({
          proxy_url: `/api/conversaciones/media/${tw.sid}/${i}`,
        }))
      : [],
  };
}

// Lista media asociada a un Message SID.
async function fetchMediaList(messageSid) {
  const { sid, authHeader } = creds();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/${messageSid}/Media.json`;
  const resp = await fetch(url, { headers: { Authorization: authHeader } });
  if (!resp.ok) throw new Error(`Twilio media list ${resp.status}`);
  const data = await resp.json();
  return data.media_list || [];
}

// Pipe el contenido de un media item al response del cliente.
// El endpoint de media recibe (messageSid, index) y usa esto para streamear.
async function streamMediaTo(messageSid, index, clientRes) {
  const { sid, authHeader } = creds();
  const lista = await fetchMediaList(messageSid);
  const item = lista[parseInt(index) || 0];
  if (!item) {
    clientRes.status(404).json({ error: 'Media no encontrado' });
    return;
  }
  // item.uri es la ruta al subrecurso JSON; necesitamos la URL binaria
  // que es la misma ruta pero sin .json al final, con 302 al CDN de Twilio.
  const mediaUrl = `https://api.twilio.com${item.uri.replace('.json', '')}`;

  const resp = await fetch(mediaUrl, {
    headers: { Authorization: authHeader },
    redirect: 'follow',
  });
  if (!resp.ok) {
    clientRes.status(resp.status).json({ error: 'No se pudo descargar media' });
    return;
  }

  const ct = resp.headers.get('content-type') || item.content_type || 'application/octet-stream';
  clientRes.setHeader('Content-Type', ct);
  clientRes.setHeader('Cache-Control', 'private, max-age=3600');

  const buf = Buffer.from(await resp.arrayBuffer());
  clientRes.end(buf);
}

module.exports = { fetchHilo, streamMediaTo };
