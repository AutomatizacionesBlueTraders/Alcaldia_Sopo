exports.up = function(knex) {
  return knex.schema.createTable('conductores', (t) => {
    t.increments('id').primary();
    t.integer('usuario_id').unsigned().references('id').inTable('usuarios').onDelete('CASCADE');
    t.string('nombre', 150).notNullable();
    t.string('telefono', 20);
    t.string('licencia', 50);
    t.date('vencimiento_licencia');
    t.enu('estado', ['activo', 'inactivo', 'vacaciones', 'incapacidad']).defaultTo('activo');
    t.boolean('activo').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('conductores');
};
