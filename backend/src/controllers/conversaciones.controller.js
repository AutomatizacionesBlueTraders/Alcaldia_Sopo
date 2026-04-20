const db = require('../config/db');
const { fetchHilo, streamMediaTo, listConversaciones } = require('../utils/twilioClient');

// Normaliza "whatsapp:+573001234567" → "573001234567" (solo dígitos)
function normalizarTelefono(raw) {
  if (!raw) return null;
  return String(raw).replace(/\D/g, '') || null;
}

// Dada una lista de teléfonos, devuelve { [telefono]: { nombre, tipo } }.
// La tabla usuarios NO tiene columna telefono (los usuarios del dashboard se
// identifican por email), así que solo se consulta conductores y también se
// intenta por solicitudes.contacto_telefono para identificar contactos de
// dependencias que pidieron servicio.
async function resolverNombres(telefonos) {
  const tmap = {};
  if (!telefonos || !telefonos.length) return tmap;

  try {
    const conductores = await db('conductores')
      .whereIn('telefono', telefonos)
      .select('telefono', 'nombre');
    conductores.forEach(c => {
      const key = normalizarTelefono(c.telefono);
      if (key) tmap[key] = { nombre: c.nombre, tipo: 'conductor' };
    });
  } catch (err) {
    console.error('resolverNombres conductores:', err.message);
  }

  try {
    const contactos = await db('solicitudes')
      .whereIn(db.raw("REGEXP_REPLACE(COALESCE(contacto_telefono, ''), '\\D', '', 'g')"), telefonos)
      .whereNotNull('contacto_nombre')
      .select('contacto_telefono', 'contacto_nombre')
      .orderBy('created_at', 'desc');
    contactos.forEach(c => {
      const key = normalizarTelefono(c.contacto_telefono);
      if (key && !tmap[key]) {
        tmap[key] = { nombre: c.contacto_nombre, tipo: 'dependencia' };
      }
    });
  } catch (err) {
    console.error('resolverNombres solicitudes:', err.message);
  }

  return tmap;
}

// ─── POST /api/whatsapp/mensaje (n8n, api-key) ──────────────────────────────
// Solo para mensajes entrantes (lo llama n8n desde un único nodo colgado
// del TWILIO WEBHOOK). Guarda metadatos mínimos para poder sacar estadísticas.
// El contenido completo del hilo se lee en vivo desde Twilio al abrir un chat.

async function guardarMensaje(req, res) {
  try {
    const {
      direccion, message_sid, from, to, body,
      num_media, media_content_type, status
    } = req.body;

    if (!direccion || !['in', 'out'].includes(direccion)) {
      return res.status(400).json({ error: 'direccion debe ser in u out' });
    }
    if (!from || !to) {
      return res.status(400).json({ error: 'from y to requeridos' });
    }

    const fromNorm = normalizarTelefono(from);
    const toNorm = normalizarTelefono(to);
    const telefono_usuario = direccion === 'in' ? fromNorm : toNorm;
    const telefono_twilio = direccion === 'in' ? toNorm : fromNorm;

    if (!telefono_usuario) {
      return res.status(400).json({ error: 'No se pudo extraer teléfono de usuario' });
    }

    if (message_sid) {
      const existe = await db('whatsapp_mensajes').where({ message_sid }).first();
      if (existe) return res.json({ ok: true, ya_existe: true, id: existe.id });
    }

    const [row] = await db('whatsapp_mensajes').insert({
      message_sid: message_sid || null,
      telefono_usuario,
      telefono_twilio,
      direccion,
      body: body || null,
      media_url: null,
      media_path: null,
      media_content_type: media_content_type || null,
      num_media: parseInt(num_media) || 0,
      status: status || null,
    }).returning('*');

    res.json({ ok: true, id: row.id });
  } catch (err) {
    console.error('guardarMensaje WA:', err);
    res.status(500).json({ error: 'Error al guardar mensaje' });
  }
}

