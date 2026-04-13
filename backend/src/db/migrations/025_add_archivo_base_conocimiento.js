exports.up = function (knex) {
  return knex.schema.alterTable('base_conocimiento', (t) => {
    t.string('archivo_url').nullable();
    t.string('archivo_nombre').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('base_conocimiento', (t) => {
    t.dropColumn('archivo_url');
    t.dropColumn('archivo_nombre');
  });
};
