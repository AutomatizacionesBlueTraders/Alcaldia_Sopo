const db = require('../config/db');
const { notificarN8n } = require('../utils/twilio');

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

    // Notificaciones WhatsApp vía n8n
    const conductor = await db('conductores').where({ id: conductor_id }).first();
    const vehiculo = await db('vehiculos').where({ id: vehiculo_id }).first();
    const dependencia = await db('dependencias').where({ id: solicitud.dependencia_id }).first();

    await notificarN8n('programacion_servicio', {
      action: 'asignacion_servicio',
      solicitud_id: solicitud.id,
      // Solicitante — campos modernos con fallback a legacy
      solicitante_nombre: solicitud.nombre_solicitante || solicitud.contacto_nombre || null,
      solicitante_telefono: solicitud.telefono_solicitante || solicitud.contacto_telefono || null,
      telefono_solicitante: solicitud.telefono_solicitante || solicitud.contacto_telefono || null,
      solicitante_identificacion: solicitud.identificacion_solicitante || null,
      // Dependencia que solicitó el servicio
      dependencia_id: solicitud.dependencia_id,
      dependencia_nombre: dependencia?.nombre || null,
      // Conductor
      conductor_nombre: conductor?.nombre || null,
      conductor_telefono: conductor?.telefono || null,
      // Vehículo
      vehiculo_id: vehiculo?.id || null,
      vehiculo_placa: vehiculo?.placa || null,
      vehiculo_marca: vehiculo?.marca || null,
      vehiculo_modelo: vehiculo?.modelo || null,
      // Horario
      fecha,
      hora_inicio: hora_inicio.substring(0, 5),
      hora_fin: hora_fin.substring(0, 5),
      horario_solicitud: solicitud.horario_solicitud || null,
      // Recorrido
      origen: solicitud.origen,
      destino: solicitud.destino,
      descripcion_recorrido: solicitud.descripcion_recorrido || null,
      pasajeros: solicitud.pasajeros,
      nombre_paciente: solicitud.nombre_paciente || null,
      observaciones: solicitud.observaciones || null
    });

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

    // Detectar si hubo cambio real en hora / vehículo / conductor
    // DATE de Postgres viene como Date con UTC 00:00 — usar toISOString para no cruzar zona horaria
    const fechaAnterior = asignacion.fecha instanceof Date
      ? asignacion.fecha.toISOString().substring(0, 10)
      : String(asignacion.fecha).substring(0, 10);
    const fechaNueva = typeof newFecha === 'string'
      ? newFecha.substring(0, 10)
      : new Date(newFecha).toISOString().substring(0, 10);
    const hubieroCambios =
      parseInt(asignacion.vehiculo_id) !== parseInt(newVeh) ||
      parseInt(asignacion.conductor_id) !== parseInt(newCond) ||
      fechaAnterior !== fechaNueva ||
      String(asignacion.hora_inicio).substring(0, 5) !== String(newInicio).substring(0, 5) ||
      String(asignacion.hora_fin).substring(0, 5) !== String(newFin).substring(0, 5);

    if (hubieroCambios) {
      const conductor = await db('conductores').where({ id: newCond }).first();
      const vehiculo = await db('vehiculos').where({ id: newVeh }).first();
      const dependencia = await db('dependencias').where({ id: solicitud.dependencia_id }).first();

      await notificarN8n('reprogramacion', {
        action: 'reprogramacion',
        solicitud_id: solicitud.id,
        // Solicitante
        solicitante_nombre: solicitud.nombre_solicitante || solicitud.contacto_nombre || null,
        solicitante_telefono: solicitud.telefono_solicitante || solicitud.contacto_telefono || null,
        telefono_solicitante: solicitud.telefono_solicitante || solicitud.contacto_telefono || null,
        solicitante_identificacion: solicitud.identificacion_solicitante || null,
        // Dependencia
        dependencia_id: solicitud.dependencia_id,
        dependencia_nombre: dependencia?.nombre || null,
        // Conductor (nuevo)
        conductor_nombre: conductor?.nombre || null,
        conductor_telefono: conductor?.telefono || null,
        // Vehículo (nuevo)
        vehiculo_id: vehiculo?.id || null,
        vehiculo_placa: vehiculo?.placa || null,
        vehiculo_marca: vehiculo?.marca || null,
        vehiculo_modelo: vehiculo?.modelo || null,
        // Horario (nuevo)
        fecha: fechaNueva,
        hora_inicio: String(newInicio).substring(0, 5),
        hora_fin: String(newFin).substring(0, 5),
        horario_solicitud: solicitud.horario_solicitud || null,
        // Horario anterior (para que el mensaje pueda referenciar qué cambió)
        fecha_anterior: fechaAnterior,
        hora_inicio_anterior: String(asignacion.hora_inicio).substring(0, 5),
        hora_fin_anterior: String(asignacion.hora_fin).substring(0, 5),
        // Recorrido
        origen: solicitud.origen,
        destino: solicitud.destino,
        descripcion_recorrido: solicitud.descripcion_recorrido || null,
        pasajeros: solicitud.pasajeros,
        nombre_paciente: solicitud.nombre_paciente || null,
        observaciones: solicitud.observaciones || null
      });
    }

    res.json({ message: 'Reprogramado', notificado: hubieroCambios });
  } catch (err) {
    console.error('Error al reprogramar:', err);
    res.status(500).json({ error: 'Error al reprogramar', detail: err.message });
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