// ─── GET /api/conversaciones (JWT) ──────────────────────────────────────────
// Fuente primaria: Twilio (últimos ~1000 mensajes agrupados por contraparte).
// Si Twilio falla, se usa la DB local como fallback.
async function listar(req, res) {
  try {
    const { q } = req.query;
    let fuente = 'twilio';
    let grupos = [];

    try {
      grupos = await listConversaciones({ limit: 1000 });
    } catch (err) {
      console.error('listar vía Twilio falló, usando DB:', err.message);
      fuente = 'db-fallback';
      grupos = await listarDesdeDB();
    }

    if (q) {
      const qClean = String(q).replace(/\D/g, '');
      grupos = grupos.filter(g => g.telefono.includes(qClean));
    }

    const telefonos = grupos.map(g => g.telefono);
    const tmap = await resolverNombres(telefonos);

    const result = grupos.map(g => ({
      ...g,
      nombre: tmap[g.telefono]?.nombre || null,
      tipo: tmap[g.telefono]?.tipo || 'desconocido',
    }));

    res.set('X-Source', fuente);
    res.json(result);
  } catch (err) {
    console.error('listar conversaciones:', err);
    res.status(500).json({ error: 'Error al listar conversaciones' });
  }
}

async function listarDesdeDB() {
  const grupos = await db('whatsapp_mensajes')
    .select('telefono_usuario')
    .max('created_at as ultima_fecha')
    .count('id as total_mensajes')
    .groupBy('telefono_usuario')
    .orderBy('ultima_fecha', 'desc');

  const telefonos = grupos.map(g => g.telefono_usuario);
  let ultimos = [];
  if (telefonos.length) {
    ultimos = await db.raw(`
      SELECT DISTINCT ON (telefono_usuario)
        telefono_usuario, body, direccion, created_at, num_media, media_content_type
      FROM whatsapp_mensajes
      WHERE telefono_usuario = ANY(?)
      ORDER BY telefono_usuario, created_at DESC
    `, [telefonos]);
    ultimos = ultimos.rows;
  }
  const ultMap = Object.fromEntries(ultimos.map(u => [u.telefono_usuario, u]));

  return grupos.map(g => {
    const u = ultMap[g.telefono_usuario] || {};
    const esAudio = u.media_content_type && u.media_content_type.startsWith('audio/');
    return {
      telefono: g.telefono_usuario,
      total_mensajes: parseInt(g.total_mensajes),
      ultima_fecha: g.ultima_fecha,
      ultimo_mensaje: u.body || (u.num_media > 0 ? (esAudio ? '🎵 Audio' : '📎 Adjunto') : ''),
      ultima_direccion: u.direccion || null,
    };
  });
}

// ─── GET /api/conversaciones/:telefono ──────────────────────────────────────
// El hilo se consulta en vivo a Twilio (no a la DB).
async function hilo(req, res) {
  try {
    const telefono = normalizarTelefono(req.params.telefono);
    if (!telefono) return res.status(400).json({ error: 'telefono inválido' });

    const limit = Math.min(parseInt(req.query.limit) || 200, 1000);

    const tmap = await resolverNombres([telefono]);
    const meta = tmap[telefono] || null;

    let mensajes = [];
    let fuente = 'twilio';
    try {
      mensajes = await fetchHilo(telefono, { limit });
    } catch (err) {
      console.error('hilo vía Twilio falló, devolviendo desde DB:', err.message);
      fuente = 'db-fallback';
      const rows = await db('whatsapp_mensajes')
        .where({ telefono_usuario: telefono })
        .orderBy('created_at', 'asc')
        .limit(limit)
        .select('message_sid as sid', 'direccion', 'body', 'num_media',
                'media_content_type', 'status', 'created_at as fecha');
      mensajes = rows.map(r => ({
        ...r,
        media: r.num_media > 0 && r.sid
          ? [{ proxy_url: `/api/conversaciones/media/${r.sid}/0` }]
          : [],
      }));
    }

    res.json({
      telefono,
      nombre: meta?.nombre || null,
      tipo: meta?.tipo || 'desconocido',
      fuente,
      mensajes,
    });
  } catch (err) {
    console.error('hilo conversacion:', err);
    res.status(500).json({ error: 'Error al obtener hilo' });
  }
}

