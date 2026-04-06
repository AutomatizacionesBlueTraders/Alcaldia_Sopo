const db = require('../config/db');
const { enviarWhatsApp } = require('../utils/twilio');

async function getConductorId(userId) {
  const conductor = await db('conductores').where({ usuario_id: userId, activo: true }).first();
  return conductor?.id;
}

async function misServicios(req, res) {
  try {
    const conductorId = await getConductorId(req.user.id);
    if (!conductorId) return res.status(404).json({ error: 'Conductor no encontrado' });

    const { fecha } = req.query;
    let query = db('asignaciones')
      .where({ 'asignaciones.conductor_id': conductorId })
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .select(
        'asignaciones.*',
        'solicitudes.origen', 'solicitudes.destino', 'solicitudes.estado as estado_solicitud',
        'solicitudes.pasajeros', 'solicitudes.contacto_nombre', 'solicitudes.contacto_telefono',
        'solicitudes.observaciones', 'solicitudes.tipo_servicio',
        'vehiculos.placa', 'vehiculos.marca', 'vehiculos.modelo'
      );

    if (fecha) query = query.where('asignaciones.fecha', fecha);
    const servicios = await query.orderBy('asignaciones.fecha', 'desc').orderBy('asignaciones.hora_inicio');
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar servicios' });
  }
}

async function detalleServicio(req, res) {
  try {
    const conductorId = await getConductorId(req.user.id);
    const servicio = await db('asignaciones')
      .where({ 'asignaciones.id': req.params.id, 'asignaciones.conductor_id': conductorId })
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .select('asignaciones.*', 'solicitudes.*', 'vehiculos.placa', 'vehiculos.marca', 'vehiculos.modelo', 'vehiculos.km_actual')
      .first();

    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(servicio);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
}

async function iniciarServicio(req, res) {
  try {
    const { km_inicial } = req.body;
    if (!km_inicial) return res.status(400).json({ error: 'Kilometraje inicial requerido' });

    const conductorId = await getConductorId(req.user.id);
    const asignacion = await db('asignaciones')
      .where({ id: req.params.id, conductor_id: conductorId }).first();
    if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });

    // Verificar que no haya otro servicio en ejecución
    const enEjecucion = await db('asignaciones')
      .where({ conductor_id: conductorId })
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .where('solicitudes.estado', 'EN_EJECUCION')
      .first();

    if (enEjecucion) return res.status(400).json({ error: 'Ya tienes un servicio en ejecución' });

    const solicitud = await db('solicitudes').where({ id: asignacion.solicitud_id }).first();
    if (!['PROGRAMADA', 'CONFIRMADA'].includes(solicitud.estado)) {
      return res.status(400).json({ error: `No se puede iniciar servicio en estado ${solicitud.estado}` });
    }

    await db('asignaciones').where({ id: asignacion.id }).update({ km_inicial });
    await db('solicitudes').where({ id: asignacion.solicitud_id }).update({ estado: 'EN_EJECUCION', updated_at: db.fn.now() });
    await db('historial_solicitudes').insert({
      solicitud_id: asignacion.solicitud_id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'EN_EJECUCION',
      usuario_id: req.user.id,
      notas: `KM inicial: ${km_inicial}`
    });

    res.json({ message: 'Servicio iniciado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar servicio' });
  }
}

async function finalizarServicio(req, res) {
  try {
    const { km_final } = req.body;
    if (!km_final) return res.status(400).json({ error: 'Kilometraje final requerido' });

    const conductorId = await getConductorId(req.user.id);
    const asignacion = await db('asignaciones')
      .where({ id: req.params.id, conductor_id: conductorId }).first();
    if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });

    if (km_final <= asignacion.km_inicial) {
      return res.status(400).json({ error: 'KM final debe ser mayor al inicial' });
    }

    await db('asignaciones').where({ id: asignacion.id }).update({ km_final });
    await db('solicitudes').where({ id: asignacion.solicitud_id }).update({ estado: 'FINALIZADA', updated_at: db.fn.now() });
    await db('vehiculos').where({ id: asignacion.vehiculo_id }).update({ km_actual: km_final });
    await db('historial_solicitudes').insert({
      solicitud_id: asignacion.solicitud_id,
      estado_anterior: 'EN_EJECUCION',
      estado_nuevo: 'FINALIZADA',
      usuario_id: req.user.id,
      notas: `KM final: ${km_final}`
    });

    // Encuesta WhatsApp al contacto
    const solicitudFinal = await db('solicitudes').where({ id: asignacion.solicitud_id }).first();
    if (solicitudFinal?.contacto_telefono) {
      const tel = `+${solicitudFinal.contacto_telefono.replace(/\D/g, '')}`;
      await enviarWhatsApp(tel,
        `✅ *Servicio finalizado — Alcaldía de Sopó*\n\n` +
        `Tu servicio de transporte (Solicitud #${asignacion.solicitud_id}) ha sido completado.\n\n` +
        `⭐ ¿Cómo calificarías el servicio?\n\nResponde con un número del *1 al 5*:\n` +
        `1 - Muy malo  2 - Malo  3 - Regular  4 - Bueno  5 - Excelente`
      );
      // Marcar sesión para capturar encuesta
      await db('whatsapp_sesiones')
        .insert({
          telefono: solicitudFinal.contacto_telefono.replace(/\D/g, ''),
          estado: 'encuesta',
          datos: JSON.stringify({ solicitud_id: asignacion.solicitud_id }),
          updated_at: db.fn.now()
        })
        .onConflict('telefono')
        .merge({ estado: 'encuesta', datos: JSON.stringify({ solicitud_id: asignacion.solicitud_id }), updated_at: db.fn.now() });
    }

    res.json({ message: 'Servicio finalizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar servicio' });
  }
}

