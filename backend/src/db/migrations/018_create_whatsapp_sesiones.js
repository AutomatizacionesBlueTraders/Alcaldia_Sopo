exports.up = function(knex) {
  return knex.schema.createTable('whatsapp_sesiones', (t) => {
    t.increments('id').primary();
    t.string('telefono', 30).unique().notNullable();
    t.string('estado', 50).defaultTo('idle');
    t.jsonb('datos').defaultTo('{}'); // datos parciales de la solicitud en progreso
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('whatsapp_sesiones');
};
