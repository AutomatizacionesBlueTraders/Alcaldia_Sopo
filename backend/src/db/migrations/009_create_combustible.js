exports.up = function(knex) {
  return knex.schema.createTable('combustible', (t) => {
    t.increments('id').primary();
    t.integer('vehiculo_id').unsigned().notNullable().references('id').inTable('vehiculos');
    t.integer('conductor_id').unsigned().references('id').inTable('conductores');
    t.date('fecha').notNullable();
    t.decimal('galones', 8, 2).notNullable();
    t.decimal('valor_cop', 12, 2).notNullable();
    t.decimal('km_registro', 12, 2);
    t.string('ticket_url', 500);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('combustible');
};
