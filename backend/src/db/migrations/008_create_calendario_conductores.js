exports.up = function(knex) {
  return knex.schema.createTable('calendario_conductores', (t) => {
    t.increments('id').primary();
    t.integer('conductor_id').unsigned().notNullable().references('id').inTable('conductores');
    t.date('fecha').notNullable();
    t.time('hora_inicio').notNullable();
    t.time('hora_fin').notNullable();
    t.integer('solicitud_id').unsigned().references('id').inTable('solicitudes');
    t.enu('estado', ['activo', 'cancelado']).defaultTo('activo');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('calendario_conductores');
};
