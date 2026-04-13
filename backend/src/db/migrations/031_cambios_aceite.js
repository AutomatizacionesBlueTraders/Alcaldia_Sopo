exports.up = async function (knex) {
  await knex.schema.alterTable('vehiculos', (t) => {
    t.integer('km_intervalo_aceite').defaultTo(5000);
  });

  await knex.schema.createTable('cambios_aceite', (t) => {
    t.increments('id').primary();
    t.integer('vehiculo_id').notNullable().references('id').inTable('vehiculos').onDelete('CASCADE');
    t.date('fecha').notNullable();
    t.integer('km_cambio').notNullable();
    t.string('tipo_aceite', 100).nullable();
    t.string('taller', 150).nullable();
    t.decimal('costo', 12, 2).nullable();
    t.text('observaciones').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    t.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    t.index(['vehiculo_id', 'km_cambio']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('cambios_aceite');
  await knex.schema.alterTable('vehiculos', (t) => {
    t.dropColumn('km_intervalo_aceite');
  });
};
