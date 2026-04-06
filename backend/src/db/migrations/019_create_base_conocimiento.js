exports.up = function(knex) {
  return knex.schema.createTable('base_conocimiento', (t) => {
    t.increments('id').primary();
    t.integer('dependencia_id').unsigned().references('id').inTable('dependencias').onDelete('CASCADE');
    t.integer('usuario_id').unsigned().references('id').inTable('usuarios');
    t.string('titulo', 200).notNullable();
    t.text('contenido').notNullable();
    t.string('categoria', 100);
    t.boolean('activo').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('base_conocimiento');
};
