const db = require('../config/db');
const { enviarWhatsApp } = require('../utils/twilio');

async function vehiculosDisponibles(req, res) {
  try {
    const { fecha, hora_inicio, hora_fin } = req.query;
    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'fecha, hora_inicio y hora_fin son requeridos' });
    }

    const ocupados = await db('calendario_vehiculos')
      .where({ fecha, estado: 'activo' })
      .where(function() {
        this.where('hora_inicio', '<', hora_fin).andWhere('hora_fin', '>', hora_inicio);
      })
      .pluck('vehiculo_id');

    const vehiculos = await db('vehiculos')
      .where({ activo: true, tipo: 'vehiculo' })
      .whereIn('estado', ['disponible', 'en_servicio'])
      .whereNotIn('id', ocupados.length ? ocupados : [0]);

    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar vehículos disponibles' });
  }
}

async function conductoresDisponibles(req, res) {
  try {
    const { fecha, hora_inicio, hora_fin } = req.query;
    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'fecha, hora_inicio y hora_fin son requeridos' });
    }

    const ocupados = await db('calendario_conductores')
      .where({ fecha, estado: 'activo' })
      .where(function() {
        this.where('hora_inicio', '<', hora_fin).andWhere('hora_fin', '>', hora_inicio);
      })
      .pluck('conductor_id');

    const conductores = await db('conductores')
      .where({ activo: true, estado: 'activo' })
      .whereNotIn('id', ocupados.length ? ocupados : [0]);

    res.json(conductores);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar conductores disponibles' });
  }
}

async function programar(req, res) {
  try {
    const { vehiculo_id, conductor_id, fecha, hora_inicio, hora_fin } = req.body;
    if (!vehiculo_id || !conductor_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Verificar disponibilidad del vehículo
    const conflictoVeh = await db('calendario_vehiculos')
      .where({ vehiculo_id, fecha, estado: 'activo' })
      .where(function() {
        this.where('hora_inicio', '<', hora_fin).andWhere('hora_fin', '>', hora_inicio);
      }).first();

    if (conflictoVeh) return res.status(409).json({ error: 'Vehículo no disponible en ese horario' });

    // Verificar disponibilidad del conductor
    const conflictoCond = await db('calendario_conductores')
      .where({ conductor_id, fecha, estado: 'activo' })
      .where(function() {
        this.where('hora_inicio', '<', hora_fin).andWhere('hora_fin', '>', hora_inicio);
      }).first();

    if (conflictoCond) return res.status(409).json({ error: 'Conductor no disponible en ese horario' });

    // Crear asignación
    const [asignacion] = await db('asignaciones').insert({
      solicitud_id: solicitud.id, vehiculo_id, conductor_id, fecha, hora_inicio, hora_fin
    }).returning('*');

    // Bloquear calendarios
    await db('calendario_vehiculos').insert({
      vehiculo_id, fecha, hora_inicio, hora_fin, solicitud_id: solicitud.id, tipo_bloqueo: 'servicio'
    });
    await db('calendario_conductores').insert({
      conductor_id, fecha, hora_inicio, hora_fin, solicitud_id: solicitud.id
    });

    // Actualizar estado
    await db('solicitudes').where({ id: solicitud.id }).update({ estado: 'PROGRAMADA', updated_at: db.fn.now() });
    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'PROGRAMADA',
      usuario_id: req.user.id,
      notas: `Vehículo: ${vehiculo_id}, Conductor: ${conductor_id}`
    });

    // Notificaciones WhatsApp
    const conductor = await db('conductores').where({ id: conductor_id }).first();
    const fechaStr = fecha;
    const horaStr = `${hora_inicio.substring(0, 5)} - ${hora_fin.substring(0, 5)}`;
    const vehiculo = await db('vehiculos').where({ id: vehiculo_id }).first();

    // Al contacto de la solicitud
    if (solicitud.contacto_telefono) {
      const tel = `+${solicitud.contacto_telefono.replace(/\D/g, '')}`;
      await enviarWhatsApp(tel,
        `✅ *Servicio de transporte programado — Alcaldía de Sopó*\n\n` +
        `Tu solicitud *#${solicitud.id}* ha sido programada:\n\n` +
        `📅 Fecha: *${fechaStr}*\n` +
        `⏰ Horario: *${horaStr}*\n` +
        `📍 ${solicitud.origen} → ${solicitud.destino}\n` +
        `🚗 Vehículo: *${vehiculo?.placa || vehiculo_id}*\n` +
        `👤 Conductor: *${conductor?.nombre || conductor_id}* — ${conductor?.telefono || ''}\n\n` +
        `¿Confirmas el servicio? Responde *SI* o *NO*.`
      );
      // Marcar sesión para capturar confirmación
      await db('whatsapp_sesiones')
        .insert({
          telefono: solicitud.contacto_telefono.replace(/\D/g, ''),
          estado: 'confirmar_servicio',
          datos: JSON.stringify({ solicitud_id: solicitud.id }),
          updated_at: db.fn.now()
        })
        .onConflict('telefono')
        .merge({ estado: 'confirmar_servicio', datos: JSON.stringify({ solicitud_id: solicitud.id }), updated_at: db.fn.now() });
    }

    // Al conductor
    if (conductor?.telefono) {
      const telCond = `+57${conductor.telefono.replace(/\D/g, '')}`;
      await enviarWhatsApp(telCond,
        `🔔 *Nuevo servicio asignado — Alcaldía de Sopó*\n\n` +
        `Tienes un servicio programado:\n\n` +
        `📅 Fecha: *${fechaStr}*\n` +
        `⏰ Horario: *${horaStr}*\n` +
        `📍 *${solicitud.origen} → ${solicitud.destino}*\n` +
        `👥 Pasajeros: ${solicitud.pasajeros}\n` +
        `👤 Contacto: ${solicitud.contacto_nombre} — ${solicitud.contacto_telefono}\n\n` +
        `Solicitud #${solicitud.id}`
      );
    }

    res.status(201).json(asignacion);
  } catch (err) {
    console.error('Error al programar:', err);
    res.status(500).json({ error: 'Error al programar', detail: err.message });
  }
}

