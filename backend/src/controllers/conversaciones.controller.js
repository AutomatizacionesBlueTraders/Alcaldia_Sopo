const db = require('../config/db');
const { descargarAudioTwilio } = require('../utils/twilioMedia');

// Normaliza "whatsapp:+573001234567" → "573001234567" (solo dígitos)
function normalizarTelefono(raw) {
  if (!raw) return null;
  return String(raw).replace(/\D/g, '') || null;
}

// ─── POST /api/whatsapp/mensaje (n8n, api-key) ──────────────────────────────

async function guardarMensaje(req, res) {
  try {
    const {
      direccion, message_sid, from, to, body,
      num_media, media_url, media_content_type, status
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

    // Idempotencia: si ya está guardado, no duplicar
    if (message_sid) {
      const existe = await db('whatsapp_mensajes').where({ message_sid }).first();
      if (existe) return res.json({ ok: true, ya_existe: true, id: existe.id });
    }

    // Descarga de audio (si aplica y hay media)
    let media_path = null;
    let media_content_type_final = media_content_type || null;
    const numMediaInt = parseInt(num_media) || 0;

    if (numMediaInt > 0 && media_url && media_content_type &&
        media_content_type.toLowerCase().startsWith('audio/')) {
      const descarga = await descargarAudioTwilio({
        mediaUrl: media_url,
        messageSid: message_sid || `nosid-${Date.now()}`
      });
      if (descarga) {
        media_path = descarga.path;
        media_content_type_final = descarga.contentType;
      }
    }

    const [row] = await db('whatsapp_mensajes').insert({
      message_sid: message_sid || null,
      telefono_usuario,
      telefono_twilio,
      direccion,
      body: body || null,
      media_url: media_url || null,
      media_path,
      media_content_type: media_content_type_final,
      num_media: numMediaInt,
      status: status || null,
    }).returning('*');

    res.json({ ok: true, id: row.id });
  } catch (err) {
    console.error('guardarMensaje WA:', err);
    res.status(500).json({ error: 'Error al guardar mensaje' });
  }
}

// ─── GET /api/conversaciones (JWT) ──────────────────────────────────────────
// Lista agrupada por teléfono con último mensaje, fecha y conteo
async function listar(req, res) {
  try {
    const { q } = req.query;

    let base = db('whatsapp_mensajes')
      .select('telefono_usuario')
      .max('created_at as ultima_fecha')
      .count('id as total_mensajes')
      .groupBy('telefono_usuario')
      .orderBy('ultima_fecha', 'desc');

    if (q) {
      base = base.where('telefono_usuario', 'like', `%${String(q).replace(/\D/g, '')}%`);
    }

    const grupos = await base;

    // Último body por conversación (una consulta extra)
    const telefonos = grupos.map(g => g.telefono_usuario);
    let ultimos = [];
    if (telefonos.length) {
      ultimos = await db.raw(`
        SELECT DISTINCT ON (telefono_usuario)
          telefono_usuario, body, direccion, created_at, num_media, media_path
        FROM whatsapp_mensajes
        WHERE telefono_usuario = ANY(?)
        ORDER BY telefono_usuario, created_at DESC
      `, [telefonos]);
      ultimos = ultimos.rows;
    }
    const ultimosMap = Object.fromEntries(ultimos.map(u => [u.telefono_usuario, u]));

    // Intentar enriquecer con nombre desde usuarios o conductores
    const tmap = {};
    if (telefonos.length) {
      const usuarios = await db('usuarios').whereIn('telefono', telefonos).select('telefono', 'nombre');
      const conductores = await db('conductores').whereIn('telefono', telefonos).select('telefono', 'nombre');
      usuarios.forEach(u => { tmap[normalizarTelefono(u.telefono)] = { nombre: u.nombre, tipo: 'dependencia' }; });
      conductores.forEach(c => { tmap[normalizarTelefono(c.telefono)] = { nombre: c.nombre, tipo: 'conductor' }; });
    }

    const result = grupos.map(g => {
      const ult = ultimosMap[g.telefono_usuario] || {};
      const meta = tmap[g.telefono_usuario] || {};
      return {
        telefono: g.telefono_usuario,
        nombre: meta.nombre || null,
        tipo: meta.tipo || 'desconocido',
        total_mensajes: parseInt(g.total_mensajes),
        ultima_fecha: g.ultima_fecha,
        ultimo_mensaje: ult.body || (ult.num_media > 0 ? '🎵 Audio' : ''),
        ultima_direccion: ult.direccion || null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('listar conversaciones:', err);
    res.status(500).json({ error: 'Error al listar conversaciones' });
  }
}

// ─── GET /api/conversaciones/:telefono ──────────────────────────────────────
// Hilo completo paginado
async function hilo(req, res) {
  try {
    const telefono = normalizarTelefono(req.params.telefono);
    if (!telefono) return res.status(400).json({ error: 'telefono inválido' });

    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const before = req.query.before ? new Date(req.query.before) : null;

    let q = db('whatsapp_mensajes')
      .where({ telefono_usuario: telefono })
      .orderBy('created_at', 'desc')
      .limit(limit);
    if (before) q = q.where('created_at', '<', before);

    const mensajes = await q.select(
      'id', 'message_sid', 'direccion', 'body',
      'media_path', 'media_content_type', 'num_media',
      'status', 'created_at'
    );

    // Resolver nombre
    let meta = null;
    const u = await db('usuarios').where({ telefono }).first();
    if (u) meta = { nombre: u.nombre, tipo: 'dependencia' };
    if (!meta) {
      const c = await db('conductores').where({ telefono }).first();
      if (c) meta = { nombre: c.nombre, tipo: 'conductor' };
    }

    res.json({
      telefono,
      nombre: meta?.nombre || null,
      tipo: meta?.tipo || 'desconocido',
      mensajes: mensajes.reverse(), // devolver en orden cronológico ascendente
    });
  } catch (err) {
    console.error('hilo conversacion:', err);
    res.status(500).json({ error: 'Error al obtener hilo' });
  }
}

// ─── GET /api/conversaciones/stats ──────────────────────────────────────────
async function stats(req, res) {
  try {
    // Timezone Colombia
    const TZ = `'America/Bogota'`;

    // Totales agregados
    const [totales] = await db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date) AS hoy,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('week', NOW() AT TIME ZONE ${TZ})) AS semana,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('month', NOW() AT TIME ZONE ${TZ})) AS mes,
        COUNT(DISTINCT telefono_usuario) FILTER (WHERE (created_at AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date) AS conversaciones_hoy,
        COUNT(DISTINCT telefono_usuario) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('week', NOW() AT TIME ZONE ${TZ})) AS conversaciones_semana,
        COUNT(DISTINCT telefono_usuario) FILTER (WHERE (created_at AT TIME ZONE ${TZ}) >= date_trunc('month', NOW() AT TIME ZONE ${TZ})) AS conversaciones_mes
      FROM whatsapp_mensajes
    `).then(r => r.rows);

    // Top teléfonos últimos 30 días
    const { rows: top } = await db.raw(`
      SELECT m.telefono_usuario, COUNT(*) AS total
      FROM whatsapp_mensajes m
      WHERE m.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY m.telefono_usuario
      ORDER BY total DESC
      LIMIT 10
    `);

    // Enriquecer top con nombres
    const telefonosTop = top.map(r => r.telefono_usuario);
    const tmap = {};
    if (telefonosTop.length) {
      const usuarios = await db('usuarios').whereIn('telefono', telefonosTop).select('telefono', 'nombre');
      const conductores = await db('conductores').whereIn('telefono', telefonosTop).select('telefono', 'nombre');
      usuarios.forEach(u => { tmap[normalizarTelefono(u.telefono)] = { nombre: u.nombre, tipo: 'dependencia' }; });
      conductores.forEach(c => { tmap[normalizarTelefono(c.telefono)] = { nombre: c.nombre, tipo: 'conductor' }; });
    }

    // Serie por día (últimos 30) — rellena días sin datos con ceros
    const { rows: porDia } = await db.raw(`
      WITH dias AS (
        SELECT generate_series(
          (NOW() AT TIME ZONE ${TZ})::date - INTERVAL '29 days',
          (NOW() AT TIME ZONE ${TZ})::date,
          INTERVAL '1 day'
        )::date AS dia
      )
      SELECT d.dia,
             COALESCE(COUNT(*) FILTER (WHERE m.direccion = 'in'), 0) AS entrantes,
             COALESCE(COUNT(*) FILTER (WHERE m.direccion = 'out'), 0) AS salientes,
             COALESCE(COUNT(m.id), 0) AS total
      FROM dias d
      LEFT JOIN whatsapp_mensajes m
        ON (m.created_at AT TIME ZONE ${TZ})::date = d.dia
      GROUP BY d.dia
      ORDER BY d.dia ASC
    `);

    // Por semana (últimas 12)
    const { rows: porSemana } = await db.raw(`
      WITH semanas AS (
        SELECT generate_series(
          date_trunc('week', NOW() AT TIME ZONE ${TZ}) - INTERVAL '11 weeks',
          date_trunc('week', NOW() AT TIME ZONE ${TZ}),
          INTERVAL '1 week'
        )::date AS semana
      )
      SELECT s.semana,
             COALESCE(COUNT(*) FILTER (WHERE m.direccion = 'in'), 0) AS entrantes,
             COALESCE(COUNT(*) FILTER (WHERE m.direccion = 'out'), 0) AS salientes,
             COALESCE(COUNT(m.id), 0) AS total,
             COALESCE(COUNT(DISTINCT m.telefono_usuario), 0) AS personas
      FROM semanas s
      LEFT JOIN whatsapp_mensajes m
        ON date_trunc('week', m.created_at AT TIME ZONE ${TZ})::date = s.semana
      GROUP BY s.semana
      ORDER BY s.semana ASC
    `);

    // Distribución por hora del día (últimos 30 días, 0–23)
    const { rows: porHora } = await db.raw(`
      WITH horas AS (SELECT generate_series(0, 23) AS hora)
      SELECT h.hora,
             COALESCE(COUNT(*) FILTER (WHERE m.direccion = 'in'), 0) AS entrantes,
             COALESCE(COUNT(*) FILTER (WHERE m.direccion = 'out'), 0) AS salientes,
             COALESCE(COUNT(m.id), 0) AS total
      FROM horas h
      LEFT JOIN whatsapp_mensajes m
        ON EXTRACT(HOUR FROM m.created_at AT TIME ZONE ${TZ})::int = h.hora
       AND m.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY h.hora
      ORDER BY h.hora ASC
    `);

    // Contactos nuevos vs recurrentes por día (30 días).
    // "Nuevo" = el primer mensaje registrado de ese teléfono cayó en ese día.
    const { rows: nuevosPorDia } = await db.raw(`
      WITH primer_msg AS (
        SELECT telefono_usuario, MIN(created_at) AS primero
        FROM whatsapp_mensajes
        GROUP BY telefono_usuario
      ),
      dias AS (
        SELECT generate_series(
          (NOW() AT TIME ZONE ${TZ})::date - INTERVAL '29 days',
          (NOW() AT TIME ZONE ${TZ})::date,
          INTERVAL '1 day'
        )::date AS dia
      )
      SELECT d.dia,
             COALESCE(COUNT(DISTINCT p.telefono_usuario) FILTER (
               WHERE (p.primero AT TIME ZONE ${TZ})::date = d.dia
             ), 0) AS nuevos,
             COALESCE(COUNT(DISTINCT m.telefono_usuario), 0) AS activos
      FROM dias d
      LEFT JOIN whatsapp_mensajes m
        ON (m.created_at AT TIME ZONE ${TZ})::date = d.dia
      LEFT JOIN primer_msg p
        ON p.telefono_usuario = m.telefono_usuario
      GROUP BY d.dia
      ORDER BY d.dia ASC
    `);

    // Top opciones de menú (entrantes cuyo body es un número corto)
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

    // Desglose del tipo de entrada (últimos 30 días, solo entrantes)
    const [tiposEntrada] = await db.raw(`
      SELECT
        COUNT(*) FILTER (WHERE body IS NOT NULL AND TRIM(body) ~ '^[0-9]{1,3}$') AS opciones_menu,
        COUNT(*) FILTER (WHERE num_media > 0 AND media_content_type LIKE 'audio/%') AS audios,
        COUNT(*) FILTER (WHERE num_media > 0 AND (media_content_type NOT LIKE 'audio/%' OR media_content_type IS NULL)) AS otros_media,
        COUNT(*) FILTER (
          WHERE num_media = 0
            AND body IS NOT NULL
            AND TRIM(body) !~ '^[0-9]{1,3}$'
            AND LENGTH(TRIM(body)) > 0
        ) AS texto_libre,
        COUNT(*) FILTER (WHERE (body IS NULL OR LENGTH(TRIM(body)) = 0) AND num_media = 0) AS vacios,
        COUNT(*) AS total
      FROM whatsapp_mensajes
      WHERE direccion = 'in'
        AND created_at >= NOW() - INTERVAL '30 days'
    `).then(r => r.rows);

    // Top preguntas/frases de texto libre (no numéricas, ≥ 4 chars).
    // Se normaliza a minúsculas y se agrupa exacto. Útil para detectar preguntas repetidas.
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
        entrantes: parseInt(r.entrantes),
        salientes: parseInt(r.salientes),
        total: parseInt(r.total),
      })),
      por_semana: porSemana.map(r => ({
        semana: r.semana,
        entrantes: parseInt(r.entrantes),
        salientes: parseInt(r.salientes),
        total: parseInt(r.total),
        personas: parseInt(r.personas),
      })),
      por_hora: porHora.map(r => ({
        hora: parseInt(r.hora),
        entrantes: parseInt(r.entrantes),
        salientes: parseInt(r.salientes),
        total: parseInt(r.total),
      })),
      nuevos_por_dia: nuevosPorDia.map(r => ({
        dia: r.dia,
        nuevos: parseInt(r.nuevos),
        activos: parseInt(r.activos),
      })),
      opciones_menu: opcionesMenu.map(r => ({
        opcion: r.opcion,
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
      top_preguntas: preguntas.map(r => ({
        pregunta: r.pregunta,
        total: parseInt(r.total),
      })),
    });
  } catch (err) {
    console.error('stats conversaciones:', err);
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
}

module.exports = { guardarMensaje, listar, hilo, stats };
