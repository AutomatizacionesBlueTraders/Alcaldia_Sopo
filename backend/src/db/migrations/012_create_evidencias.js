exports.up = function(knex) {
  return knex.schema.createTable('evidencias', (t) => {
    t.increments('id').primary();
    t.string('entidad_tipo', 50).notNullable(); // novedad, combustible, tecnomecanica
    t.integer('entidad_id').unsigned().notNullable();
    t.string('url', 500).notNullable();
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('evidencias');
};
