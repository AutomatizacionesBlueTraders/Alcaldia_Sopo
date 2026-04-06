const db = require('../config/db');

// ============ SESIÓN ============

async function getSesion(telefono) {
  let sesion = await db('whatsapp_sesiones').where({ telefono }).first();
  if (!sesion) {
    [sesion] = await db('whatsapp_sesiones')
      .insert({ telefono, estado: 'idle', datos: {} })
      .returning('*');
  }
  return sesion;
}

async function setSesion(telefono, estado, datos = {}) {
  await db('whatsapp_sesiones')
    .where({ telefono })
    .update({ estado, datos: JSON.stringify(datos), updated_at: db.fn.now() });
}

// ============ MENU PRINCIPAL ============

const MENU = `Hola! Soy el asistente de *Transporte Alcaldía de Sopó* 🚗

¿Qué deseas hacer?

1️⃣ Solicitar un servicio de transporte
2️⃣ Consultar mis solicitudes
3️⃣ Cancelar una solicitud

Responde con el número de tu opción.`;

// ============ BOT PRINCIPAL ============

async function procesarMensaje(req, res) {
  const { from, body: rawBody } = req.body;
  if (!from || !rawBody) return res.status(400).json({ error: 'Faltan from o body' });

  const telefono = from.replace('whatsapp:', '').trim();
  const msg = rawBody.trim().toLowerCase();

  const sesion = await getSesion(telefono);
  const estado = sesion.estado;
  const datos = typeof sesion.datos === 'string' ? JSON.parse(sesion.datos) : sesion.datos;

  let respuesta = '';

  // ──── ENCUESTA (estado especial, llega desde notificación post-servicio) ────
  if (estado === 'encuesta') {
    const num = parseInt(msg);
    if (num >= 1 && num <= 5) {
      if (datos.solicitud_id) {
        await db('encuestas').insert({
          solicitud_id: datos.solicitud_id,
          calificacion: num,
          comentario: null
        });
      }
      await setSesion(telefono, 'idle', {});
      respuesta = `✅ ¡Gracias por tu calificación de *${num} estrella${num > 1 ? 's' : ''}*! Tu opinión nos ayuda a mejorar el servicio. 🙏`;
    } else {
      respuesta = 'Por favor responde con un número del *1 al 5* para calificar el servicio.';
    }
    return res.json({ respuesta, to: from });
  }

  // ──── CONFIRMACIÓN DE SERVICIO (llega desde notificación de programación) ────
  if (estado === 'confirmar_servicio') {
    const si = ['si', 'sí', 's', 'yes', '1'].includes(msg);
    const no = ['no', 'n', '2'].includes(msg);

    if (si || no) {
      const nuevoEstado = si ? 'CONFIRMADA' : 'NO_CONFIRMADA';
      if (datos.solicitud_id) {
        const solicitud = await db('solicitudes').where({ id: datos.solicitud_id }).first();
        if (solicitud) {
          await db('solicitudes').where({ id: datos.solicitud_id }).update({ estado: nuevoEstado, updated_at: db.fn.now() });
          await db('historial_solicitudes').insert({
            solicitud_id: datos.solicitud_id,
            estado_anterior: solicitud.estado,
            estado_nuevo: nuevoEstado,
            notas: `Confirmación vía WhatsApp: ${si ? 'CONFIRMADO' : 'NO CONFIRMADO'}`
          });
        }
      }
      await setSesion(telefono, 'idle', {});
      respuesta = si
        ? '✅ *Servicio confirmado*. ¡Gracias! Te avisaremos cuando el conductor salga.'
        : '❌ *Servicio no confirmado*. Hemos registrado tu respuesta. La administradora tomará las medidas necesarias.';
    } else {
      respuesta = 'Por favor responde *SI* para confirmar o *NO* para rechazar el servicio.';
    }
    return res.json({ respuesta, to: from });
  }

  // ──── FLUJO NUEVA SOLICITUD ────
  if (estado === 'sol_fecha') {
    const fecha = parseFecha(msg);
    if (!fecha) {
      respuesta = '❌ Formato de fecha no válido. Por favor ingresa la fecha en formato *DD/MM/AAAA* (ej: 25/04/2026).';
    } else if (new Date(fecha) < new Date()) {
      respuesta = '❌ La fecha debe ser futura. Intenta de nuevo (DD/MM/AAAA).';
    } else {
      await setSesion(telefono, 'sol_hora', { ...datos, fecha });
      respuesta = `📅 Fecha: *${msg.toUpperCase()}*\n\n⏰ ¿A qué hora necesitas el servicio? (formato HH:MM, ej: 08:30)`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_hora') {
    const hora = parseHora(msg);
    if (!hora) {
      respuesta = '❌ Formato de hora no válido. Usa HH:MM (ej: 08:30).';
    } else {
      await setSesion(telefono, 'sol_origen', { ...datos, hora_inicio: hora });
      respuesta = `⏰ Hora: *${hora}*\n\n📍 ¿Desde dónde salen? (escribe el lugar de origen)`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_origen') {
    if (msg.length < 3) {
      respuesta = 'Por favor escribe el lugar de origen con más detalle.';
    } else {
      await setSesion(telefono, 'sol_destino', { ...datos, origen: rawBody.trim() });
      respuesta = `📍 Origen: *${rawBody.trim()}*\n\n🏁 ¿A dónde van? (lugar de destino)`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_destino') {
    if (msg.length < 3) {
      respuesta = 'Por favor escribe el destino con más detalle.';
    } else {
      await setSesion(telefono, 'sol_pasajeros', { ...datos, destino: rawBody.trim() });
      respuesta = `🏁 Destino: *${rawBody.trim()}*\n\n👥 ¿Cuántos pasajeros van?`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_pasajeros') {
    const n = parseInt(msg);
    if (!n || n < 1 || n > 50) {
      respuesta = '❌ Ingresa un número válido de pasajeros (entre 1 y 50).';
    } else {
      // Obtener lista de dependencias
      const deps = await db('dependencias').where({ activo: true }).orderBy('nombre');
      const lista = deps.map((d, i) => `${i + 1}️⃣ ${d.nombre}`).join('\n');
      await setSesion(telefono, 'sol_dependencia', { ...datos, pasajeros: n, dependencias: deps.map(d => ({ id: d.id, nombre: d.nombre })) });
      respuesta = `👥 Pasajeros: *${n}*\n\n🏢 ¿A qué dependencia perteneces?\n\n${lista}`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_dependencia') {
    const idx = parseInt(msg) - 1;
    const deps = datos.dependencias || [];
    if (idx < 0 || idx >= deps.length || isNaN(idx)) {
      const lista = deps.map((d, i) => `${i + 1}️⃣ ${d.nombre}`).join('\n');
      respuesta = `❌ Opción no válida. Elige un número:\n\n${lista}`;
    } else {
      const dep = deps[idx];
      await setSesion(telefono, 'sol_contacto_nombre', { ...datos, dependencia_id: dep.id, dependencia_nombre: dep.nombre, dependencias: undefined });
      respuesta = `🏢 Dependencia: *${dep.nombre}*\n\n👤 ¿Nombre completo del contacto responsable?`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_contacto_nombre') {
    if (msg.length < 3) {
      respuesta = 'Por favor escribe el nombre completo del contacto.';
    } else {
      await setSesion(telefono, 'sol_contacto_tel', { ...datos, contacto_nombre: rawBody.trim() });
      respuesta = `👤 Contacto: *${rawBody.trim()}*\n\n📞 ¿Teléfono del contacto? (ej: 3001234567)`;
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_contacto_tel') {
    const tel = msg.replace(/\D/g, '');
    if (tel.length < 7) {
      respuesta = '❌ Teléfono no válido. Ingresa el número sin espacios ni guiones.';
    } else {
      const d = { ...datos, contacto_telefono: tel };
      await setSesion(telefono, 'sol_confirmar', d);
      respuesta = resumenSolicitud(d);
    }
    return res.json({ respuesta, to: from });
  }

  if (estado === 'sol_confirmar') {
    const si = ['si', 'sí', 's', 'yes'].includes(msg);
    const no = ['no', 'n'].includes(msg);

    if (si) {
      try {
        // Buscar usuario por dependencia (cualquier usuario activo de esa dependencia)
        const usuario = await db('usuarios').where({ dependencia_id: datos.dependencia_id }).first();
        const fechaISO = parseFecha(datos.fecha); // YYYY-MM-DD

        const [solicitud] = await db('solicitudes').insert({
          dependencia_id: datos.dependencia_id,
          usuario_id: usuario?.id || null,
          fecha_servicio: fechaISO,
          hora_inicio: datos.hora_inicio,
          origen: datos.origen,
          destino: datos.destino,
          pasajeros: datos.pasajeros,
          contacto_nombre: datos.contacto_nombre,
          contacto_telefono: datos.contacto_telefono,
          estado: 'ENVIADA',
          canal: 'whatsapp'
        }).returning('*');

        await db('historial_solicitudes').insert({
          solicitud_id: solicitud.id,
          estado_anterior: null,
          estado_nuevo: 'ENVIADA',
          notas: `Solicitud creada vía WhatsApp desde ${telefono}`
        });

        await setSesion(telefono, 'idle', {});
        respuesta = `✅ *Solicitud #${solicitud.id} creada exitosamente*\n\nLa administradora revisará tu solicitud y te notificaremos por este medio cuando sea programada.\n\n¿Necesitas algo más? Escribe *menú* para volver al inicio.`;
      } catch (err) {
        console.error('Error creando solicitud WhatsApp:', err);
        await setSesion(telefono, 'idle', {});
        respuesta = '❌ Ocurrió un error al crear la solicitud. Por favor intenta de nuevo más tarde.';
      }
    } else if (no) {
      await setSesion(telefono, 'idle', {});
      respuesta = '❌ Solicitud cancelada. Escribe *menú* si deseas comenzar de nuevo.';
    } else {
      respuesta = 'Por favor responde *SI* para confirmar o *NO* para cancelar la solicitud.';
    }
    return res.json({ respuesta, to: from });
  }

  // ──── CANCELAR SOLICITUD ────
  if (estado === 'cancelar_id') {
    const solicitudId = parseInt(msg);
    if (!solicitudId) {
      respuesta = '❌ Por favor ingresa el *número* de tu solicitud (ej: 12).';
    } else {
      const solicitud = await db('solicitudes').where({ id: solicitudId }).first();
      if (!solicitud) {
        respuesta = `❌ No encontré la solicitud #${solicitudId}. Verifica el número e intenta de nuevo.`;
      } else if (['CANCELADA', 'RECHAZADA', 'FINALIZADA'].includes(solicitud.estado)) {
        respuesta = `❌ La solicitud #${solicitudId} está en estado *${solicitud.estado}* y no se puede cancelar.`;
        await setSesion(telefono, 'idle', {});
      } else if (['EN_EJECUCION'].includes(solicitud.estado)) {
        respuesta = `❌ La solicitud #${solicitudId} ya está *en ejecución* y no se puede cancelar desde aquí. Comunícate con la administradora.`;
        await setSesion(telefono, 'idle', {});
      } else {
        await db('solicitudes').where({ id: solicitudId }).update({ estado: 'CANCELADA', updated_at: db.fn.now() });
        await db('historial_solicitudes').insert({
          solicitud_id: solicitudId,
          estado_anterior: solicitud.estado,
          estado_nuevo: 'CANCELADA',
          notas: `Cancelada por usuario vía WhatsApp (${telefono})`
        });
        // Liberar calendarios si había asignación
        const asig = await db('asignaciones').where({ solicitud_id: solicitudId }).first();
        if (asig) {
          await db('calendario_vehiculos').where({ solicitud_id: solicitudId }).update({ estado: 'cancelado' });
          await db('calendario_conductores').where({ solicitud_id: solicitudId }).update({ estado: 'cancelado' });
        }
        await setSesion(telefono, 'idle', {});
        respuesta = `✅ Solicitud #${solicitudId} cancelada exitosamente.`;
      }
    }
    return res.json({ respuesta, to: from });
  }

  // ──── MENÚ / ESTADO IDLE ────
  // Palabras clave que siempre vuelven al menú
  if (['menu', 'menú', 'hola', 'inicio', 'start', 'help', 'ayuda', '0'].includes(msg) || estado === 'idle') {
    if (msg === '1' && estado === 'idle') {
      await setSesion(telefono, 'sol_fecha', {});
      respuesta = '📅 ¿Para qué fecha necesitas el servicio? Escribe en formato *DD/MM/AAAA* (ej: 25/04/2026)';
      return res.json({ respuesta, to: from });
    }
    if (msg === '2' && estado === 'idle') {
      const solicitudesActivas = await db('solicitudes')
        .where({ canal: 'whatsapp' })
        .whereNotIn('estado', ['CANCELADA', 'RECHAZADA', 'FINALIZADA'])
        .orderBy('created_at', 'desc')
        .limit(5);

      if (solicitudesActivas.length === 0) {
        respuesta = 'No tienes solicitudes activas registradas por WhatsApp.\n\nEscribe *1* para crear una nueva.';
      } else {
        const lista = solicitudesActivas.map(s =>
          `• *#${s.id}* — ${s.fecha_servicio?.toString().substring(0, 10)} | ${s.origen} → ${s.destino} | Estado: *${s.estado}*`
        ).join('\n');
        respuesta = `📋 *Tus solicitudes activas:*\n\n${lista}\n\nEscribe *menú* para volver al inicio.`;
      }
      return res.json({ respuesta, to: from });
    }
    if (msg === '3' && estado === 'idle') {
      await setSesion(telefono, 'cancelar_id', {});
      respuesta = '🚫 ¿Cuál es el número de la solicitud que deseas cancelar? (ej: 12)';
      return res.json({ respuesta, to: from });
    }

    // Mostrar menú
    await setSesion(telefono, 'idle', {});
    respuesta = MENU;
    return res.json({ respuesta, to: from });
  }

  // Fallback
  await setSesion(telefono, 'idle', {});
  respuesta = MENU;
  res.json({ respuesta, to: from });
}

// ============ RECORDATORIOS (llamado por n8n cron) ============

async function recordatorios(req, res) {
  try {
    const { enviarWhatsApp } = require('../utils/twilio');
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaMañana = manana.toISOString().substring(0, 10);

    const servicios = await db('asignaciones')
      .where('asignaciones.fecha', fechaMañana)
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('conductores', 'asignaciones.conductor_id', 'conductores.id')
      .whereIn('solicitudes.estado', ['PROGRAMADA', 'CONFIRMADA'])
      .select(
        'solicitudes.id as solicitud_id',
        'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.contacto_nombre', 'solicitudes.contacto_telefono',
        'asignaciones.hora_inicio',
        'conductores.nombre as conductor_nombre', 'conductores.telefono as conductor_telefono'
      );

    for (const s of servicios) {
      // Recordatorio a dependencia
      if (s.contacto_telefono) {
        await enviarWhatsApp(`+${s.contacto_telefono.replace(/\D/g, '')}`,
          `🔔 *Recordatorio de servicio — Alcaldía de Sopó*\n\nMañana tienes un servicio de transporte programado:\n\n📍 *${s.origen} → ${s.destino}*\n⏰ Hora: *${s.hora_inicio?.substring(0, 5)}*\n🚗 Conductor: *${s.conductor_nombre}*\n\nSolicitud #${s.solicitud_id}`
        );
      }
      // Recordatorio a conductor
      if (s.conductor_telefono) {
        await enviarWhatsApp(`+57${s.conductor_telefono.replace(/\D/g, '')}`,
          `🔔 *Recordatorio de servicio — Alcaldía de Sopó*\n\nMañana tienes un servicio asignado:\n\n📍 *${s.origen} → ${s.destino}*\n⏰ Hora: *${s.hora_inicio?.substring(0, 5)}*\n👤 Contacto: ${s.contacto_nombre}\n\nSolicitud #${s.solicitud_id}`
        );
      }
    }

    res.json({ enviados: servicios.length });
  } catch (err) {
    console.error('Error en recordatorios:', err);
    res.status(500).json({ error: 'Error al enviar recordatorios' });
  }
}

// ============ HELPERS ============

function parseFecha(str) {
  // Acepta DD/MM/AAAA o YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function parseHora(str) {
  const m = str.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1]), min = parseInt(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${h.toString().padStart(2, '0')}:${m[2]}`;
}

function resumenSolicitud(d) {
  return `📋 *Resumen de tu solicitud:*\n\n` +
    `📅 Fecha: *${d.fecha}*\n` +
    `⏰ Hora: *${d.hora_inicio}*\n` +
    `📍 Origen: *${d.origen}*\n` +
    `🏁 Destino: *${d.destino}*\n` +
    `👥 Pasajeros: *${d.pasajeros}*\n` +
    `🏢 Dependencia: *${d.dependencia_nombre}*\n` +
    `👤 Contacto: *${d.contacto_nombre}* — ${d.contacto_telefono}\n\n` +
    `¿Confirmas el envío? Responde *SI* para enviar o *NO* para cancelar.`;
}

module.exports = { procesarMensaje, recordatorios };
