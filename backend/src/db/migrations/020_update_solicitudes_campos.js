exports.up = function(knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.text('descripcion_recorrido');
    t.string('nombre_paciente', 200);
    t.string('nombre_solicitante', 200);
    t.string('telefono_solicitante', 20);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('solicitudes', (t) => {
    t.dropColumn('descripcion_recorrido');
    t.dropColumn('nombre_paciente');
    t.dropColumn('nombre_solicitante');
    t.dropColumn('telefono_solicitante');
  });
};
