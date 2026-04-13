const db = require('../config/db');

// ============ VEHÍCULOS ============

async function listarVehiculos(req, res) {
  try {
    const { tipo, estado, activo } = req.query;
    let query = db('vehiculos');
    if (tipo) query = query.where({ tipo });
    if (estado) query = query.where({ estado });
    if (activo !== undefined) query = query.where({ activo: activo === 'true' });
    const vehiculos = await query.orderBy('placa');
    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar vehículos' });
  }
}

async function crearVehiculo(req, res) {
  try {
    const [vehiculo] = await db('vehiculos').insert(req.body).returning('*');
    res.status(201).json(vehiculo);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Placa ya existe' });
    res.status(500).json({ error: 'Error al crear vehículo' });
  }
}

async function actualizarVehiculo(req, res) {
  try {
    const [vehiculo] = await db('vehiculos').where({ id: req.params.id }).update({ ...req.body, updated_at: db.fn.now() }).returning('*');
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehiculo);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
}

async function desactivarVehiculo(req, res) {
  try {
    await db('vehiculos').where({ id: req.params.id }).update({ activo: false, updated_at: db.fn.now() });
    res.json({ message: 'Vehículo desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar' });
  }
}

// ============ CONDUCTORES ============

async function listarConductores(req, res) {
  try {
    const conductores = await db('conductores').where({ activo: true }).orderBy('nombre');
    res.json(conductores);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar conductores' });
  }
}

async function crearConductor(req, res) {
  try {
    const { nombre, telefono, licencia, vencimiento_licencia, estado, usuario_id } = req.body;
    const data = { nombre, telefono, licencia, vencimiento_licencia: vencimiento_licencia || null, estado: estado || 'activo' };
    if (usuario_id) data.usuario_id = usuario_id;
    const [conductor] = await db('conductores').insert(data).returning('*');
    res.status(201).json(conductor);
  } catch (err) {
    console.error('Error al crear conductor:', err);
    res.status(500).json({ error: 'Error al crear conductor' });
  }
}

async function actualizarConductor(req, res) {
  try {
    const [conductor] = await db('conductores').where({ id: req.params.id }).update({ ...req.body, updated_at: db.fn.now() }).returning('*');
    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' });
    res.json(conductor);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar conductor' });
  }
}

async function desactivarConductor(req, res) {
  try {
    await db('conductores').where({ id: req.params.id }).update({ activo: false, updated_at: db.fn.now() });
    res.json({ message: 'Conductor desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar' });
  }
}

// ============ DOCUMENTOS ============

async function listarDocumentos(req, res) {
  try {
    const { vehiculo_id, tipo, estado, por_vencer } = req.query;
    let query = db('documentos')
      .join('vehiculos', 'documentos.vehiculo_id', 'vehiculos.id')
      .select('documentos.*', 'vehiculos.placa', 'vehiculos.marca', 'vehiculos.modelo');
    if (vehiculo_id) query = query.where('documentos.vehiculo_id', vehiculo_id);
    if (tipo) query = query.where('documentos.tipo', tipo);
    if (estado) query = query.where('documentos.estado', estado);
    // Filtro dinámico: mismos criterios que el contador del dashboard
    if (por_vencer === '1' || por_vencer === 'true') {
      query = query
        .where('documentos.fecha_vencimiento', '<=', db.raw("CURRENT_DATE + INTERVAL '30 days'"))
        .where('documentos.estado', '!=', 'vencido');
    }
    const docs = await query.orderBy('documentos.fecha_vencimiento');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar documentos' });
  }
}

async function crearDocumento(req, res) {
  try {
    const { vehiculo_id, tipo, fecha_expedicion, fecha_vencimiento, estado, soporte_imagen } = req.body;
    const data = { vehiculo_id, tipo, fecha_vencimiento, estado: estado || 'vigente' };
    if (fecha_expedicion) data.fecha_expedicion = fecha_expedicion;
    if (soporte_imagen) data.soporte_imagen = soporte_imagen;
    const [doc] = await db('documentos').insert(data).returning('*');
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear documento' });
  }
}

