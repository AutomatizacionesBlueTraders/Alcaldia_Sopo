// Genera embeddings para todos los artículos de base_conocimiento que aún no tienen
// vector. Se corre una sola vez tras aplicar la migration 033.
//
// Uso (desde container backend):
//   node src/scripts/backfill_embeddings.js

const db = require('../config/db');
const { embedDocumento, toVectorLiteral } = require('../utils/embeddings');

async function main() {
  const pendientes = await db('base_conocimiento')
    .whereNull('embedding')
    .where({ activo: true })
    .select('id', 'titulo', 'contenido', 'categoria')
    .orderBy('id');

  console.log(`[backfill] ${pendientes.length} artículos por vectorizar`);

  let ok = 0, fail = 0;
  for (const row of pendientes) {
    const texto = [row.titulo, row.contenido, row.categoria].filter(Boolean).join('\n\n');
    try {
      const vec = await embedDocumento(texto);
      const literal = toVectorLiteral(vec);
      await db('base_conocimiento')
        .where({ id: row.id })
        .update({ embedding: db.raw('?::vector', [literal]) });
      console.log(`  ✓ #${row.id} "${row.titulo.substring(0, 50)}"`);
      ok++;
    } catch (err) {
      console.error(`  ✗ #${row.id} "${row.titulo.substring(0, 50)}":`, err.message);
      fail++;
    }
    // Pequeña pausa para respetar rate limits del plan gratuito (~60 req/min)
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`[backfill] Terminado. OK=${ok}, FAIL=${fail}`);
  await db.destroy();
}

main().catch(err => {
  console.error('[backfill] Error fatal:', err);
  process.exit(1);
});
