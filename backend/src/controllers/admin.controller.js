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
    const [doc] = await db('documentos').insert(req.body).returning('*');
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear documento' });
  }
}

async function actualizarDocumento(req, res) {
  try {
    const [doc] = await db('documentos').where({ id: req.params.id }).update({ ...req.body, updated_at: db.fn.now() }).returning('*');
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

module.exports = {
  listarVehiculos, crearVehiculo, actualizarVehiculo, desactivarVehiculo,
  listarConductores, crearConductor, actualizarConductor, desactivarConductor,
  listarDocumentos, crearDocumento, actualizarDocumento,
  listarNovedades, actualizarNovedad,
  listarMantenimientos, crearMantenimiento, actualizarMantenimiento,
  listarCombustible, dependencias
};
