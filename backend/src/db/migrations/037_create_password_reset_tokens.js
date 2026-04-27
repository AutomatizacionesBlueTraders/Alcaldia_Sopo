exports.up = function (knex) {
  return knex.schema.createTable('password_reset_tokens', (t) => {
    t.increments('id').primary();
    t.integer('usuario_id').unsigned().notNullable()
      .references('id').inTable('usuarios').onDelete('CASCADE');
    t.string('token_hash', 64).notNullable().unique(); // sha256 hex
    t.timestamp('expires_at').notNullable();
    t.timestamp('used_at');
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('usuario_id');
    t.index('expires_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('password_reset_tokens');
};
