const db = require('../config/db');

// ============ DEPENDENCIA ============

async function crear(req, res) {
  try {
    const { fecha_servicio, hora_inicio, hora_fin_estimada, origen, destino, pasajeros, tipo_servicio, contacto_nombre, contacto_telefono, observaciones } = req.body;

    if (!fecha_servicio || !hora_inicio || !origen || !destino) {
      return res.status(400).json({ error: 'Campos obligatorios: fecha_servicio, hora_inicio, origen, destino' });
    }

    const [solicitud] = await db('solicitudes').insert({
      dependencia_id: req.user.dependencia_id,
      usuario_id: req.user.id,
      fecha_servicio, hora_inicio, hora_fin_estimada, origen, destino,
      pasajeros: pasajeros || 1,
      tipo_servicio, contacto_nombre, contacto_telefono, observaciones,
      estado: 'ENVIADA',
      canal: 'web'
    }).returning('*');

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: null,
      estado_nuevo: 'ENVIADA',
      usuario_id: req.user.id,
      notas: 'Solicitud creada desde web'
    });

    res.status(201).json(solicitud);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
}

async function listarPorDependencia(req, res) {
  try {
    const { estado, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    let query = db('solicitudes').where({ dependencia_id: req.user.dependencia_id });

    if (estado) query = query.where({ estado });
    if (fecha_desde) query = query.where('fecha_servicio', '>=', fecha_desde);
    if (fecha_hasta) query = query.where('fecha_servicio', '<=', fecha_hasta);

    const offset = (page - 1) * limit;
    const [{ count }] = await query.clone().count();
    const solicitudes = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    res.json({ data: solicitudes, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error al listar solicitudes' });
  }
}

async function detalle(req, res) {
  try {
    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Dependencia solo ve las suyas
    if (req.user.rol === 'dependencia' && solicitud.dependencia_id !== req.user.dependencia_id) {
      return res.status(403).json({ error: 'No tienes acceso a esta solicitud' });
    }

    const historial = await db('historial_solicitudes').where({ solicitud_id: solicitud.id }).orderBy('created_at', 'asc');
    const asignacion = await db('asignaciones').where({ solicitud_id: solicitud.id }).first();

    let vehiculo = null, conductor = null;
    if (asignacion) {
      vehiculo = await db('vehiculos').where({ id: asignacion.vehiculo_id }).first();
      conductor = await db('conductores').where({ id: asignacion.conductor_id }).first();
    }

    res.json({ ...solicitud, historial, asignacion, vehiculo, conductor });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
}

async function cancelar(req, res) {
  try {
    const { motivo } = req.body;
    if (!motivo || motivo.length < 10) {
      return res.status(400).json({ error: 'Motivo obligatorio (mínimo 10 caracteres)' });
    }

    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (req.user.rol === 'dependencia' && solicitud.dependencia_id !== req.user.dependencia_id) {
      return res.status(403).json({ error: 'No tienes acceso a esta solicitud' });
    }

    const permitidos = ['ENVIADA', 'PENDIENTE_PROGRAMACION'];
    if (req.user.rol !== 'admin' && !permitidos.includes(solicitud.estado)) {
      return res.status(400).json({ error: `No se puede cancelar en estado ${solicitud.estado}` });
    }

    await db('solicitudes').where({ id: solicitud.id }).update({ estado: 'CANCELADA', updated_at: db.fn.now() });

    // Liberar recursos si estaba programada
    if (['PROGRAMADA', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA'].includes(solicitud.estado)) {
      await db('calendario_vehiculos').where({ solicitud_id: solicitud.id }).update({ estado: 'cancelado' });
      await db('calendario_conductores').where({ solicitud_id: solicitud.id }).update({ estado: 'cancelado' });
    }

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'CANCELADA',
      usuario_id: req.user.id,
      notas: motivo
    });

    res.json({ message: 'Solicitud cancelada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cancelar' });
  }
}

async function transferir(req, res) {
  try {
    const { dependencia_destino_id, motivo } = req.body;
    if (!dependencia_destino_id || !motivo) {
      return res.status(400).json({ error: 'Dependencia destino y motivo son requeridos' });
    }

    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (req.user.rol === 'dependencia' && solicitud.dependencia_id !== req.user.dependencia_id) {
      return res.status(403).json({ error: 'No tienes acceso' });
    }

    if (!['ENVIADA', 'PENDIENTE_PROGRAMACION'].includes(solicitud.estado)) {
      return res.status(400).json({ error: `No se puede transferir en estado ${solicitud.estado}` });
    }

    await db('transferencias').insert({
      solicitud_id: solicitud.id,
      dependencia_origen_id: solicitud.dependencia_id,
      dependencia_destino_id,
      motivo,
      usuario_id: req.user.id
    });

    await db('solicitudes').where({ id: solicitud.id }).update({
      dependencia_id: dependencia_destino_id,
      estado: 'TRANSFERIDA',
      updated_at: db.fn.now()
    });

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'TRANSFERIDA',
      usuario_id: req.user.id,
      notas: motivo
    });

    res.json({ message: 'Solicitud transferida' });
  } catch (err) {
    res.status(500).json({ error: 'Error al transferir' });
  }
}

// ============ ADMIN ============

async function listarTodas(req, res) {
  try {
    const { estado, dependencia_id, canal, tipo_servicio, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    let query = db('solicitudes')
      .leftJoin('dependencias', 'solicitudes.dependencia_id', 'dependencias.id')
      .select('solicitudes.*', 'dependencias.nombre as dependencia_nombre');

    if (estado) query = query.where('solicitudes.estado', estado);
    if (dependencia_id) query = query.where('solicitudes.dependencia_id', dependencia_id);
    if (canal) query = query.where('solicitudes.canal', canal);
    if (tipo_servicio) query = query.where('solicitudes.tipo_servicio', tipo_servicio);
    if (fecha_desde) query = query.where('solicitudes.fecha_servicio', '>=', fecha_desde);
    if (fecha_hasta) query = query.where('solicitudes.fecha_servicio', '<=', fecha_hasta);

    const offset = (page - 1) * limit;
    const countQuery = db('solicitudes');
    if (estado) countQuery.where({ estado });
    if (dependencia_id) countQuery.where({ dependencia_id });
    const [{ count }] = await countQuery.count();

    const solicitudes = await query.orderBy('solicitudes.created_at', 'desc').limit(limit).offset(offset);
    res.json({ data: solicitudes, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error al listar solicitudes' });
  }
}

async function rechazar(req, res) {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: 'Motivo requerido' });

    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    await db('solicitudes').where({ id: solicitud.id }).update({ estado: 'RECHAZADA', updated_at: db.fn.now() });
    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'RECHAZADA',
      usuario_id: req.user.id,
      notas: motivo
    });

    res.json({ message: 'Solicitud rechazada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al rechazar' });
  }
}

