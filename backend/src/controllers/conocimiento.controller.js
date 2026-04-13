const db = require('../config/db');
const { embedDocumento, embedConsulta, toVectorLiteral } = require('../utils/embeddings');

// Texto que se embebe = título + contenido + categoría. Así el vector captura
// el significado completo de la entrada, no solo del título.
function textoParaEmbedding(item) {
  return [item.titulo, item.contenido, item.categoria].filter(Boolean).join('\n\n');
}

// Genera embedding sin romper el flujo si falla (ej. cuota de API excedida).
// El artículo queda sin embedding y la búsqueda cae a FTS solo.
async function generarEmbeddingSeguro(item) {
  try {
    const vec = await embedDocumento(textoParaEmbedding(item));
    return toVectorLiteral(vec);
  } catch (err) {
    console.error('[embeddings] Falló al generar embedding:', err.message);
    return null;
  }
}

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

    const insertData = {
      dependencia_id: req.user.dependencia_id,
      usuario_id: req.user.id,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      categoria: categoria?.trim() || null
    };

    if (req.file) {
      insertData.archivo_url = `/uploads/${req.file.filename}`;
      insertData.archivo_nombre = req.file.originalname;
    }

    const embedding = await generarEmbeddingSeguro(insertData);
    if (embedding) insertData.embedding = db.raw('?::vector', [embedding]);

    const [item] = await db('base_conocimiento').insert(insertData).returning('*');
    res.status(201).json(item);
  } catch (err) {
    console.error('Error al crear entrada:', err);
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

    const updateData = {
      titulo: titulo?.trim() || item.titulo,
      contenido: contenido?.trim() || item.contenido,
      categoria: categoria !== undefined ? (categoria?.trim() || null) : item.categoria,
      updated_at: db.fn.now()
    };

    if (req.file) {
      updateData.archivo_url = `/uploads/${req.file.filename}`;
      updateData.archivo_nombre = req.file.originalname;
    }

    // Regenerar embedding si cambió algún campo de texto
    const cambioTexto =
      updateData.titulo !== item.titulo ||
      updateData.contenido !== item.contenido ||
      updateData.categoria !== item.categoria;

    if (cambioTexto) {
      const embedding = await generarEmbeddingSeguro(updateData);
      if (embedding) updateData.embedding = db.raw('?::vector', [embedding]);
    }

    const [updated] = await db('base_conocimiento')
      .where({ id: req.params.id })
      .update(updateData)
      .returning('*');

    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar entrada:', err);
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

async function quitarArchivo(req, res) {
  try {
    const item = await db('base_conocimiento')
      .where({ id: req.params.id, dependencia_id: req.user.dependencia_id })
      .first();

    if (!item) return res.status(404).json({ error: 'Entrada no encontrada' });

    const [updated] = await db('base_conocimiento')
      .where({ id: req.params.id })
      .update({ archivo_url: null, archivo_nombre: null, updated_at: db.fn.now() })
      .returning('*');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al quitar archivo' });
  }
}

// ─── BÚSQUEDA HÍBRIDA (FTS + vectorial) — para n8n, sin auth ────────────────
//
// Combina dos señales:
//   1) FTS léxico con lematización y unaccent (index base_conocimiento_fts_idx)
//   2) Similitud coseno con embedding Gemini (index base_conocimiento_embedding_idx)
//
// La puntuación final es una suma ponderada: SCORE = 0.4 * fts + 0.6 * vec
// La parte vectorial pesa más porque entiende sinónimos y paráfrasis, que es
// lo que se quiere en un chatbot de FAQ. FTS sirve de ancla para coincidencias
// literales (códigos de ley, siglas, números).

async function buscar(req, res) {
  try {
    const { q, dependencia_id } = req.query;
    if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });

    const termino = q.trim();
    if (!termino) return res.json([]);

    // Embed la consulta (task type QUERY para mejor alineación con documentos)
    let consultaVec = null;
    try {
      const arr = await embedConsulta(termino);
      consultaVec = toVectorLiteral(arr);
    } catch (err) {
      console.error('[buscar] No se pudo embebber consulta, caigo a FTS solo:', err.message);
    }

    const tsvectorExpr = `
      to_tsvector(
        'spanish_unaccent',
        coalesce(base_conocimiento.titulo, '') || ' ' ||
        coalesce(base_conocimiento.contenido, '') || ' ' ||
        coalesce(base_conocimiento.categoria, '')
      )
    `;

    if (consultaVec) {
      // Búsqueda híbrida — combina FTS rank + similitud coseno
      const params = [termino, termino, consultaVec];
      let sql = `
        SELECT
          bc.id, bc.titulo, bc.contenido, bc.categoria,
          d.nombre as dependencia,
          ts_rank(${tsvectorExpr.replace(/base_conocimiento/g, 'bc')}, plainto_tsquery('spanish_unaccent', ?)) as fts_rank,
          CASE WHEN bc.embedding IS NOT NULL THEN 1 - (bc.embedding <=> ?::vector) ELSE 0 END as vec_sim,
          (
            0.4 * ts_rank(${tsvectorExpr.replace(/base_conocimiento/g, 'bc')}, plainto_tsquery('spanish_unaccent', ?))
            + 0.6 * CASE WHEN bc.embedding IS NOT NULL THEN 1 - (bc.embedding <=> ?::vector) ELSE 0 END
          ) as score
        FROM base_conocimiento bc
        JOIN dependencias d ON bc.dependencia_id = d.id
        WHERE bc.activo = true
      `;
      const sqlParams = [termino, consultaVec, termino, consultaVec];
      if (dependencia_id) {
        sql += ` AND bc.dependencia_id = ?`;
        sqlParams.push(dependencia_id);
      }
      // Filtro: al menos uno de los dos scores con algo de señal
      sql += `
          AND (
            ${tsvectorExpr.replace(/base_conocimiento/g, 'bc')} @@ plainto_tsquery('spanish_unaccent', ?)
            OR (bc.embedding IS NOT NULL AND 1 - (bc.embedding <=> ?::vector) > 0.45)
          )
        ORDER BY score DESC
        LIMIT 10
      `;
      sqlParams.push(termino, consultaVec);

      const { rows } = await db.raw(sql, sqlParams);
      if (rows.length > 0) return res.json(rows);
    }

    // Fallback: solo FTS (si falló el embed de la consulta, o no hubo match híbrido)
    let query = db('base_conocimiento')
      .join('dependencias', 'base_conocimiento.dependencia_id', 'dependencias.id')
      .where('base_conocimiento.activo', true)
      .whereRaw(`${tsvectorExpr} @@ plainto_tsquery('spanish_unaccent', ?)`, [termino])
      .select(
        'base_conocimiento.id',
        'base_conocimiento.titulo',
        'base_conocimiento.contenido',
        'base_conocimiento.categoria',
        'dependencias.nombre as dependencia',
        db.raw(`ts_rank(${tsvectorExpr}, plainto_tsquery('spanish_unaccent', ?)) as rank`, [termino])
      )
      .orderBy('rank', 'desc')
      .limit(10);

    if (dependencia_id) {
      query = query.where('base_conocimiento.dependencia_id', dependencia_id);
    }

    let resultados = await query;

    // Último fallback: ILIKE por palabras sueltas (siglas, palabras raras)
    if (resultados.length === 0) {
      const palabras = termino.split(/\s+/).filter(p => p.length >= 3);
      if (palabras.length === 0) return res.json([]);

      let fallback = db('base_conocimiento')
        .join('dependencias', 'base_conocimiento.dependencia_id', 'dependencias.id')
        .where('base_conocimiento.activo', true)
        .where(function () {
          for (const palabra of palabras) {
            this.orWhereILike('base_conocimiento.titulo', `%${palabra}%`)
                .orWhereILike('base_conocimiento.contenido', `%${palabra}%`)
                .orWhereILike('base_conocimiento.categoria', `%${palabra}%`);
          }
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
        fallback = fallback.where('base_conocimiento.dependencia_id', dependencia_id);
      }

      resultados = await fallback;
    }

    res.json(resultados);
  } catch (err) {
    console.error('Error búsqueda conocimiento:', err);
    res.status(500).json({ error: 'Error al buscar' });
  }
}

module.exports = { listar, crear, actualizar, eliminar, quitarArchivo, buscar };
