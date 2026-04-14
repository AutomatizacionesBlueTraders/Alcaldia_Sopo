exports.up = async function (knex) {
  await knex.schema.alterTable('solicitudes', (t) => {
    t.boolean('cancelacion_revisada').notNullable().defaultTo(true);
  });
  // Marcar las ya canceladas como revisadas (no molestan al admin en el panel)
  await knex('solicitudes').where({ estado: 'CANCELADA' }).update({ cancelacion_revisada: true });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.dropColumn('cancelacion_revisada');
  });
};
