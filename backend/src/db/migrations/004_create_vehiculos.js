exports.up = function(knex) {
  return knex.schema.createTable('vehiculos', (t) => {
    t.increments('id').primary();
    t.string('placa', 10).notNullable().unique();
    t.enu('tipo', ['vehiculo', 'maquinaria']).notNullable().defaultTo('vehiculo');
    t.string('marca', 50);
    t.string('modelo', 50);
    t.integer('anio');
    t.enu('estado', ['disponible', 'en_servicio', 'mantenimiento', 'inactivo']).defaultTo('disponible');
    t.decimal('km_actual', 12, 2).defaultTo(0);
    t.boolean('activo').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('vehiculos');
};
