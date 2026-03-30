exports.up = function(knex) {
  return knex.schema.createTable('calendario_vehiculos', (t) => {
    t.increments('id').primary();
    t.integer('vehiculo_id').unsigned().notNullable().references('id').inTable('vehiculos');
    t.date('fecha').notNullable();
    t.time('hora_inicio').notNullable();
    t.time('hora_fin').notNullable();
    t.integer('solicitud_id').unsigned().references('id').inTable('solicitudes');
    t.enu('tipo_bloqueo', ['servicio', 'mantenimiento', 'reserva']).defaultTo('servicio');
    t.enu('estado', ['activo', 'cancelado']).defaultTo('activo');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('calendario_vehiculos');
};
