const db = require('../config/db');

// ============ DEPENDENCIA ============

async function crear(req, res) {
  try {
    const {
      descripcion_recorrido, origen, destino, pasajeros,
      horario_solicitud, nombre_solicitante, telefono_solicitante,
      identificacion_solicitante, nombre_paciente, fecha_servicio,
      contacto_nombre, contacto_telefono, observaciones,
      dependencia_id: body_dependencia_id,
      dependencia_nombre: body_dependencia_nombre
    } = req.body;

    const horario = (horario_solicitud || '').trim();

    if (!origen || !destino || !horario) {
      return res.status(400).json({ error: 'Campos obligatorios: origen, destino, horario_solicitud' });
    }

    // Resolver dependencia_id: por ID directo, por nombre, o del usuario autenticado
    let dependencia_id = body_dependencia_id || req.user?.dependencia_id;
    if (!dependencia_id && body_dependencia_nombre) {
      const nombreLimpio = body_dependencia_nombre.trim().toLowerCase();
      const dep = await db('dependencias')
        .whereRaw('LOWER(TRIM(nombre)) LIKE ?', [`%${nombreLimpio}%`])
        .first();
      if (dep) dependencia_id = dep.id;
    }

    if (!dependencia_id) {
      return res.status(400).json({ error: 'No se pudo identificar la dependencia' });
    }

    const insertData = {
      dependencia_id,
      usuario_id: req.user?.id || null,
      fecha_servicio: fecha_servicio || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),
      horario_solicitud: horario,
      origen: String(origen).trim(),
      destino: String(destino).trim(),
      pasajeros: parseInt(pasajeros) || 1,
      estado: 'RECIBIDA',
      canal: req.body.canal || 'web'
    };

    if (descripcion_recorrido) insertData.descripcion_recorrido = String(descripcion_recorrido).trim();
    if (nombre_solicitante || contacto_nombre) insertData.nombre_solicitante = String(nombre_solicitante || contacto_nombre).trim();
    if (telefono_solicitante || contacto_telefono) insertData.telefono_solicitante = String(telefono_solicitante || contacto_telefono).trim();
    if (nombre_solicitante || contacto_nombre) insertData.contacto_nombre = String(contacto_nombre || nombre_solicitante).trim();
    if (telefono_solicitante || contacto_telefono) insertData.contacto_telefono = String(contacto_telefono || telefono_solicitante).trim();
    if (identificacion_solicitante) insertData.identificacion_solicitante = String(identificacion_solicitante).trim();
    if (nombre_paciente) insertData.nombre_paciente = String(nombre_paciente).trim();
    if (observaciones) insertData.observaciones = observaciones;

    const [solicitud] = await db('solicitudes').insert(insertData).returning('*');

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: null,
      estado_nuevo: 'RECIBIDA',
      usuario_id: req.user?.id || null,
      notas: req.body.canal === 'whatsapp' ? 'Solicitud creada vía WhatsApp' : 'Solicitud creada desde web'
    });

    res.status(201).json(solicitud);
  } catch (err) {
    console.error('Error al crear solicitud:', err);
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

    const permitidos = ['RECIBIDA', 'PENDIENTE_PROGRAMACION'];
    if (req.user.rol !== 'admin' && !permitidos.includes(solicitud.estado)) {
      return res.status(400).json({ error: `No se puede cancelar en estado ${solicitud.estado}` });
    }

    await db('solicitudes').where({ id: solicitud.id }).update({
      estado: 'CANCELADA',
      motivo_cancelacion: motivo,
      cancelacion_revisada: false,
      updated_at: db.fn.now()
    });

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

    if (!['RECIBIDA', 'PENDIENTE_PROGRAMACION'].includes(solicitud.estado)) {
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
      estado: 'RECIBIDA',
      updated_at: db.fn.now()
    });

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'RECIBIDA',
      usuario_id: req.user.id,
      notas: `Transferida a otra dependencia: ${motivo}`
    });

    res.json({ message: 'Solicitud transferida' });
  } catch (err) {
    res.status(500).json({ error: 'Error al transferir' });
  }
}

