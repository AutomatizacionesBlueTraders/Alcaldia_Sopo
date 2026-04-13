exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE solicitudes DROP CONSTRAINT solicitudes_estado_check;
    ALTER TABLE solicitudes ADD CONSTRAINT solicitudes_estado_check
      CHECK (estado = ANY (ARRAY[
        'BORRADOR', 'RECIBIDA', 'ENVIADA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA',
        'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'NO_CONFIRMADA',
        'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'RECHAZADA', 'TRANSFERIDA'
      ]));
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE solicitudes DROP CONSTRAINT solicitudes_estado_check;
    ALTER TABLE solicitudes ADD CONSTRAINT solicitudes_estado_check
      CHECK (estado = ANY (ARRAY[
        'BORRADOR', 'ENVIADA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA',
        'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'NO_CONFIRMADA',
        'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'RECHAZADA', 'TRANSFERIDA'
      ]));
  `);
};