async function reprogramar(req, res) {
  try {
    const { vehiculo_id, conductor_id, fecha, hora_inicio, hora_fin } = req.body;
    if (!vehiculo_id || !conductor_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Todos los campos son requeridos para reprogramar' });
    }
    const asignacion = await db('asignaciones').where({ id: req.params.id }).first();
    if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });
    const solicitud = await db('solicitudes').where({ id: asignacion.solicitud_id }).first();

    // Liberar bloqueos anteriores
    await db('calendario_vehiculos').where({ solicitud_id: asignacion.solicitud_id }).update({ estado: 'cancelado' });
    await db('calendario_conductores').where({ solicitud_id: asignacion.solicitud_id }).update({ estado: 'cancelado' });

    const newVeh = vehiculo_id || asignacion.vehiculo_id;
    const newCond = conductor_id || asignacion.conductor_id;
    const newFecha = fecha || asignacion.fecha;
    const newInicio = hora_inicio || asignacion.hora_inicio;
    const newFin = hora_fin || asignacion.hora_fin;

    // Verificar nueva disponibilidad vehículo
    const conflictoVeh = await db('calendario_vehiculos')
      .where({ vehiculo_id: newVeh, fecha: newFecha, estado: 'activo' })
      .where(function() {
        this.where('hora_inicio', '<', newFin).andWhere('hora_fin', '>', newInicio);
      }).first();

    if (conflictoVeh) return res.status(409).json({ error: 'Vehículo no disponible en nuevo horario' });

    // Verificar nueva disponibilidad conductor
    const conflictoCond = await db('calendario_conductores')
      .where({ conductor_id: newCond, fecha: newFecha, estado: 'activo' })
      .where(function() {
        this.where('hora_inicio', '<', newFin).andWhere('hora_fin', '>', newInicio);
      }).first();

    if (conflictoCond) return res.status(409).json({ error: 'Conductor no disponible en nuevo horario' });

    // Actualizar asignación
    await db('asignaciones').where({ id: asignacion.id }).update({
      vehiculo_id: newVeh, conductor_id: newCond, fecha: newFecha, hora_inicio: newInicio, hora_fin: newFin
    });

    // Nuevos bloqueos
    await db('calendario_vehiculos').insert({
      vehiculo_id: newVeh, fecha: newFecha, hora_inicio: newInicio, hora_fin: newFin,
      solicitud_id: asignacion.solicitud_id, tipo_bloqueo: 'servicio'
    });
    await db('calendario_conductores').insert({
      conductor_id: newCond, fecha: newFecha, hora_inicio: newInicio, hora_fin: newFin,
      solicitud_id: asignacion.solicitud_id
    });

    await db('historial_solicitudes').insert({
      solicitud_id: asignacion.solicitud_id,
      estado_anterior: solicitud.estado,
      estado_nuevo: solicitud.estado,
      usuario_id: req.user.id,
      notas: `Reprogramación — Vehículo: ${newVeh}, Conductor: ${newCond}, Fecha: ${newFecha} ${newInicio}-${newFin}`
    });

    res.json({ message: 'Reprogramado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al reprogramar' });
  }
}

async function calendarioDia(req, res) {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: 'Fecha requerida' });

    const servicios = await db('asignaciones')
      .where({ 'asignaciones.fecha': fecha })
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .join('conductores', 'asignaciones.conductor_id', 'conductores.id')
      .select(
        'asignaciones.*',
        'solicitudes.origen', 'solicitudes.destino', 'solicitudes.estado as estado_solicitud', 'solicitudes.pasajeros',
        'vehiculos.placa', 'vehiculos.marca', 'vehiculos.modelo',
        'conductores.nombre as conductor_nombre', 'conductores.telefono as conductor_telefono'
      )
      .orderBy('asignaciones.hora_inicio');

    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
}

module.exports = { vehiculosDisponibles, conductoresDisponibles, programar, reprogramar, calendarioDia };