// ─── GET /api/conversaciones/media/:sid/:index ──────────────────────────────
// Proxy autenticado a los archivos multimedia de Twilio.
async function media(req, res) {
  try {
    const { sid, index } = req.params;
    if (!/^[A-Za-z0-9]{20,40}$/.test(sid)) {
      return res.status(400).json({ error: 'sid inválido' });
    }
    await streamMediaTo(sid, index, res);
  } catch (err) {
    console.error('media proxy:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Error al obtener media' });
  }
}

// ─── GET /api/conversaciones/stats ──────────────────────────────────────────
async function stats(req, res) {
  try {
    const TZ = `'America/Bogota'`;

    // 1. Totales agregados
    const [totales] = await db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date) AS hoy,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('week', NOW() AT TIME ZONE ${TZ})) AS semana,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('month', NOW() AT TIME ZONE ${TZ})) AS mes,
        COUNT(DISTINCT telefono_usuario) FILTER (WHERE (created_at AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date) AS conversaciones_hoy,
        COUNT(DISTINCT telefono_usuario) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('week', NOW() AT TIME ZONE ${TZ})) AS conversaciones_semana,
        COUNT(DISTINCT telefono_usuario) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('month', NOW() AT TIME ZONE ${TZ})) AS conversaciones_mes
      FROM whatsapp_mensajes
      WHERE direccion = 'in'
    `).then(r => r.rows);

    // 2. Top teléfonos últimos 30 días (enriquecidos)
    const { rows: top } = await db.raw(`
      SELECT telefono_usuario, COUNT(*) AS total
      FROM whatsapp_mensajes
      WHERE direccion = 'in' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY telefono_usuario
      ORDER BY total DESC
      LIMIT 10
    `);
    const telefonosTop = top.map(r => r.telefono_usuario);
    const tmap = await resolverNombres(telefonosTop);

    // 3. Serie por día (30 días, rellena huecos)
    const { rows: porDia } = await db.raw(`
      WITH dias AS (
        SELECT generate_series(
          (NOW() AT TIME ZONE ${TZ})::date - INTERVAL '29 days',
          (NOW() AT TIME ZONE ${TZ})::date,
          INTERVAL '1 day'
        )::date AS dia
      )
      SELECT d.dia,
             COALESCE(COUNT(m.id), 0) AS total,
             COALESCE(COUNT(DISTINCT m.telefono_usuario), 0) AS personas
      FROM dias d
      LEFT JOIN whatsapp_mensajes m
        ON (m.created_at AT TIME ZONE ${TZ})::date = d.dia
       AND m.direccion = 'in'
      GROUP BY d.dia
      ORDER BY d.dia ASC
    `);

    // 4. Por semana (12 semanas)
    const { rows: porSemana } = await db.raw(`
      WITH semanas AS (
        SELECT generate_series(
          date_trunc('week', NOW() AT TIME ZONE ${TZ}) - INTERVAL '11 weeks',
          date_trunc('week', NOW() AT TIME ZONE ${TZ}),
          INTERVAL '1 week'
        )::date AS semana
      )
      SELECT s.semana,
             COALESCE(COUNT(m.id), 0) AS total,
             COALESCE(COUNT(DISTINCT m.telefono_usuario), 0) AS personas
      FROM semanas s
      LEFT JOIN whatsapp_mensajes m
        ON date_trunc('week', m.created_at AT TIME ZONE ${TZ})::date = s.semana
       AND m.direccion = 'in'
      GROUP BY s.semana
      ORDER BY s.semana ASC
    `);

    // 5. Opciones de menú y top preguntas repetidas
    const { rows: opcionesMenu } = await db.raw(`
      SELECT TRIM(body) AS opcion, COUNT(*) AS total
      FROM whatsapp_mensajes
      WHERE direccion = 'in'
        AND created_at >= NOW() - INTERVAL '30 days'
        AND body IS NOT NULL
        AND TRIM(body) ~ '^[0-9]{1,3}$'
      GROUP BY TRIM(body)
      ORDER BY total DESC
      LIMIT 10
    `);

    const { rows: preguntas } = await db.raw(`
      SELECT LOWER(TRIM(body)) AS pregunta, COUNT(*) AS total
      FROM whatsapp_mensajes
      WHERE direccion = 'in'
        AND created_at >= NOW() - INTERVAL '30 days'
        AND body IS NOT NULL
        AND TRIM(body) !~ '^[0-9]{1,3}$'
        AND LENGTH(TRIM(body)) >= 4
      GROUP BY LOWER(TRIM(body))
      ORDER BY total DESC
      LIMIT 10
    `);

    // 6. Desglose tipo de entrada (30 días)
    const [tiposEntrada] = await db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE body IS NOT NULL AND TRIM(body) ~ '^[0-9]{1,3}$') AS opciones_menu,
        COUNT(*) FILTER (WHERE num_media > 0 AND media_content_type LIKE 'audio/%') AS audios,
        COUNT(*) FILTER (WHERE num_media > 0 AND (media_content_type NOT LIKE 'audio/%' OR media_content_type IS NULL)) AS otros_media,
        COUNT(*) FILTER (
          WHERE num_media = 0 AND body IS NOT NULL
            AND TRIM(body) !~ '^[0-9]{1,3}$' AND LENGTH(TRIM(body)) > 0
        ) AS texto_libre,
        COUNT(*) FILTER (WHERE (body IS NULL OR LENGTH(TRIM(body)) = 0) AND num_media = 0) AS vacios,
        COUNT(*) AS total
      FROM whatsapp_mensajes
      WHERE direccion = 'in' AND created_at >= NOW() - INTERVAL '30 days'
    `).then(r => r.rows);

    // ─── NUEVAS MÉTRICAS DE ALTO VALOR ────────────────────────────────────────

    // 7. Tasa de conversión bot → solicitud
    // Personas que escribieron al bot en los últimos 30 días vs personas que
    // aparecen como contacto_telefono en solicitudes creadas en el mismo rango.
    const [conversion] = await db.raw(`
      WITH escribieron AS (
        SELECT DISTINCT telefono_usuario AS tel
        FROM whatsapp_mensajes
        WHERE direccion = 'in' AND created_at >= NOW() - INTERVAL '30 days'
      ),
      crearon AS (
        SELECT DISTINCT REGEXP_REPLACE(COALESCE(contacto_telefono, ''), '\\D', '', 'g') AS tel
        FROM solicitudes
        WHERE canal = 'whatsapp' AND created_at >= NOW() - INTERVAL '30 days'
      )
      SELECT
        (SELECT COUNT(*) FROM escribieron) AS total_escribieron,
        (SELECT COUNT(*) FROM crearon WHERE tel <> '') AS total_crearon,
        (SELECT COUNT(*) FROM escribieron e JOIN crearon c ON e.tel = c.tel) AS convirtieron
    `).then(r => r.rows);

    // 8. En qué estados del bot se queda la gente (posible fricción)
    const { rows: atascosSesiones } = await db.raw(`
      SELECT estado, COUNT(*) AS total
      FROM whatsapp_sesiones
      WHERE estado IS NOT NULL AND estado <> 'idle'
      GROUP BY estado
      ORDER BY total DESC
      LIMIT 10
    `);

    // 9. Heatmap hora × día de la semana (30 días)
    // dow: 0=domingo … 6=sábado (convención de PG 'dow')
    const { rows: heatmap } = await db.raw(`
      SELECT
        EXTRACT(DOW FROM m.created_at AT TIME ZONE ${TZ})::int AS dia_semana,
        EXTRACT(HOUR FROM m.created_at AT TIME ZONE ${TZ})::int AS hora,
        COUNT(*) AS total
      FROM whatsapp_mensajes m
      WHERE m.direccion = 'in' AND m.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY dia_semana, hora
      ORDER BY dia_semana, hora
    `);

    // 10. Conversaciones con posible fricción (más de 15 mensajes entrantes
    //     en los últimos 7 días sin terminar en solicitud creada)
    const { rows: posibleFriccion } = await db.raw(`
      WITH conv_largas AS (
        SELECT telefono_usuario, COUNT(*) AS mensajes,
               MIN(created_at) AS primer_msg, MAX(created_at) AS ultimo_msg
        FROM whatsapp_mensajes
        WHERE direccion = 'in' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY telefono_usuario
        HAVING COUNT(*) >= 10
      )
      SELECT c.telefono_usuario, c.mensajes, c.ultimo_msg,
        EXISTS (
          SELECT 1 FROM solicitudes s
          WHERE REGEXP_REPLACE(COALESCE(s.contacto_telefono, ''), '\\D', '', 'g') = c.telefono_usuario
            AND s.canal = 'whatsapp'
            AND s.created_at >= c.primer_msg - INTERVAL '1 day'
            AND s.created_at <= c.ultimo_msg + INTERVAL '1 day'
        ) AS creo_solicitud
      FROM conv_largas c
      ORDER BY c.mensajes DESC
      LIMIT 10
    `);

    // 11. Retención: de los que escribieron hace 14-30 días, ¿cuántos volvieron
    //     en los últimos 14 días?
    const [retencion] = await db.raw(`
      WITH antiguos AS (
        SELECT DISTINCT telefono_usuario
        FROM whatsapp_mensajes
        WHERE direccion = 'in'
          AND created_at >= NOW() - INTERVAL '30 days'
          AND created_at < NOW() - INTERVAL '14 days'
      ),
      recientes AS (
        SELECT DISTINCT telefono_usuario
        FROM whatsapp_mensajes
        WHERE direccion = 'in' AND created_at >= NOW() - INTERVAL '14 days'
      )
      SELECT
        (SELECT COUNT(*) FROM antiguos) AS total_antiguos,
        (SELECT COUNT(*) FROM antiguos a JOIN recientes r ON a.telefono_usuario = r.telefono_usuario) AS volvieron
    `).then(r => r.rows);

    // 12. Canal: solicitudes por WhatsApp vs web (30 días)
    const { rows: porCanal } = await db.raw(`
      SELECT canal, COUNT(*) AS total
      FROM solicitudes
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY canal
    `);

    const totalEscribieron = parseInt(conversion.total_escribieron);
    const convirtieron = parseInt(conversion.convirtieron);
    const totalAntiguos = parseInt(retencion.total_antiguos);
    const volvieron = parseInt(retencion.volvieron);

    res.json({
      totales: {
        hoy: parseInt(totales.hoy),
        semana: parseInt(totales.semana),
        mes: parseInt(totales.mes),
        conversaciones_hoy: parseInt(totales.conversaciones_hoy),
        conversaciones_semana: parseInt(totales.conversaciones_semana),
        conversaciones_mes: parseInt(totales.conversaciones_mes),
      },
      top_telefonos: top.map(r => ({
        telefono: r.telefono_usuario,
        nombre: tmap[r.telefono_usuario]?.nombre || null,
        tipo: tmap[r.telefono_usuario]?.tipo || 'desconocido',
        total: parseInt(r.total),
      })),
      por_dia: porDia.map(r => ({
        dia: r.dia,
        total: parseInt(r.total),
        personas: parseInt(r.personas),
      })),
      por_semana: porSemana.map(r => ({
        semana: r.semana,
        total: parseInt(r.total),
        personas: parseInt(r.personas),
      })),
      opciones_menu: opcionesMenu.map(r => ({
        opcion: r.opcion,
        total: parseInt(r.total),
      })),
      top_preguntas: preguntas.map(r => ({
        pregunta: r.pregunta,
        total: parseInt(r.total),
      })),
      tipos_entrada: {
        opciones_menu: parseInt(tiposEntrada.opciones_menu),
        texto_libre: parseInt(tiposEntrada.texto_libre),
        audios: parseInt(tiposEntrada.audios),
        otros_media: parseInt(tiposEntrada.otros_media),
        vacios: parseInt(tiposEntrada.vacios),
        total: parseInt(tiposEntrada.total),
      },
      // Nuevas
      conversion: {
        total_escribieron: totalEscribieron,
        total_crearon_solicitud: parseInt(conversion.total_crearon),
        convirtieron: convirtieron,
        tasa: totalEscribieron > 0 ? Math.round((convirtieron / totalEscribieron) * 100) : 0,
      },
      atascos_sesiones: atascosSesiones.map(r => ({
        estado: r.estado,
        total: parseInt(r.total),
      })),
      heatmap: heatmap.map(r => ({
        dia_semana: parseInt(r.dia_semana),
        hora: parseInt(r.hora),
        total: parseInt(r.total),
      })),
      posible_friccion: posibleFriccion.map(r => ({
        telefono: r.telefono_usuario,
        mensajes: parseInt(r.mensajes),
        ultimo_msg: r.ultimo_msg,
        creo_solicitud: !!r.creo_solicitud,
      })),
      retencion: {
        total_antiguos: totalAntiguos,
        volvieron,
        tasa: totalAntiguos > 0 ? Math.round((volvieron / totalAntiguos) * 100) : 0,
      },
      por_canal: porCanal.reduce((acc, r) => {
        acc[r.canal] = parseInt(r.total);
        return acc;
      }, { web: 0, whatsapp: 0 }),
    });
  } catch (err) {
    console.error('stats conversaciones:', err);
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
}

