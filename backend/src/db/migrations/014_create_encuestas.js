exports.up = function(knex) {
  return knex.schema.createTable('encuestas', (t) => {
    t.increments('id').primary();
    t.integer('solicitud_id').unsigned().notNullable().references('id').inTable('solicitudes');
    t.integer('calificacion').notNullable(); // 1-5
    t.text('comentario');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('encuestas');
};
