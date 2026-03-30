exports.up = function(knex) {
  return knex.schema.createTable('asignaciones', (t) => {
    t.increments('id').primary();
    t.integer('solicitud_id').unsigned().notNullable().references('id').inTable('solicitudes');
    t.integer('vehiculo_id').unsigned().notNullable().references('id').inTable('vehiculos');
    t.integer('conductor_id').unsigned().notNullable().references('id').inTable('conductores');
    t.date('fecha').notNullable();
    t.time('hora_inicio').notNullable();
    t.time('hora_fin').notNullable();
    t.decimal('km_inicial', 12, 2);
    t.decimal('km_final', 12, 2);
    t.text('notas');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('asignaciones');
};