// ─── GET /api/conversaciones/diag ───────────────────────────────────────────
// Diagnóstico rápido: ¿estoy configurado?, ¿Twilio responde?, ¿cuántos mensajes?
async function diag(req, res) {
  const out = {
    twilio_configurado: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    twilio_sid: process.env.TWILIO_ACCOUNT_SID
      ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 6)}…${process.env.TWILIO_ACCOUNT_SID.slice(-4)}`
      : null,
  };
  try {
    const convs = await listConversaciones({ limit: 1000 });
    out.twilio_ok = true;
    out.conversaciones_twilio = convs.length;
    out.muestra = convs.slice(0, 3).map(c => ({
      telefono: c.telefono,
      total_mensajes: c.total_mensajes,
      ultima_fecha: c.ultima_fecha,
    }));

    // Reproduce el enriquecimiento de nombres para detectar fallos
    try {
      const telefonos = convs.map(c => c.telefono);
      out.tel_count = telefonos.length;
      out.tel_muestra = telefonos.slice(0, 5);
      const tmap = await resolverNombres(telefonos);
      out.nombres_resueltos = Object.keys(tmap).length;
    } catch (err) {
      out.enriquecer_error = err.message;
      out.enriquecer_stack = (err.stack || '').split('\n').slice(0, 3).join(' | ');
    }
  } catch (err) {
    out.twilio_ok = false;
    out.twilio_error = err.message;
  }
  try {
    const [{ count }] = await db('whatsapp_mensajes').count('id as count');
    out.db_mensajes = parseInt(count);
  } catch (err) {
    out.db_error = err.message;
  }
  res.json(out);
}

module.exports = { guardarMensaje, listar, hilo, stats, media, diag };
