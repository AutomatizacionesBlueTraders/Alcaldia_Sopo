exports.up = function(knex) {
  return knex.schema.createTable('novedades', (t) => {
    t.increments('id').primary();
    t.integer('vehiculo_id').unsigned().notNullable().references('id').inTable('vehiculos');
    t.integer('conductor_id').unsigned().references('id').inTable('conductores');
    t.integer('solicitud_id').unsigned().references('id').inTable('solicitudes');
    t.string('tipo', 100).notNullable();
    t.text('descripcion').notNullable();
    t.enu('urgencia', ['baja', 'media', 'alta', 'critica']).defaultTo('media');
    t.enu('puede_operar', ['si', 'no', 'limitado']).defaultTo('si');
    t.enu('estado', ['pendiente', 'en_revision', 'en_mantenimiento', 'resuelto']).defaultTo('pendiente');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('novedades');
};
