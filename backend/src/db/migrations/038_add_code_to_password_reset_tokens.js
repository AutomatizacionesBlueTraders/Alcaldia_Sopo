// Añade soporte para códigos OTP de 6 dígitos en paralelo al token-link.
// Mismo registro lleva token_hash + code_hash; cualquiera de los dos sirve
// para restablecer. El código es la vía robusta para correos corporativos
// que reescriben URLs (Microsoft Safe Links / Defender).
exports.up = async function (knex) {
  await knex.schema.alterTable('password_reset_tokens', (t) => {
    t.string('code_hash', 64); // sha256(código de 6 dígitos)
    t.integer('attempts').notNullable().defaultTo(0); // anti-brute-force
  });

  // Índice parcial para búsquedas por code_hash sólo en filas activas.
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_pwreset_code_hash
      ON password_reset_tokens (code_hash)
      WHERE code_hash IS NOT NULL AND used_at IS NULL
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_pwreset_code_hash');
  await knex.schema.alterTable('password_reset_tokens', (t) => {
    t.dropColumn('code_hash');
    t.dropColumn('attempts');
  });
};