async function actualizarDocumento(req, res) {
  try {
    const { vehiculo_id, tipo, fecha_expedicion, fecha_vencimiento, estado, soporte_imagen } = req.body;
    const data = { updated_at: db.fn.now() };
    if (vehiculo_id) data.vehiculo_id = vehiculo_id;
    if (tipo) data.tipo = tipo;
    if (fecha_expedicion) data.fecha_expedicion = fecha_expedicion;
    if (fecha_vencimiento) data.fecha_vencimiento = fecha_vencimiento;
    if (estado) data.estado = estado;
    if (soporte_imagen !== undefined) data.soporte_imagen = soporte_imagen;
    const [doc] = await db('documentos').where({ id: req.params.id }).update(data).returning('*');
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
}

// ============ NOVEDADES / MANTENIMIENTO ============

async function listarNovedades(req, res) {
  try {
    const { estado, urgencia } = req.query;
    let query = db('novedades')
      .join('vehiculos', 'novedades.vehiculo_id', 'vehiculos.id')
      .leftJoin('conductores', 'novedades.conductor_id', 'conductores.id')
      .select('novedades.*', 'vehiculos.placa', 'conductores.nombre as conductor_nombre');
    if (estado) query = query.where('novedades.estado', estado);
    if (urgencia) query = query.where('novedades.urgencia', urgencia);
    const novedades = await query.orderBy('novedades.created_at', 'desc');
    res.json(novedades);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar novedades' });
  }
}

async function actualizarNovedad(req, res) {
  try {
    const [novedad] = await db('novedades').where({ id: req.params.id }).update({ ...req.body, updated_at: db.fn.now() }).returning('*');
    res.json(novedad);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar novedad' });
  }
}

async function listarMantenimientos(req, res) {
  try {
    const { vehiculo_id, estado } = req.query;
    let query = db('mantenimientos').join('vehiculos', 'mantenimientos.vehiculo_id', 'vehiculos.id')
      .select('mantenimientos.*', 'vehiculos.placa');
    if (vehiculo_id) query = query.where('mantenimientos.vehiculo_id', vehiculo_id);
    if (estado) query = query.where('mantenimientos.estado', estado);
    const mantenimientos = await query.orderBy('mantenimientos.fecha_reporte', 'desc');
    res.json(mantenimientos);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar mantenimientos' });
  }
}

async function crearMantenimiento(req, res) {
  try {
    const [mant] = await db('mantenimientos').insert(req.body).returning('*');
    // Cambiar estado del vehículo
    if (req.body.vehiculo_id) {
      await db('vehiculos').where({ id: req.body.vehiculo_id }).update({ estado: 'mantenimiento' });
    }
    res.status(201).json(mant);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear mantenimiento' });
  }
}

async function actualizarMantenimiento(req, res) {
  try {
    const [mant] = await db('mantenimientos').where({ id: req.params.id }).update({ ...req.body, updated_at: db.fn.now() }).returning('*');
    // Si completado, liberar vehículo
    if (req.body.estado === 'completado' && mant) {
      await db('vehiculos').where({ id: mant.vehiculo_id }).update({ estado: 'disponible' });
    }
    res.json(mant);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar mantenimiento' });
  }
}

// ============ COMBUSTIBLE ============

async function listarCombustible(req, res) {
  try {
    const { vehiculo_id, fecha_desde, fecha_hasta } = req.query;
    let query = db('combustible')
      .join('vehiculos', 'combustible.vehiculo_id', 'vehiculos.id')
      .leftJoin('conductores', 'combustible.conductor_id', 'conductores.id')
      .select('combustible.*', 'vehiculos.placa', 'conductores.nombre as conductor_nombre');
    if (vehiculo_id) query = query.where('combustible.vehiculo_id', vehiculo_id);
    if (fecha_desde) query = query.where('combustible.fecha', '>=', fecha_desde);
    if (fecha_hasta) query = query.where('combustible.fecha', '<=', fecha_hasta);
    const registros = await query.orderBy('combustible.fecha', 'desc');
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar combustible' });
  }
}

async function actualizarCombustible(req, res) {
  try {
    const { id } = req.params;
    const {
      vehiculo_id, conductor_id, fecha, galones, valor_cop,
      tipo_combustible, no_ticket, valor_galon, km_registro, observaciones
    } = req.body;

    const existente = await db('combustible').where({ id }).first();
    if (!existente) return res.status(404).json({ error: 'Registro no encontrado' });

    const updateData = { updated_at: db.fn.now() };
    if (vehiculo_id !== undefined)      updateData.vehiculo_id = vehiculo_id;
    if (conductor_id !== undefined)     updateData.conductor_id = conductor_id || null;
    if (fecha !== undefined)            updateData.fecha = fecha;
    if (galones !== undefined)          updateData.galones = galones;
    if (valor_cop !== undefined)        updateData.valor_cop = valor_cop;
    if (tipo_combustible !== undefined) updateData.tipo_combustible = tipo_combustible;
    if (no_ticket !== undefined)        updateData.no_ticket = no_ticket || null;
    if (valor_galon !== undefined)      updateData.valor_galon = valor_galon || null;
    if (km_registro !== undefined)      updateData.km_registro = km_registro || null;
    if (observaciones !== undefined)    updateData.observaciones = observaciones || null;

    const [registro] = await db('combustible').where({ id }).update(updateData).returning('*');
    res.json(registro);
  } catch (err) {
    console.error('Error al actualizar combustible (admin):', err);
    res.status(500).json({ error: 'Error al actualizar combustible' });
  }
}

async function crearCombustible(req, res) {
  try {
    const {
      vehiculo_id, conductor_id, fecha, galones, valor_cop,
      tipo_combustible, no_ticket, valor_galon, km_registro, observaciones
    } = req.body;

    if (!vehiculo_id || !fecha || !galones || !valor_cop) {
      return res.status(400).json({ error: 'Campos obligatorios: vehiculo_id, fecha, galones, valor_cop' });
    }

    const insertData = { vehiculo_id, fecha, galones, valor_cop };
    if (conductor_id) insertData.conductor_id = conductor_id;
    if (tipo_combustible) insertData.tipo_combustible = tipo_combustible;
    if (no_ticket) insertData.no_ticket = no_ticket;
    if (valor_galon) insertData.valor_galon = valor_galon;
    if (km_registro) insertData.km_registro = km_registro;
    if (observaciones) insertData.observaciones = observaciones;

    const [registro] = await db('combustible').insert(insertData).returning('*');
    res.status(201).json(registro);
  } catch (err) {
    console.error('Error al registrar combustible (admin):', err);
    res.status(500).json({ error: 'Error al registrar combustible' });
  }
}

// ============ CAMBIOS DE ACEITE ============

// Query SQL reutilizable: une vehiculos con:
//  - km actual (max km_registro de combustible, 0 si nunca ha tanqueado)
//  - último cambio de aceite (fila más reciente de cambios_aceite)
// Retorna columnas calculadas: km_actual, km_ultimo_cambio, km_desde_cambio, alerta
async function listarEstadoAceite(req, res) {
  try {
    const filas = await db('vehiculos')
      .where('vehiculos.activo', true)
      .leftJoin(
        db('combustible').select('vehiculo_id').max('km_registro as km_actual').groupBy('vehiculo_id').as('km'),
        'vehiculos.id', 'km.vehiculo_id'
      )
      .leftJoin(
        // El "último" cambio es el de km más alto (los km siempre suben)
        db('cambios_aceite as ca1')
          .select('ca1.vehiculo_id', 'ca1.km_cambio as km_ultimo_cambio', 'ca1.fecha as fecha_ultimo_cambio')
          .whereRaw('ca1.km_cambio = (SELECT MAX(ca2.km_cambio) FROM cambios_aceite ca2 WHERE ca2.vehiculo_id = ca1.vehiculo_id)')
          .as('ult'),
        'vehiculos.id', 'ult.vehiculo_id'
      )
      .select(
        'vehiculos.id',
        'vehiculos.placa',
        'vehiculos.marca',
        'vehiculos.modelo',
        'vehiculos.km_intervalo_aceite',
        'km.km_actual',
        'ult.km_ultimo_cambio',
        'ult.fecha_ultimo_cambio'
      )
      .orderBy('vehiculos.placa');

    const resultado = filas.map(v => {
      const intervalo = parseInt(v.km_intervalo_aceite) || 5000;
      const kmActual = v.km_actual ? parseFloat(v.km_actual) : 0;
      const kmUltimo = v.km_ultimo_cambio != null ? parseFloat(v.km_ultimo_cambio) : null;
      const kmDesdeCambio = kmUltimo != null ? Math.max(0, kmActual - kmUltimo) : null;
      const progreso = kmDesdeCambio != null ? Math.min(1, kmDesdeCambio / intervalo) : null;

      let alerta = 'sin_datos';
      if (kmDesdeCambio == null) alerta = 'sin_cambio_registrado';
      else if (kmDesdeCambio >= intervalo) alerta = 'vencido';
      else if (kmDesdeCambio >= intervalo * 0.85) alerta = 'proximo';
      else alerta = 'ok';

      return {
        ...v,
        km_intervalo_aceite: intervalo,
        km_actual: kmActual,
        km_ultimo_cambio: kmUltimo,
        km_desde_cambio: kmDesdeCambio,
        km_restantes: kmDesdeCambio != null ? intervalo - kmDesdeCambio : null,
        progreso,
        alerta
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error('Error al listar estado aceite:', err);
    res.status(500).json({ error: 'Error al listar estado aceite' });
  }
}

async function crearCambioAceite(req, res) {
  try {
    const { vehiculo_id, fecha, km_cambio, tipo_aceite, taller, costo, observaciones } = req.body;
    if (!vehiculo_id || !fecha || km_cambio == null) {
      return res.status(400).json({ error: 'Campos obligatorios: vehiculo_id, fecha, km_cambio' });
    }
    const insertData = { vehiculo_id, fecha, km_cambio };
    if (tipo_aceite) insertData.tipo_aceite = tipo_aceite;
    if (taller) insertData.taller = taller;
    if (costo) insertData.costo = costo;
    if (observaciones) insertData.observaciones = observaciones;
    const [registro] = await db('cambios_aceite').insert(insertData).returning('*');
    res.status(201).json(registro);
  } catch (err) {
    console.error('Error al registrar cambio de aceite:', err);
    res.status(500).json({ error: 'Error al registrar cambio de aceite' });
  }
}

async function historialAceiteVehiculo(req, res) {
  try {
    const { id } = req.params;
    const historial = await db('cambios_aceite')
      .where({ vehiculo_id: id })
      .orderBy('km_cambio', 'desc');
    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
}

// ============ CATÁLOGOS ============

async function dependencias(req, res) {
  try {
    const deps = await db('dependencias').where({ activo: true }).orderBy('nombre');
    res.json(deps);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar dependencias' });
  }
}

// ============ HISTORIAL CONDUCTOR ============

async function historialConductor(req, res) {
  try {
    const conductor = await db('conductores').where({ id: req.params.id }).first();
    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' });

    // Servicios completados (historial)
    const completados = await db('asignaciones')
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .where('asignaciones.conductor_id', conductor.id)
      .whereIn('solicitudes.estado', ['FINALIZADA'])
      .select(
        'asignaciones.id as asignacion_id', 'asignaciones.fecha', 'asignaciones.hora_inicio', 'asignaciones.hora_fin',
        'asignaciones.km_inicial', 'asignaciones.km_final',
        'solicitudes.id as solicitud_id', 'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.estado as estado_solicitud', 'solicitudes.tipo_servicio', 'solicitudes.pasajeros',
        'vehiculos.id as vehiculo_id', 'vehiculos.placa', 'vehiculos.marca', 'vehiculos.modelo'
      )
      .orderBy('asignaciones.fecha', 'desc');

    // Servicios pendientes (programados, confirmados, en ejecución)
    const pendientes = await db('asignaciones')
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .where('asignaciones.conductor_id', conductor.id)
      .whereIn('solicitudes.estado', ['PROGRAMADA', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_EJECUCION'])
      .select(
        'asignaciones.id as asignacion_id', 'asignaciones.fecha', 'asignaciones.hora_inicio', 'asignaciones.hora_fin',
        'solicitudes.id as solicitud_id', 'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.estado as estado_solicitud', 'solicitudes.tipo_servicio', 'solicitudes.pasajeros',
        'vehiculos.id as vehiculo_id', 'vehiculos.placa', 'vehiculos.marca', 'vehiculos.modelo'
      )
      .orderBy('asignaciones.fecha', 'asc');

    // Vehículo actual: el del servicio más próximo pendiente o en ejecución
    const vehiculoActual = pendientes.length > 0
      ? { id: pendientes[0].vehiculo_id, placa: pendientes[0].placa, marca: pendientes[0].marca, modelo: pendientes[0].modelo }
      : null;

    res.json({ conductor, completados, pendientes, vehiculo_actual: vehiculoActual });
  } catch (err) {
    console.error('Error historial conductor:', err);
    res.status(500).json({ error: 'Error al obtener historial del conductor' });
  }
}

// ============ HISTORIAL VEHÍCULO ============

async function historialVehiculo(req, res) {
  try {
    const vehiculo = await db('vehiculos').where({ id: req.params.id }).first();
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

    // Servicios completados
    const completados = await db('asignaciones')
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('conductores', 'asignaciones.conductor_id', 'conductores.id')
      .where('asignaciones.vehiculo_id', vehiculo.id)
      .whereIn('solicitudes.estado', ['FINALIZADA'])
      .select(
        'asignaciones.id as asignacion_id', 'asignaciones.fecha', 'asignaciones.hora_inicio', 'asignaciones.hora_fin',
        'asignaciones.km_inicial', 'asignaciones.km_final',
        'solicitudes.id as solicitud_id', 'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.estado as estado_solicitud', 'solicitudes.tipo_servicio', 'solicitudes.pasajeros',
        'conductores.id as conductor_id', 'conductores.nombre as conductor_nombre', 'conductores.telefono as conductor_telefono'
      )
      .orderBy('asignaciones.fecha', 'desc');

    // Servicios pendientes
    const pendientes = await db('asignaciones')
      .join('solicitudes', 'asignaciones.solicitud_id', 'solicitudes.id')
      .join('conductores', 'asignaciones.conductor_id', 'conductores.id')
      .where('asignaciones.vehiculo_id', vehiculo.id)
      .whereIn('solicitudes.estado', ['PROGRAMADA', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_EJECUCION'])
      .select(
        'asignaciones.id as asignacion_id', 'asignaciones.fecha', 'asignaciones.hora_inicio', 'asignaciones.hora_fin',
        'solicitudes.id as solicitud_id', 'solicitudes.origen', 'solicitudes.destino',
        'solicitudes.estado as estado_solicitud', 'solicitudes.tipo_servicio', 'solicitudes.pasajeros',
        'conductores.id as conductor_id', 'conductores.nombre as conductor_nombre', 'conductores.telefono as conductor_telefono'
      )
      .orderBy('asignaciones.fecha', 'asc');

    // Conductor actual: el del servicio más próximo
    const conductorActual = pendientes.length > 0
      ? { id: pendientes[0].conductor_id, nombre: pendientes[0].conductor_nombre, telefono: pendientes[0].conductor_telefono }
      : null;

    res.json({ vehiculo, completados, pendientes, conductor_actual: conductorActual });
  } catch (err) {
    console.error('Error historial vehículo:', err);
    res.status(500).json({ error: 'Error al obtener historial del vehículo' });
  }
}

// ============ CALENDARIO (reservas por rango de fechas) ============

async function calendarioVehiculo(req, res) {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: 'desde y hasta son requeridos' });

    const reservas = await db('calendario_vehiculos')
      .where('calendario_vehiculos.vehiculo_id', id)
      .where('calendario_vehiculos.estado', 'activo')
      .whereBetween('calendario_vehiculos.fecha', [desde, hasta])
      .leftJoin('solicitudes', 'calendario_vehiculos.solicitud_id', 'solicitudes.id')
      .leftJoin('asignaciones', 'asignaciones.solicitud_id', 'solicitudes.id')
      .leftJoin('conductores', 'asignaciones.conductor_id', 'conductores.id')
      .select(
        'calendario_vehiculos.id',
        'calendario_vehiculos.fecha',
        'calendario_vehiculos.hora_inicio',
        'calendario_vehiculos.hora_fin',
        'calendario_vehiculos.tipo_bloqueo',
        'solicitudes.id as solicitud_id',
        'solicitudes.estado',
        'solicitudes.origen',
        'solicitudes.destino',
        'solicitudes.pasajeros',
        'conductores.id as conductor_id',
        'conductores.nombre as conductor_nombre'
      )
      .orderBy(['calendario_vehiculos.fecha', 'calendario_vehiculos.hora_inicio']);

    res.json(reservas);
  } catch (err) {
    console.error('Error calendario vehiculo:', err);
    res.status(500).json({ error: 'Error al obtener calendario del vehículo' });
  }
}

async function calendarioConductor(req, res) {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: 'desde y hasta son requeridos' });

    const reservas = await db('calendario_conductores')
      .where('calendario_conductores.conductor_id', id)
      .where('calendario_conductores.estado', 'activo')
      .whereBetween('calendario_conductores.fecha', [desde, hasta])
      .leftJoin('solicitudes', 'calendario_conductores.solicitud_id', 'solicitudes.id')
      .leftJoin('asignaciones', 'asignaciones.solicitud_id', 'solicitudes.id')
      .leftJoin('vehiculos', 'asignaciones.vehiculo_id', 'vehiculos.id')
      .select(
        'calendario_conductores.id',
        'calendario_conductores.fecha',
        'calendario_conductores.hora_inicio',
        'calendario_conductores.hora_fin',
        'solicitudes.id as solicitud_id',
        'solicitudes.estado',
        'solicitudes.origen',
        'solicitudes.destino',
        'solicitudes.pasajeros',
        'vehiculos.id as vehiculo_id',
        'vehiculos.placa as vehiculo_placa'
      )
      .orderBy(['calendario_conductores.fecha', 'calendario_conductores.hora_inicio']);

    res.json(reservas);
  } catch (err) {
    console.error('Error calendario conductor:', err);
    res.status(500).json({ error: 'Error al obtener calendario del conductor' });
  }
}

module.exports = {
  listarVehiculos, crearVehiculo, actualizarVehiculo, desactivarVehiculo,
  listarConductores, crearConductor, actualizarConductor, desactivarConductor,
  listarDocumentos, crearDocumento, actualizarDocumento,
  listarNovedades, actualizarNovedad,
  listarMantenimientos, crearMantenimiento, actualizarMantenimiento,
  listarCombustible, crearCombustible, actualizarCombustible,
  listarEstadoAceite, crearCambioAceite, historialAceiteVehiculo,
  dependencias,
  historialConductor, historialVehiculo,
  calendarioVehiculo, calendarioConductor
};