async function dashboardAdmin(req, res) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const estados = await db('solicitudes')
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    const serviciosHoy = await db('solicitudes')
      .where({ fecha_servicio: hoy })
      .whereIn('estado', ['PROGRAMADA', 'CONFIRMADA', 'EN_EJECUCION', 'FINALIZADA'])
      .count('* as total')
      .first();

    const nuevasHoy = await db('solicitudes')
      .where({ estado: 'ENVIADA' })
      .whereRaw('DATE(created_at) = ?', [hoy])
      .count('* as total')
      .first();

    const docsVencer = await db('documentos')
      .where('fecha_vencimiento', '<=', db.raw("CURRENT_DATE + INTERVAL '30 days'"))
      .where('estado', '!=', 'vencido')
      .count('* as total')
      .first();

    res.json({
      estados: estados.reduce((acc, e) => ({ ...acc, [e.estado]: parseInt(e.total) }), {}),
      servicios_hoy: parseInt(serviciosHoy?.total || 0),
      nuevas_hoy: parseInt(nuevasHoy?.total || 0),
      docs_por_vencer: parseInt(docsVencer?.total || 0),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
}

async function dashboardDependencia(req, res) {
  try {
    const estados = await db('solicitudes')
      .where({ dependencia_id: req.user.dependencia_id })
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    const recientes = await db('solicitudes')
      .where({ dependencia_id: req.user.dependencia_id })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({
      estados: estados.reduce((acc, e) => ({ ...acc, [e.estado]: parseInt(e.total) }), {}),
      recientes
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
}

module.exports = {
  crear, listarPorDependencia, detalle, cancelar, transferir,
  listarTodas, rechazar, dashboardAdmin, dashboardDependencia
};
