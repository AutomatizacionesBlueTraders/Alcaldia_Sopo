const db = require('../config/db');
const { notificarN8n } = require('../utils/twilio');

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function getOrCreateSesion(telefono) {
  let sesion = await db('whatsapp_sesiones').where({ telefono }).first();
  if (!sesion) {
    [sesion] = await db('whatsapp_sesiones')
      .insert({ telefono, estado: 'idle', datos: {} })
      .returning('*');
  }
  return sesion;
}

function parseDatos(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

// ─── CONTEXTO (usuario + sesión en una sola llamada) ────────────────────────

async function contexto(req, res) {
  try {
    const { telefono } = req.query;
    if (!telefono) return res.status(400).json({ error: 'telefono requerido' });

    const sesion = await getOrCreateSesion(telefono);
    const sesionBase = { sesion_estado: sesion.estado, sesion_datos: parseDatos(sesion.datos) };

    // ¿Es conductor?
    const conductor = await db('conductores').where({ telefono, activo: true }).first();
    if (conductor) {
      return res.json({ tipo: 'conductor', nombre: conductor.nombre, conductor_id: conductor.id, ...sesionBase });
    }

    // ¿Es usuario de dependencia?
    const usuario = await db('usuarios')
      .join('dependencias', 'usuarios.dependencia_id', 'dependencias.id')
      .where({ 'usuarios.telefono': telefono, 'usuarios.activo': true })
      .select('usuarios.id', 'usuarios.nombre', 'usuarios.dependencia_id', 'dependencias.nombre as dependencia_nombre')
      .first();
    if (usuario) {
      return res.json({
        tipo: 'dependencia',
        nombre: usuario.nombre,
        usuario_id: usuario.id,
        dependencia_id: usuario.dependencia_id,
        dependencia_nombre: usuario.dependencia_nombre,
        ...sesionBase
      });
    }

    res.json({ tipo: 'desconocido', ...sesionBase });
  } catch (err) {
    console.error('contexto WA:', err);
    res.status(500).json({ error: 'Error al obtener contexto' });
  }
}

// ─── SESIÓN ──────────────────────────────────────────────────────────────────

async function getSesion(req, res) {
  try {
    const { telefono } = req.query;
    if (!telefono) return res.status(400).json({ error: 'telefono requerido' });
    const sesion = await getOrCreateSesion(telefono);
    res.json({ estado: sesion.estado, datos: parseDatos(sesion.datos) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
}

async function setSesion(req, res) {
  try {
    const { telefono, estado, datos } = req.body;
    if (!telefono || !estado) return res.status(400).json({ error: 'telefono y estado requeridos' });
    await db('whatsapp_sesiones')
      .where({ telefono })
      .update({ estado, datos: JSON.stringify(datos || {}), updated_at: db.fn.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
}

// ─── CATÁLOGOS ───────────────────────────────────────────────────────────────

async function getDependencias(req, res) {
  try {
    const deps = await db('dependencias').where({ activo: true }).orderBy('nombre')
      .select('id', 'nombre');
    res.json(deps);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar dependencias' });
  }
}

// ─── SOLICITUDES ─────────────────────────────────────────────────────────────

async function crearSolicitud(req, res) {
  try {
    const {
      telefono, fecha_servicio, hora_inicio, origen, destino,
      pasajeros, dependencia_id, contacto_nombre, contacto_telefono
    } = req.body;

    if (!fecha_servicio || !hora_inicio || !origen || !destino || !pasajeros || !dependencia_id || !contacto_nombre) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos obligatorios para crear la solicitud' });
    }

    const usuario = await db('usuarios').where({ dependencia_id, activo: true }).first();

    const [solicitud] = await db('solicitudes').insert({
      dependencia_id,
      usuario_id: usuario?.id || null,
      fecha_servicio,
      hora_inicio,
      origen,
      destino,
      pasajeros: parseInt(pasajeros),
      contacto_nombre,
      contacto_telefono: contacto_telefono || telefono,
      estado: 'RECIBIDA',
      canal: 'whatsapp'
    }).returning('*');

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_nuevo: 'RECIBIDA',
      notas: `Creada vía WhatsApp (${telefono})`
    });

    if (telefono) {
      await db('whatsapp_sesiones').where({ telefono })
        .update({ estado: 'idle', datos: JSON.stringify({}), updated_at: db.fn.now() });
    }

    res.json({ ok: true, solicitud_id: solicitud.id, mensaje: `✅ Solicitud #${solicitud.id} creada. La administradora la revisará y te notificará por aquí cuando sea programada.` });
  } catch (err) {
    console.error('crearSolicitud WA:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la solicitud. Intenta de nuevo.' });
  }
}

async function misSolicitudes(req, res) {
  try {
    const { telefono } = req.query;
    if (!telefono) return res.status(400).json({ error: 'telefono requerido' });

    const solicitudes = await db('solicitudes')
      .where({ canal: 'whatsapp', contacto_telefono: telefono })
      .whereNotIn('estado', ['CANCELADA', 'RECHAZADA', 'FINALIZADA'])
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('id', 'fecha_servicio', 'origen', 'destino', 'estado', 'hora_inicio');

    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar solicitudes' });
  }
}

async function cancelarSolicitud(req, res) {
  try {
    const { solicitud_id, telefono, motivo } = req.body;
    if (!solicitud_id) return res.status(400).json({ ok: false, mensaje: 'solicitud_id requerido' });

    const solicitud = await db('solicitudes').where({ id: solicitud_id }).first();
    if (!solicitud) return res.json({ ok: false, mensaje: `❌ No encontré la solicitud #${solicitud_id}. Verifica el número.` });

    if (['CANCELADA', 'RECHAZADA', 'FINALIZADA', 'EN_EJECUCION'].includes(solicitud.estado)) {
      return res.json({ ok: false, mensaje: `❌ La solicitud #${solicitud_id} está en estado *${solicitud.estado}* y no puede cancelarse.` });
    }

    const motivoCancelacion = motivo || `Cancelada vía WhatsApp (${telefono || 'desconocido'})`;

    await db('solicitudes').where({ id: solicitud_id }).update({ estado: 'CANCELADA', motivo_cancelacion: motivoCancelacion, updated_at: db.fn.now() });
    await db('historial_solicitudes').insert({
      solicitud_id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'CANCELADA',
      notas: motivoCancelacion
    });

    const asig = await db('asignaciones').where({ solicitud_id }).first();
    if (asig) {
      await db('calendario_vehiculos').where({ solicitud_id }).update({ estado: 'cancelado' });
      await db('calendario_conductores').where({ solicitud_id }).update({ estado: 'cancelado' });
    }

    if (telefono) {
      await db('whatsapp_sesiones').where({ telefono })
        .update({ estado: 'idle', datos: JSON.stringify({}), updated_at: db.fn.now() });
    }

    res.json({ ok: true, mensaje: `✅ Solicitud #${solicitud_id} cancelada exitosamente.` });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al cancelar. Intenta de nuevo.' });
  }
}

async function confirmarServicio(req, res) {
  try {
    const { solicitud_id, telefono, confirmado, motivo } = req.body;

    const solicitud = await db('solicitudes').where({ id: solicitud_id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Solo motivo, sin cambiar estado
    if (confirmado === undefined && motivo) {
      await db('solicitudes').where({ id: solicitud_id }).update({ motivo_cancelacion: motivo, updated_at: db.fn.now() });
      await db('historial_solicitudes').insert({
        solicitud_id,
        estado_anterior: solicitud.estado,
        estado_nuevo: solicitud.estado,
        notas: `Motivo registrado vía WhatsApp: ${motivo}`
      });
      return res.json({ ok: true, motivo });
    }

    const nuevoEstado = confirmado ? 'CONFIRMADA' : 'CANCELADA';

    // Idempotente: si ya está en el estado destino, no hacer nada
    if (solicitud.estado === nuevoEstado) {
      return res.json({ ok: true, confirmado, ya_en_estado: true });
    }

    // Validar transiciones permitidas desde el estado actual
    if (confirmado) {
      // Solo se puede confirmar si fue programada (ya tiene vehículo/conductor asignado)
      if (solicitud.estado !== 'PROGRAMADA') {
        return res.status(400).json({
          error: `No se puede confirmar en estado ${solicitud.estado}. La solicitud debe estar PROGRAMADA.`
        });
      }
    } else {
      // Cancelar: no se puede si ya está en curso o cerrada
      if (['EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'RECHAZADA'].includes(solicitud.estado)) {
        return res.status(400).json({
          error: `No se puede cancelar en estado ${solicitud.estado}.`
        });
      }
    }

    const updateData = { estado: nuevoEstado, updated_at: db.fn.now() };
    if (!confirmado) updateData.motivo_cancelacion = motivo || 'No confirmada por el solicitante vía WhatsApp';

    await db('solicitudes').where({ id: solicitud_id }).update(updateData);
    await db('historial_solicitudes').insert({
      solicitud_id,
      estado_anterior: solicitud.estado,
      estado_nuevo: nuevoEstado,
      notas: confirmado ? 'Confirmado vía WhatsApp' : `Cancelada (no confirmada) vía WhatsApp: ${motivo || 'Sin motivo'}`
    });

    // Si cancelan una solicitud ya programada, liberar calendarios
    if (!confirmado && ['PROGRAMADA', 'CONFIRMADA'].includes(solicitud.estado)) {
      await db('calendario_vehiculos').where({ solicitud_id }).update({ estado: 'cancelado' });
      await db('calendario_conductores').where({ solicitud_id }).update({ estado: 'cancelado' });
    }

    if (telefono) {
      await db('whatsapp_sesiones').where({ telefono })
        .update({ estado: 'idle', datos: JSON.stringify({}), updated_at: db.fn.now() });
    }

    res.json({ ok: true, confirmado });
  } catch (err) {
    res.status(500).json({ error: 'Error al confirmar' });
  }
}

async function guardarEncuesta(req, res) {
  try {
    const { solicitud_id, calificacion, telefono } = req.body;
    if (!solicitud_id || !calificacion) {
      return res.status(400).json({ error: 'solicitud_id y calificacion requeridos' });
    }

    await db('encuestas').insert({ solicitud_id, calificacion: parseInt(calificacion), comentario: null });

    if (telefono) {
      await db('whatsapp_sesiones').where({ telefono })
        .update({ estado: 'idle', datos: JSON.stringify({}), updated_at: db.fn.now() });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar encuesta' });
  }
}

// ─── CONDUCTOR (por teléfono, sin JWT) ──────────────────────────────────────

async function serviciosConductorWa(req, res) {
  try {
    const { telefono } = req.query;
    const conductor = await db('conductores').where({ telefono, activo: true }).first();
    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' });

    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const servicios = await db('asignaciones')
      .where({ 'asignaciones.conductor_id': conductor.id })
      .where('asignaciones.fecha', '>=', hoy)
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .whereNotIn('solicitudes.estado', ['CANCELADA', 'RECHAZADA'])
      .select(
        'asignaciones.id', 'asignaciones.fecha', 'asignaciones.hora_inicio', 'asignaciones.hora_fin',
        'asignaciones.km_inicial',
        'solicitudes.id as solicitud_id', 'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.estado as estado_solicitud', 'solicitudes.pasajeros',
        'solicitudes.contacto_nombre', 'solicitudes.contacto_telefono',
        'vehiculos.placa', 'vehiculos.marca'
      )
      .orderBy('asignaciones.fecha')
      .orderBy('asignaciones.hora_inicio')
      .limit(10);

    res.json({ conductor_id: conductor.id, nombre: conductor.nombre, servicios });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
}

async function iniciarServicioWa(req, res) {
  try {
    const { asignacion_id, km_inicial, telefono } = req.body;
    const conductor = await db('conductores').where({ telefono, activo: true }).first();
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    const asignacion = await db('asignaciones')
      .where({ id: asignacion_id, conductor_id: conductor.id }).first();
    if (!asignacion) return res.json({ ok: false, mensaje: `❌ Servicio #${asignacion_id} no encontrado o no te pertenece.` });

    const solicitud = await db('solicitudes').where({ id: asignacion.solicitud_id }).first();
    if (!['PROGRAMADA', 'CONFIRMADA'].includes(solicitud.estado)) {
      return res.json({ ok: false, mensaje: `❌ No puedes iniciar un servicio en estado *${solicitud.estado}*.` });
    }

    await db('asignaciones').where({ id: asignacion_id }).update({ km_inicial: parseInt(km_inicial) });
    await db('solicitudes').where({ id: asignacion.solicitud_id })
      .update({ estado: 'EN_EJECUCION', updated_at: db.fn.now() });
    await db('historial_solicitudes').insert({
      solicitud_id: asignacion.solicitud_id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'EN_EJECUCION',
      notas: `Iniciado vía WhatsApp. KM inicial: ${km_inicial}`
    });

    res.json({ ok: true, mensaje: `✅ Servicio iniciado. KM inicial registrado: *${km_inicial}*` });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar el servicio.' });
  }
}

async function finalizarServicioWa(req, res) {
  try {
    const { asignacion_id, km_final, telefono } = req.body;
    const conductor = await db('conductores').where({ telefono, activo: true }).first();
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    const asignacion = await db('asignaciones')
      .where({ id: asignacion_id, conductor_id: conductor.id }).first();
    if (!asignacion) return res.json({ ok: false, mensaje: `❌ Servicio #${asignacion_id} no encontrado.` });

    if (parseInt(km_final) <= (asignacion.km_inicial || 0)) {
      return res.json({ ok: false, mensaje: `❌ El KM final (${km_final}) debe ser mayor al KM inicial (${asignacion.km_inicial}).` });
    }

    await db('asignaciones').where({ id: asignacion_id }).update({ km_final: parseInt(km_final) });
    await db('solicitudes').where({ id: asignacion.solicitud_id })
      .update({ estado: 'FINALIZADA', updated_at: db.fn.now() });
    await db('vehiculos').where({ id: asignacion.vehiculo_id })
      .update({ km_actual: parseInt(km_final) });
    await db('historial_solicitudes').insert({
      solicitud_id: asignacion.solicitud_id,
      estado_anterior: 'EN_EJECUCION',
      estado_nuevo: 'FINALIZADA',
      notas: `Finalizado vía WhatsApp. KM final: ${km_final}`
    });

    const solicitudFinal = await db('solicitudes').where({ id: asignacion.solicitud_id }).first();
    if (solicitudFinal?.contacto_telefono) {
      await notificarN8n('fin_servicio', {
        solicitud_id: asignacion.solicitud_id,
        contacto_telefono: solicitudFinal.contacto_telefono,
        contacto_nombre: solicitudFinal.contacto_nombre
      });
    }

    res.json({ ok: true, mensaje: `✅ Servicio finalizado. KM: ${asignacion.km_inicial} → ${km_final}` });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al finalizar el servicio.' });
  }
}

// ─── RECORDATORIOS (llamado por n8n cron) ────────────────────────────────────

async function recordatorios(req, res) {
  try {
    let fechaObjetivo = req.query.fecha;
    if (!fechaObjetivo) {
      // "Mañana" calculado en hora Colombia (UTC-5) para evitar desfase por timezone del servidor
      const ahoraBogota = new Date(Date.now() - 5 * 60 * 60 * 1000);
      ahoraBogota.setUTCDate(ahoraBogota.getUTCDate() + 1);
      fechaObjetivo = ahoraBogota.toISOString().substring(0, 10);
    }

    const servicios = await db('asignaciones')
      .where('asignaciones.fecha', fechaObjetivo)
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('conductores', 'asignaciones.conductor_id', 'conductores.id')
      .whereIn('solicitudes.estado', ['PROGRAMADA', 'CONFIRMADA'])
      .select(
        'solicitudes.id as solicitud_id',
        'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.contacto_nombre', 'solicitudes.contacto_telefono',
        'solicitudes.nombre_solicitante', 'solicitudes.telefono_solicitante',
        'asignaciones.hora_inicio',
        'conductores.nombre as conductor_nombre', 'conductores.telefono as conductor_telefono'
      );

    const mensajes = [];
    for (const s of servicios) {
      const hora = s.hora_inicio?.substring(0, 5);
      const nombreSolic = s.nombre_solicitante || s.contacto_nombre;
      const telSolic = s.telefono_solicitante || s.contacto_telefono;
      if (telSolic) {
        mensajes.push({
          to: `whatsapp:+57${telSolic.replace(/\D/g, '')}`,
          body: `*Recordatorio — Alcaldía de Sopó*\n\nMañana tienes un servicio programado:\n\nServicio: *${s.solicitud_id}*\nSolicitante: *${nombreSolic}*\nTeléfono: *${telSolic}*\nRuta: *${s.origen} → ${s.destino}*\nHora: *${hora}*\nConductor: *${s.conductor_nombre}*`
        });
      }
      if (s.conductor_telefono) {
        mensajes.push({
          to: `whatsapp:+57${s.conductor_telefono.replace(/\D/g, '')}`,
          body: `🔔 *Recordatorio — Alcaldía de Sopó*\n\nMañana tienes un servicio asignado:\n\n📍 *${s.origen} → ${s.destino}*\n⏰ Hora: *${hora}*\n👤 Contacto: ${nombreSolic}\n\nSolicitud #${s.solicitud_id}`
        });
      }
    }

    res.json(mensajes);
  } catch (err) {
    console.error('Error recordatorios:', err);
    res.status(500).json({ error: 'Error al generar recordatorios' });
  }
}

module.exports = {
  contexto, getSesion, setSesion, getDependencias,
  crearSolicitud, misSolicitudes, cancelarSolicitud,
  confirmarServicio, guardarEncuesta,
  serviciosConductorWa, iniciarServicioWa, finalizarServicioWa,
  recordatorios
};
