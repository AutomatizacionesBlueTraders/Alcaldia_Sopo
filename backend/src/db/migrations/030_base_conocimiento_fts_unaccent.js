// Búsqueda insensible a acentos: extensión unaccent + config custom
// "vacunacion" (sin tilde) debe matchear "vacunación"

exports.up = async function (knex) {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS unaccent;`);

  // Config custom que aplica unaccent antes del stemmer español
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'spanish_unaccent') THEN
        CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
        ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
          ALTER MAPPING FOR hword, hword_part, word
          WITH unaccent, spanish_stem;
      END IF;
    END
    $$;
  `);

  // Recrear índice con la config nueva
  await knex.raw(`DROP INDEX IF EXISTS base_conocimiento_fts_idx;`);
  await knex.raw(`
    CREATE INDEX base_conocimiento_fts_idx
    ON base_conocimiento
    USING GIN (
      to_tsvector(
        'spanish_unaccent',
        coalesce(titulo, '') || ' ' ||
        coalesce(contenido, '') || ' ' ||
        coalesce(categoria, '')
      )
    );
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP INDEX IF EXISTS base_conocimiento_fts_idx;`);
  await knex.raw(`
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
  await knex.raw(`DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent;`);
};
