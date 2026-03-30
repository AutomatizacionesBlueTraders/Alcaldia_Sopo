exports.up = function(knex) {
  return knex.schema.createTable('historial_solicitudes', (t) => {
    t.increments('id').primary();
    t.integer('solicitud_id').unsigned().notNullable().references('id').inTable('solicitudes');
    t.string('estado_anterior', 50);
    t.string('estado_nuevo', 50).notNullable();
    t.integer('usuario_id').unsigned().references('id').inTable('usuarios');
    t.text('notas');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('historial_solicitudes');
};
