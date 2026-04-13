exports.up = function (knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.text('motivo_cancelacion').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.dropColumn('motivo_cancelacion');
  });
};
