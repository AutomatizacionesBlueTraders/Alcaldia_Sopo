exports.up = function(knex) {
  return knex.schema.createTable('mantenimientos', (t) => {
    t.increments('id').primary();
    t.integer('vehiculo_id').unsigned().notNullable().references('id').inTable('vehiculos');
    t.enu('tipo', ['preventivo', 'correctivo', 'revision']).notNullable();
    t.date('fecha_reporte').notNullable();
    t.date('fecha_ejecucion');
    t.text('descripcion');
    t.enu('estado', ['pendiente', 'en_proceso', 'completado']).defaultTo('pendiente');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('mantenimientos');
};
