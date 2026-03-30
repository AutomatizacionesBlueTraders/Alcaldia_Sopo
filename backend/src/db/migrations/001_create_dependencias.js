exports.up = function(knex) {
  return knex.schema.createTable('dependencias', (t) => {
    t.increments('id').primary();
    t.string('nombre', 150).notNullable().unique();
    t.boolean('activo').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('dependencias');
};
