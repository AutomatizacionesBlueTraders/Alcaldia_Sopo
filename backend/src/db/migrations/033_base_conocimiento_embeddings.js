// Agrega columna de embeddings vectoriales a base_conocimiento + índice HNSW para búsqueda
// semántica rápida. Los embeddings se generan con Gemini gemini-embedding-001 (768 dims).
// El FTS existente sigue funcionando para búsqueda léxica; la búsqueda final es híbrida.

exports.up = async function (knex) {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await knex.raw(`
    ALTER TABLE base_conocimiento
    ADD COLUMN IF NOT EXISTS embedding vector(768);
  `);
  // Índice HNSW con operador de distancia coseno (1 - cosine_similarity).
  // HNSW es aproximado pero ~100x más rápido que scan secuencial a partir de ~1k filas.
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS base_conocimiento_embedding_idx
    ON base_conocimiento
    USING hnsw (embedding vector_cosine_ops);
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP INDEX IF EXISTS base_conocimiento_embedding_idx;`);
  await knex.raw(`ALTER TABLE base_conocimiento DROP COLUMN IF EXISTS embedding;`);
};
