exports.up = function(knex) {
  return knex.schema.createTable('usuarios', (t) => {
    t.increments('id').primary();
    t.string('nombre', 150).notNullable();
    t.string('email', 150).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.enu('rol', ['admin', 'dependencia', 'conductor']).notNullable();
    t.integer('dependencia_id').unsigned().references('id').inTable('dependencias').onDelete('SET NULL');
    t.string('refresh_token', 500);
    t.boolean('activo').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('usuarios');
};
