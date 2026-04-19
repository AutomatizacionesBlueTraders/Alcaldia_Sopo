exports.up = function (knex) {
  return knex.schema.createTable('whatsapp_mensajes', (t) => {
    t.increments('id').primary();
    t.string('message_sid', 64).unique();
    t.string('telefono_usuario', 30).notNullable().index();
    t.string('telefono_twilio', 30);
    t.enu('direccion', ['in', 'out']).notNullable();
    t.text('body');
    t.string('media_url', 500);
    t.string('media_path', 500);
    t.string('media_content_type', 100);
    t.integer('num_media').defaultTo(0);
    t.string('status', 30);
    t.timestamp('created_at').defaultTo(knex.fn.now()).index();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('whatsapp_mensajes');
};
