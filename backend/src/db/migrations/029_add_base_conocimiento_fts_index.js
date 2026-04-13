// Índice GIN con full-text search en español para búsqueda tolerante
// (lematización: "vacunación" ≈ "vacunarme" ≈ "vacuna")

exports.up = function (knex) {
  return knex.raw(`
    CREATE INDEX base_conocimiento_fts_idx
    ON base_conocimiento
    USING GIN (
      to_tsvector(
        'spanish',
        coalesce(titulo, '') || ' ' ||
        coalesce(contenido, '') || ' ' ||
        coalesce(categoria, '')
      )
    );
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP INDEX IF EXISTS base_conocimiento_fts_idx;`);
};
