exports.up = function(knex) {
  return knex.schema.createTable('documentos', (t) => {
    t.increments('id').primary();
    t.integer('vehiculo_id').unsigned().notNullable().references('id').inTable('vehiculos');
    t.enu('tipo', ['soat', 'seguro', 'tecnomecanica']).notNullable();
    t.date('fecha_expedicion');
    t.date('fecha_vencimiento').notNullable();
    t.enu('estado', ['vigente', 'por_vencer', 'vencido']).defaultTo('vigente');
    t.string('soporte_url', 500);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('documentos');
};
