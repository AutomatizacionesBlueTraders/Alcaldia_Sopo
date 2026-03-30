exports.up = function(knex) {
  return knex.schema.createTable('solicitudes', (t) => {
    t.increments('id').primary();
    t.integer('dependencia_id').unsigned().notNullable().references('id').inTable('dependencias');
    t.integer('usuario_id').unsigned().references('id').inTable('usuarios');
    t.date('fecha_servicio').notNullable();
    t.time('hora_inicio').notNullable();
    t.time('hora_fin_estimada');
    t.string('origen', 255).notNullable();
    t.string('destino', 255).notNullable();
    t.integer('pasajeros').defaultTo(1);
    t.string('tipo_servicio', 100);
    t.string('contacto_nombre', 150);
    t.string('contacto_telefono', 20);
    t.text('observaciones');
    t.enu('estado', [
      'BORRADOR', 'ENVIADA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA',
      'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'NO_CONFIRMADA',
      'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'RECHAZADA', 'TRANSFERIDA'
    ]).defaultTo('ENVIADA');
    t.enu('canal', ['web', 'whatsapp']).defaultTo('web');
    t.boolean('recordatorio_enviado').defaultTo(false);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('solicitudes');
};
