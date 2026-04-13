exports.up = function (knex) {
  return knex.schema.alterTable('combustible', (t) => {
    t.string('tipo_combustible').nullable();
    t.string('no_ticket').nullable();
    t.decimal('valor_galon', 10, 2).nullable();
    t.text('observaciones').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('combustible', (t) => {
    t.dropColumn('tipo_combustible');
    t.dropColumn('no_ticket');
    t.dropColumn('valor_galon');
    t.dropColumn('observaciones');
  });
};