async function aprobar(req, res) {
  try {
    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (req.user.rol === 'dependencia' && solicitud.dependencia_id !== req.user.dependencia_id) {
      return res.status(403).json({ error: 'No tienes acceso a esta solicitud' });
    }

    if (solicitud.estado !== 'RECIBIDA') {
      return res.status(400).json({ error: `Solo se pueden aprobar solicitudes en estado RECIBIDA (actual: ${solicitud.estado})` });
    }

    await db('solicitudes').where({ id: solicitud.id }).update({ estado: 'PENDIENTE_PROGRAMACION', updated_at: db.fn.now() });
    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: 'RECIBIDA',
      estado_nuevo: 'PENDIENTE_PROGRAMACION',
      usuario_id: req.user.id,
      notas: 'Aprobada por dependencia — enviada al administrador para programacion'
    });

    res.json({ message: 'Solicitud aprobada y enviada al administrador' });
  } catch (err) {
    console.error('Error al aprobar solicitud:', err);
    res.status(500).json({ error: 'Error al aprobar solicitud' });
  }
}

// ============ ADMIN ============

async function listarTodas(req, res) {
  try {
    const { estado, dependencia_id, canal, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    let query = db('solicitudes')
      .leftJoin('dependencias', 'solicitudes.dependencia_id', 'dependencias.id')
      .select('solicitudes.*', 'dependencias.nombre as dependencia_nombre');

    // Admin no ve solicitudes en estado RECIBIDA (aun no aprobadas por dependencia)
    if (estado) {
      query = query.where('solicitudes.estado', estado);
    } else {
      query = query.whereNotIn('solicitudes.estado', ['RECIBIDA']);
    }
    if (dependencia_id) query = query.where('solicitudes.dependencia_id', dependencia_id);
    if (canal) query = query.where('solicitudes.canal', canal);
    if (fecha_desde) query = query.where('solicitudes.fecha_servicio', '>=', fecha_desde);
    if (fecha_hasta) query = query.where('solicitudes.fecha_servicio', '<=', fecha_hasta);

    const offset = (page - 1) * limit;
    const countQuery = db('solicitudes');
    if (estado) {
      countQuery.where({ estado });
    } else {
      countQuery.whereNotIn('estado', ['RECIBIDA']);
    }
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

async function marcarCancelacionRevisada(req, res) {
  try {
    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'CANCELADA') {
      return res.status(400).json({ error: 'Solo se pueden revisar solicitudes canceladas' });
    }
    await db('solicitudes').where({ id: solicitud.id }).update({
      cancelacion_revisada: true,
      updated_at: db.fn.now()
    });
    res.json({ message: 'Cancelación marcada como revisada' });
  } catch (err) {
    console.error('Error al marcar cancelación revisada:', err);
    res.status(500).json({ error: 'Error al marcar cancelación' });
  }
}

async function reabrir(req, res) {
  try {
    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (!['CANCELADA', 'RECHAZADA'].includes(solicitud.estado)) {
      return res.status(400).json({ error: `Solo se puede reabrir una solicitud cancelada o rechazada (actual: ${solicitud.estado})` });
    }

    await db('solicitudes').where({ id: solicitud.id }).update({
      estado: 'PENDIENTE_PROGRAMACION',
      motivo_cancelacion: null,
      cancelacion_revisada: true,
      updated_at: db.fn.now()
    });

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'PENDIENTE_PROGRAMACION',
      usuario_id: req.user.id,
      notas: req.body?.motivo || 'Solicitud reabierta por administrador'
    });

    res.json({ message: 'Solicitud reabierta' });
  } catch (err) {
    console.error('Error al reabrir solicitud:', err);
    res.status(500).json({ error: 'Error al reabrir solicitud' });
  }
}

