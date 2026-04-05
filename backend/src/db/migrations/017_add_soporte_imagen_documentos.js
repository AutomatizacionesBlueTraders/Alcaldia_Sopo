exports.up = function(knex) {
  return knex.schema.alterTable('documentos', (t) => {
    t.text('soporte_imagen'); // base64 de la imagen del documento
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('documentos', (t) => {
    t.dropColumn('soporte_imagen');
  });
};
