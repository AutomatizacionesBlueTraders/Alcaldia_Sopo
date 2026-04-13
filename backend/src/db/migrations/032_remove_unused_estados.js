exports.up = function (knex) {
  return knex.raw(`
    -- Backfill filas existentes con estados que vamos a eliminar
    UPDATE solicitudes SET estado = 'CANCELADA' WHERE estado = 'NO_CONFIRMADA';
    UPDATE solicitudes SET estado = 'RECIBIDA'  WHERE estado IN ('ENVIADA', 'TRANSFERIDA');

    ALTER TABLE solicitudes DROP CONSTRAINT solicitudes_estado_check;
    ALTER TABLE solicitudes ADD CONSTRAINT solicitudes_estado_check
      CHECK (estado = ANY (ARRAY[
        'BORRADOR', 'RECIBIDA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA',
        'PENDIENTE_CONFIRMACION', 'CONFIRMADA',
        'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'RECHAZADA'
      ]));

    -- El default de la tabla (migration 005) apuntaba a 'ENVIADA' que ya no existe
    ALTER TABLE solicitudes ALTER COLUMN estado SET DEFAULT 'RECIBIDA';
  `);
};

exports.down = function (knex) {
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