async function dashboardAdmin(req, res) {
  try {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const estados = await db('solicitudes')
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    const serviciosHoy = await db('asignaciones')
      .where({ 'asignaciones.fecha': hoy })
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .whereIn('solicitudes.estado', ['PROGRAMADA', 'CONFIRMADA', 'EN_EJECUCION', 'FINALIZADA'])
      .count('* as total')
      .first();

    const nuevasHoy = await db('solicitudes')
      .where({ estado: 'PENDIENTE_PROGRAMACION' })
      .whereRaw('DATE(created_at) = ?', [hoy])
      .count('* as total')
      .first();

    const docsVencer = await db('documentos')
      .where('fecha_vencimiento', '<=', db.raw("CURRENT_DATE + INTERVAL '30 days'"))
      .where('estado', '!=', 'vencido')
      .count('* as total')
      .first();

    // Aceite: vehículos donde (km_actual - km_ultimo_cambio) >= km_intervalo * 0.85
    // (incluye los que ya pasaron el intervalo = vencidos)
    const aceiteAlerta = await db.raw(`
      SELECT COUNT(*) AS total FROM (
        SELECT v.id,
          COALESCE(v.km_intervalo_aceite, 5000) AS intervalo,
          COALESCE((SELECT MAX(km_registro) FROM combustible WHERE vehiculo_id = v.id), 0) AS km_actual,
          (SELECT MAX(km_cambio) FROM cambios_aceite WHERE vehiculo_id = v.id) AS km_ultimo
        FROM vehiculos v
        WHERE v.activo = true
      ) x
      WHERE x.km_ultimo IS NOT NULL
        AND (x.km_actual - x.km_ultimo) >= (x.intervalo * 0.85)
    `);
    const aceiteAlertaTotal = parseInt(aceiteAlerta.rows?.[0]?.total || 0);

    // Resumen del mes actual
    const inicioMes = hoy.substring(0, 7) + '-01';
    const solicitudesMes = await db('solicitudes')
      .where('created_at', '>=', inicioMes)
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    const combustibleMes = await db('combustible')
      .where('fecha', '>=', inicioMes)
      .select(
        db.raw('COALESCE(SUM(galones), 0) as total_galones'),
        db.raw('COALESCE(SUM(valor_cop), 0) as total_valor'),
        db.raw('COUNT(*) as total_tanqueos')
      )
      .first();

    // Cancelaciones pendientes de revisión (desde WhatsApp o desde el panel)
    const cancelacionesRecientes = await db('solicitudes')
      .leftJoin('dependencias', 'solicitudes.dependencia_id', 'dependencias.id')
      .where('solicitudes.estado', 'CANCELADA')
      .where('solicitudes.cancelacion_revisada', false)
      .select(
        'solicitudes.id',
        'solicitudes.origen',
        'solicitudes.destino',
        'solicitudes.motivo_cancelacion',
        'solicitudes.updated_at',
        'solicitudes.canal',
        'solicitudes.nombre_solicitante',
        'solicitudes.telefono_solicitante',
        'solicitudes.fecha_servicio',
        'solicitudes.horario_solicitud',
        'solicitudes.pasajeros',
        'dependencias.nombre as dependencia_nombre'
      )
      .orderBy('solicitudes.updated_at', 'desc');

    res.json({
      estados: estados.reduce((acc, e) => ({ ...acc, [e.estado]: parseInt(e.total) }), {}),
      servicios_hoy: parseInt(serviciosHoy?.total || 0),
      nuevas_hoy: parseInt(nuevasHoy?.total || 0),
      docs_por_vencer: parseInt(docsVencer?.total || 0),
      aceite_alerta: aceiteAlertaTotal,
      canceladas_24h: cancelacionesRecientes,
      mes: {
        solicitudes: solicitudesMes.reduce((acc, e) => ({ ...acc, [e.estado]: parseInt(e.total) }), {}),
        solicitudes_total: solicitudesMes.reduce((s, e) => s + parseInt(e.total), 0),
        combustible_galones: parseFloat(combustibleMes?.total_galones || 0),
        combustible_valor: parseFloat(combustibleMes?.total_valor || 0),
        combustible_tanqueos: parseInt(combustibleMes?.total_tanqueos || 0),
      }
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

    // Resumen del mes actual
    const inicioMes = new Date().toISOString().substring(0, 7) + '-01';
    const solicitudesMes = await db('solicitudes')
      .where({ dependencia_id: req.user.dependencia_id })
      .where('created_at', '>=', inicioMes)
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    res.json({
      estados: estados.reduce((acc, e) => ({ ...acc, [e.estado]: parseInt(e.total) }), {}),
      recientes,
      mes: {
        solicitudes: solicitudesMes.reduce((acc, e) => ({ ...acc, [e.estado]: parseInt(e.total) }), {}),
        solicitudes_total: solicitudesMes.reduce((s, e) => s + parseInt(e.total), 0),
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
}

async function detallePorApiKey(req, res) {
  try {
    const solicitud = await db('solicitudes')
      .leftJoin('dependencias', 'solicitudes.dependencia_id', 'dependencias.id')
      .select('solicitudes.*', 'dependencias.nombre as dependencia_nombre')
      .where('solicitudes.id', req.params.id)
      .first();

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const asignacion = await db('asignaciones').where({ solicitud_id: solicitud.id }).first();

    let vehiculo = null, conductor = null;
    if (asignacion) {
      vehiculo = await db('vehiculos').where({ id: asignacion.vehiculo_id }).first();
      conductor = await db('conductores').where({ id: asignacion.conductor_id }).first();
    }

    // Helpers de formato
    const ymd = (d) => {
      if (!d) return null;
      if (d instanceof Date) return d.toISOString().substring(0, 10);
      return String(d).substring(0, 10);
    };
    const hhmm = (h) => h ? String(h).substring(0, 5) : null;

    // Shape plano y consistente con el payload del webhook de programación
    const payload = {
      solicitud_id: solicitud.id,
      estado: solicitud.estado,
      // Solicitante
      solicitante_nombre: solicitud.nombre_solicitante || solicitud.contacto_nombre || null,
      solicitante_telefono: solicitud.telefono_solicitante || solicitud.contacto_telefono || null,
      telefono_solicitante: solicitud.telefono_solicitante || solicitud.contacto_telefono || null,
      solicitante_identificacion: solicitud.identificacion_solicitante || null,
      // Dependencia
      dependencia_id: solicitud.dependencia_id,
      dependencia_nombre: solicitud.dependencia_nombre || null,
      // Recorrido
      origen: solicitud.origen,
      destino: solicitud.destino,
      descripcion_recorrido: solicitud.descripcion_recorrido || null,
      pasajeros: solicitud.pasajeros,
      nombre_paciente: solicitud.nombre_paciente || null,
      observaciones: solicitud.observaciones || null,
      motivo_cancelacion: solicitud.motivo_cancelacion || null,
      // Horario
      horario_solicitud: solicitud.horario_solicitud || null,
      fecha_servicio_original: ymd(solicitud.fecha_servicio),
      // Asignación "efectiva" (si ya fue programada): valores actuales
      fecha: asignacion ? ymd(asignacion.fecha) : ymd(solicitud.fecha_servicio),
      hora_inicio: asignacion ? hhmm(asignacion.hora_inicio) : null,
      hora_fin: asignacion ? hhmm(asignacion.hora_fin) : null,
      // Conductor (si ya fue asignado)
      conductor_id: conductor?.id || null,
      conductor_nombre: conductor?.nombre || null,
      conductor_telefono: conductor?.telefono || null,
      // Vehículo (si ya fue asignado)
      vehiculo_id: vehiculo?.id || null,
      vehiculo_placa: vehiculo?.placa || null,
      vehiculo_marca: vehiculo?.marca || null,
      vehiculo_modelo: vehiculo?.modelo || null,
      // KMs del servicio (solo si ya terminó)
      km_inicial: asignacion?.km_inicial || null,
      km_final: asignacion?.km_final || null,
      // Timestamps
      created_at: solicitud.created_at,
      updated_at: solicitud.updated_at
    };

    res.json(payload);
  } catch (err) {
    console.error('Error al obtener solicitud por API Key:', err);
    res.status(500).json({ error: 'Error al obtener solicitud' });
  }
}

async function cancelarPorApiKey(req, res) {
  try {
    const { solicitud_id, identificacion, motivo } = req.body;

    if (!solicitud_id || !identificacion || !motivo) {
      return res.status(400).json({ error: 'Campos obligatorios: solicitud_id, identificacion, motivo' });
    }

    const solicitud = await db('solicitudes').where({ id: solicitud_id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const idSol = (solicitud.identificacion_solicitante || '').trim();
    if (!idSol || idSol !== String(identificacion).trim()) {
      return res.status(403).json({ error: 'La identificacion no coincide con la solicitud. No se puede realizar la cancelacion.' });
    }

    // Idempotente: si ya está cancelada y la identificación coincide, respondemos OK
    // sin volver a escribir. Evita errores en reintentos del bot.
    if (solicitud.estado === 'CANCELADA') {
      return res.json({
        ok: true,
        mensaje: `Solicitud #${solicitud.id} ya estaba cancelada`,
        motivo: solicitud.motivo_cancelacion || motivo,
        ya_cancelada: true
      });
    }

    if (['RECHAZADA', 'FINALIZADA', 'EN_EJECUCION'].includes(solicitud.estado)) {
      return res.status(400).json({ error: `No se puede cancelar en estado ${solicitud.estado}` });
    }

    await db('solicitudes').where({ id: solicitud.id }).update({
      estado: 'CANCELADA',
      motivo_cancelacion: motivo,
      cancelacion_revisada: false,
      updated_at: db.fn.now()
    });

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'CANCELADA',
      notas: motivo
    });

    if (['PROGRAMADA', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA'].includes(solicitud.estado)) {
      await db('calendario_vehiculos').where({ solicitud_id: solicitud.id }).update({ estado: 'cancelado' });
      await db('calendario_conductores').where({ solicitud_id: solicitud.id }).update({ estado: 'cancelado' });
    }

    res.json({ ok: true, mensaje: `Solicitud #${solicitud.id} cancelada exitosamente`, motivo });
  } catch (err) {
    console.error('Error al cancelar solicitud por API Key:', err);
    res.status(500).json({ error: 'Error al cancelar solicitud' });
  }
}

async function editar(req, res) {
  try {
    const solicitud = await db('solicitudes').where({ id: req.params.id }).first();
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (req.user.rol === 'dependencia' && solicitud.dependencia_id !== req.user.dependencia_id) {
      return res.status(403).json({ error: 'No tienes acceso a esta solicitud' });
    }

    const campos = [
      'fecha_servicio', 'origen', 'destino', 'pasajeros', 'horario_solicitud',
      'descripcion_recorrido', 'nombre_solicitante', 'telefono_solicitante',
      'identificacion_solicitante', 'nombre_paciente', 'observaciones',
      'dependencia_id', 'contacto_nombre', 'contacto_telefono'
    ];

    const updateData = {};
    for (const campo of campos) {
      if (req.body[campo] !== undefined) {
        updateData[campo] = req.body[campo];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
    }

    updateData.updated_at = db.fn.now();

    await db('solicitudes').where({ id: solicitud.id }).update(updateData);

    await db('historial_solicitudes').insert({
      solicitud_id: solicitud.id,
      estado_anterior: solicitud.estado,
      estado_nuevo: solicitud.estado,
      usuario_id: req.user.id,
      notas: 'Datos de solicitud editados'
    });

    const actualizada = await db('solicitudes').where({ id: solicitud.id }).first();
    res.json(actualizada);
  } catch (err) {
    console.error('Error al editar solicitud:', err);
    res.status(500).json({ error: 'Error al editar solicitud' });
  }
}

module.exports = {
  crear, listarPorDependencia, detalle, cancelar, transferir, editar, aprobar,
  listarTodas, rechazar, reabrir, marcarCancelacionRevisada, dashboardAdmin, dashboardDependencia,
  detallePorApiKey, cancelarPorApiKey
};
