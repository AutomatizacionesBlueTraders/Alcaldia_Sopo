exports.up = function(knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.time('hora_inicio').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.time('hora_inicio').notNullable().alter();
  });
};
