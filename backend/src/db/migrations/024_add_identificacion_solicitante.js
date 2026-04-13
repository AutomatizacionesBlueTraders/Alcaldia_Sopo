exports.up = function (knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.string('identificacion_solicitante', 20).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.dropColumn('identificacion_solicitante');
  });
};
