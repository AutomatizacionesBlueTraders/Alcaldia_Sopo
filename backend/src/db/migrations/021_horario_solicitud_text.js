exports.up = function(knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.string('horario_solicitud', 100);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.dropColumn('horario_solicitud');
  });
};
