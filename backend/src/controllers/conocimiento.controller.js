const db = require('../config/db');

// ─── CRUD (para dependencias autenticadas) ──────────────────────────────────

async function listar(req, res) {
  try {
    const items = await db('base_conocimiento')
      .where({ dependencia_id: req.user.dependencia_id, activo: true })
      .orderBy('created_at', 'desc');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar información' });
  }
}

async function crear(req, res) {
  try {
    const { titulo, contenido, categoria } = req.body;
    if (!titulo || !contenido) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }

    const [item] = await db('base_conocimiento').insert({
      dependencia_id: req.user.dependencia_id,
      usuario_id: req.user.id,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      categoria: categoria?.trim() || null
    }).returning('*');

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear entrada' });
  }
}

async function actualizar(req, res) {
  try {
    const { titulo, contenido, categoria } = req.body;
    const item = await db('base_conocimiento')
      .where({ id: req.params.id, dependencia_id: req.user.dependencia_id })
      .first();

    if (!item) return res.status(404).json({ error: 'Entrada no encontrada' });

    const [updated] = await db('base_conocimiento')
      .where({ id: req.params.id })
      .update({
        titulo: titulo?.trim() || item.titulo,
        contenido: contenido?.trim() || item.contenido,
        categoria: categoria !== undefined ? (categoria?.trim() || null) : item.categoria,
        updated_at: db.fn.now()
      })
      .returning('*');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
}

async function eliminar(req, res) {
  try {
    const deleted = await db('base_conocimiento')
      .where({ id: req.params.id, dependencia_id: req.user.dependencia_id })
      .update({ activo: false, updated_at: db.fn.now() });

    if (!deleted) return res.status(404).json({ error: 'Entrada no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
}

// ─── BÚSQUEDA (para n8n, sin auth) ─────────────────────────────────────────

async function buscar(req, res) {
  try {
    const { q, dependencia_id } = req.query;
    if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });

    let query = db('base_conocimiento')
      .join('dependencias', 'base_conocimiento.dependencia_id', 'dependencias.id')
      .where('base_conocimiento.activo', true)
      .where(function() {
        this.whereILike('base_conocimiento.titulo', `%${q}%`)
            .orWhereILike('base_conocimiento.contenido', `%${q}%`)
            .orWhereILike('base_conocimiento.categoria', `%${q}%`);
      })
      .select(
        'base_conocimiento.id',
        'base_conocimiento.titulo',
        'base_conocimiento.contenido',
        'base_conocimiento.categoria',
        'dependencias.nombre as dependencia'
      )
      .orderBy('base_conocimiento.updated_at', 'desc')
      .limit(10);

    if (dependencia_id) {
      query = query.where('base_conocimiento.dependencia_id', dependencia_id);
    }

    const resultados = await query;
    res.json(resultados);
  } catch (err) {
    console.error('Error búsqueda conocimiento:', err);
    res.status(500).json({ error: 'Error al buscar' });
  }
}

module.exports = { listar, crear, actualizar, eliminar, buscar };