async function miVehiculo(req, res) {
  try {
    const conductorId = await getConductorId(req.user.id);
    // Buscar última asignación para obtener vehículo asignado
    const ultimaAsig = await db('asignaciones')
      .where({ conductor_id: conductorId })
      .orderBy('fecha', 'desc')
      .first();

    if (!ultimaAsig) return res.json(null);
    const vehiculo = await db('vehiculos').where({ id: ultimaAsig.vehiculo_id }).first();
    res.json(vehiculo);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener vehículo' });
  }
}

async function registrarCombustible(req, res) {
  try {
    const { vehiculo_id, fecha, galones, valor_cop, km_registro, ticket_url } = req.body;
    if (!vehiculo_id || !fecha || !galones || !valor_cop) {
      return res.status(400).json({ error: 'Campos obligatorios: vehiculo_id, fecha, galones, valor_cop' });
    }

    const conductorId = await getConductorId(req.user.id);
    const [registro] = await db('combustible').insert({
      vehiculo_id, conductor_id: conductorId, fecha, galones, valor_cop, km_registro, ticket_url
    }).returning('*');

    res.status(201).json(registro);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar combustible' });
  }
}

async function historialCombustible(req, res) {
  try {
    const { vehiculo_id, limit = 30 } = req.query;
    let query = db('combustible');
    if (vehiculo_id) query = query.where({ vehiculo_id });
    const registros = await query.orderBy('fecha', 'desc').limit(limit);
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
}

async function reportarNovedad(req, res) {
  try {
    const { vehiculo_id, tipo, descripcion, urgencia, puede_operar } = req.body;
    if (!vehiculo_id || !tipo || !descripcion) {
      return res.status(400).json({ error: 'Campos obligatorios: vehiculo_id, tipo, descripcion' });
    }

    const conductorId = await getConductorId(req.user.id);
    const [novedad] = await db('novedades').insert({
      vehiculo_id, conductor_id: conductorId, tipo, descripcion,
      urgencia: urgencia || 'media',
      puede_operar: puede_operar || 'si'
    }).returning('*');

    res.status(201).json(novedad);
  } catch (err) {
    res.status(500).json({ error: 'Error al reportar novedad' });
  }
}

async function misNovedades(req, res) {
  try {
    const conductorId = await getConductorId(req.user.id);
    const novedades = await db('novedades')
      .where({ conductor_id: conductorId })
      .orderBy('created_at', 'desc');
    res.json(novedades);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar novedades' });
  }
}

async function dashboardConductor(req, res) {
  try {
    const conductorId = await getConductorId(req.user.id);
    if (!conductorId) return res.status(404).json({ error: 'Conductor no encontrado' });

    const hoy = new Date().toISOString().split('T')[0];
    const serviciosHoy = await db('asignaciones')
      .where({ conductor_id: conductorId, fecha: hoy })
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .select('asignaciones.*', 'solicitudes.origen', 'solicitudes.destino', 'solicitudes.estado as estado_solicitud',
        'vehiculos.placa', 'vehiculos.marca')
      .orderBy('asignaciones.hora_inicio');

    const novedadesPendientes = await db('novedades')
      .where({ conductor_id: conductorId })
      .whereIn('estado', ['pendiente', 'en_revision'])
      .count('* as total').first();

    res.json({
      servicios_hoy: serviciosHoy,
      novedades_pendientes: parseInt(novedadesPendientes?.total || 0)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
}

module.exports = {
  misServicios, detalleServicio, iniciarServicio, finalizarServicio,
  miVehiculo, registrarCombustible, historialCombustible,
  reportarNovedad, misNovedades, dashboardConductor
};
