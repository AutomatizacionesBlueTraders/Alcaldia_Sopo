exports.up = function(knex) {
  return knex.schema.createTable('transferencias', (t) => {
    t.increments('id').primary();
    t.integer('solicitud_id').unsigned().notNullable().references('id').inTable('solicitudes');
    t.integer('dependencia_origen_id').unsigned().notNullable().references('id').inTable('dependencias');
    t.integer('dependencia_destino_id').unsigned().notNullable().references('id').inTable('dependencias');
    t.text('motivo');
    t.integer('usuario_id').unsigned().references('id').inTable('usuarios');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('transferencias');
};
