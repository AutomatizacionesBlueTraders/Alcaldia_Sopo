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
    const { vehiculo_id, tipo, estado } = req.query;
    let query = db('documentos').join('vehiculos', 'documentos.vehiculo_id', 'vehiculos.id')
      .select('documentos.*', 'vehiculos.placa');
    if (vehiculo_id) query = query.where('documentos.vehiculo_id', vehiculo_id);
    if (tipo) query = query.where('documentos.tipo', tipo);
    if (estado) query = query.where('documentos.estado', estado);
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

module.exports = {
  listarVehiculos, crearVehiculo, actualizarVehiculo, desactivarVehiculo,
  listarConductores, crearConductor, actualizarConductor, desactivarConductor,
  listarDocumentos, crearDocumento, actualizarDocumento,
  listarNovedades, actualizarNovedad,
  listarMantenimientos, crearMantenimiento, actualizarMantenimiento,
  listarCombustible, dependencias,
  historialConductor, historialVehiculo
};
