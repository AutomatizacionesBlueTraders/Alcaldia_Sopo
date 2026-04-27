exports.up = async function (knex) {
  await knex.schema.alterTable('usuarios', (t) => {
    t.boolean('email_verificado').notNullable().defaultTo(false);
    t.boolean('debe_cambiar_password').notNullable().defaultTo(true);
    t.timestamp('ultimo_login');
  });

  // password_hash pasa a ser nullable (usuarios creados por admin reciben NULL
  // hasta que configuran su contraseña desde el enlace por email).
  await knex.schema.alterTable('usuarios', (t) => {
    t.string('password_hash', 255).nullable().alter();
  });

  // Usuarios ya existentes tienen contraseña; marcar como verificados y sin
  // obligación de cambiarla.
  await knex('usuarios')
    .whereNotNull('password_hash')
    .update({ email_verificado: true, debe_cambiar_password: false });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('usuarios', (t) => {
    t.dropColumn('email_verificado');
    t.dropColumn('debe_cambiar_password');
    t.dropColumn('ultimo_login');
  });
  await knex.schema.alterTable('usuarios', (t) => {
    t.string('password_hash', 255).notNullable().alter();
  });
};
