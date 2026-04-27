const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email');
const { validatePasswordStrength } = require('../utils/passwordStrength');

const ROLES_VALIDOS = ['admin', 'dependencia', 'conductor'];
const BCRYPT_ROUNDS = 10;

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, rol: user.rol, dependencia_id: user.dependencia_id };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
}

function hashToken(plain) {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex');
}

function generateEmailToken() {
  const plain = crypto.randomBytes(32).toString('base64url'); // ~43 chars
  return { plain, hash: hashToken(plain) };
}

// Código de 6 dígitos numéricos. Sólo entra a ojo humano: anti-corporate-filters.
// Se manda en plano por email, en BD sólo el sha256.
function generateEmailCode() {
  // randomInt es uniforme en [0, max). 1000000 → 6 dígitos con padding.
  const n = crypto.randomInt(0, 1000000);
  const plain = String(n).padStart(6, '0');
  return { plain, hash: hashToken(plain) };
}

// Crea token + código de reset en BD (misma fila) y dispara el email
// (welcome o reset). Invalida cualquier registro pendiente del mismo usuario:
// sólo puede haber 1 par activo a la vez — emitir uno nuevo expira el anterior.
async function createAndSendResetLink({ usuarioId, email, nombre, isWelcome }) {
  const ttlMin = Number(process.env.PASSWORD_RESET_TTL_MIN || 60);
  const tok = generateEmailToken();
  const code = generateEmailCode();
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

  await db.transaction(async (trx) => {
    await trx('password_reset_tokens')
      .where({ usuario_id: usuarioId })
      .whereNull('used_at')
      .update({ used_at: new Date() });

    await trx('password_reset_tokens').insert({
      usuario_id: usuarioId,
      token_hash: tok.hash,
      code_hash: code.hash,
      expires_at: expiresAt,
    });
  });

  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetLink = `${appUrl}/restablecer-password?token=${encodeURIComponent(tok.plain)}`;
  // No lleva el código — sólo el email pre-llenado. Aunque Safe Links reescriba
  // esta URL, sigue funcionando porque no depende de un token único.
  const codeEntryUrl = `${appUrl}/recuperar-password/codigo?email=${encodeURIComponent(email)}`;

  if (isWelcome) {
    await sendWelcomeEmail({
      to: email, nombre, setupLink: resetLink, code: code.plain, codeEntryUrl, ttlMin,
    });
  } else {
    await sendPasswordResetEmail({
      to: email, nombre, resetLink, code: code.plain, codeEntryUrl, ttlMin,
    });
  }
}

function toPublicUser(user, dependencia_nombre = null) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    dependencia_id: user.dependencia_id,
    dependencia_nombre,
    email_verificado: !!user.email_verificado,
    debe_cambiar_password: !!user.debe_cambiar_password,
    activo: !!user.activo,
    ultimo_login: user.ultimo_login,
  };
}

// ═══════ LOGIN / ME / LOGOUT / REFRESH ═══════
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await db('usuarios')
      .where({ email: email.toLowerCase().trim() })
      .first();

    const INVALID = { status: 401, error: 'Credenciales inválidas' };
    if (!user) return res.status(INVALID.status).json({ error: INVALID.error });
    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }
    if (!user.password_hash) {
      return res.status(403).json({
        error: 'Debes configurar tu contraseña desde el enlace enviado por correo',
      });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(INVALID.status).json({ error: INVALID.error });

    await db('usuarios').where({ id: user.id }).update({ ultimo_login: new Date() });

    const tokens = generateTokens(user);

    let dependencia_nombre = null;
    if (user.dependencia_id) {
      const dep = await db('dependencias').where({ id: user.dependencia_id }).first();
      dependencia_nombre = dep?.nombre || null;
    }

    res.json({
      user: toPublicUser(user, dependencia_nombre),
      ...tokens,
    });
  } catch (err) {
    console.error('login_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await db('usuarios').where({ id: payload.id, activo: true }).first();
    if (!user) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
}

async function logout(req, res) {
  res.json({ message: 'Sesión cerrada' });
}

async function me(req, res) {
  try {
    const user = await db('usuarios')
      .select(
        'usuarios.id', 'usuarios.nombre', 'usuarios.email', 'usuarios.rol',
        'usuarios.dependencia_id', 'usuarios.email_verificado',
        'usuarios.debe_cambiar_password', 'usuarios.activo', 'usuarios.ultimo_login',
        'dependencias.nombre as dependencia_nombre',
      )
      .leftJoin('dependencias', 'usuarios.dependencia_id', 'dependencias.id')
      .where({ 'usuarios.id': req.user.id, 'usuarios.activo': true })
      .first();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(toPublicUser(user, user.dependencia_nombre));
  } catch (err) {
    console.error('me_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ═══════ FORGOT / RESET / CHANGE ═══════
async function forgotPassword(req, res) {
  const mensaje =
    'Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.';
  try {
    const email = (req.body?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await db('usuarios').where({ email }).first();

    // Anti-enumeración: siempre responder mensaje genérico.
    if (!user || !user.activo) {
      console.log('[auth] forgot_password_unknown_or_inactive', { email });
      return res.json({ ok: true, mensaje });
    }

    await createAndSendResetLink({
      usuarioId: user.id,
      email: user.email,
      nombre: user.nombre,
      isWelcome: false,
    });
    res.json({ ok: true, mensaje });
  } catch (err) {
    console.error('forgot_password_error', err);
    // Incluso ante error interno, responder genérico para no filtrar señal.
    res.json({ ok: true, mensaje });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, nueva_password } = req.body || {};
    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    }

    const tokenHash = hashToken(token);
    const row = await db('password_reset_tokens as t')
      .join('usuarios as u', 'u.id', 't.usuario_id')
      .select(
        't.id as token_id', 't.usuario_id', 't.expires_at', 't.used_at',
        'u.activo', 'u.email', 'u.nombre',
      )
      .where('t.token_hash', tokenHash)
      .first();

    if (!row) return res.status(400).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    if (row.used_at) {
      return res.status(400).json({
        error: 'Este enlace ya fue utilizado o fue reemplazado por uno nuevo.',
        code: 'TOKEN_USED',
      });
    }
    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'El enlace expiró. Solicita uno nuevo.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (!row.activo) return res.status(403).json({ error: 'Usuario desactivado', code: 'USER_DISABLED' });

    const strength = validatePasswordStrength(nueva_password, [row.email, row.nombre]);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.reason, code: 'WEAK_PASSWORD', score: strength.score });
    }

    const newHash = await bcrypt.hash(nueva_password, BCRYPT_ROUNDS);

    await db.transaction(async (trx) => {
      await trx('usuarios').where({ id: row.usuario_id }).update({
        password_hash: newHash,
        debe_cambiar_password: false,
        email_verificado: true,
      });
      await trx('password_reset_tokens').where({ id: row.token_id }).update({ used_at: new Date() });
      // Invalida cualquier otro token pendiente del mismo usuario.
      await trx('password_reset_tokens')
        .where({ usuario_id: row.usuario_id })
        .whereNull('used_at')
        .update({ used_at: new Date() });
    });

    res.json({ ok: true, mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('reset_password_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Reset por código de 6 dígitos. Pensado para usuarios con correos corporativos
// (Microsoft 365 / Defender / Safe Links) donde los links del correo se
// reescriben y rompen el token. Anti-enumeración + anti-brute-force (5 intentos).
const MAX_CODE_ATTEMPTS = 5;

async function resetPasswordWithCode(req, res) {
  try {
    const emailRaw = (req.body?.email || '').toLowerCase().trim();
    const codeRaw = String(req.body?.code || '').trim();
    const nuevaPassword = req.body?.nueva_password;

    if (!emailRaw || !codeRaw || !nuevaPassword) {
      return res.status(400).json({
        error: 'email, code y nueva_password son requeridos',
        code: 'INVALID_CODE',
      });
    }
    if (!/^\d{6}$/.test(codeRaw)) {
      return res.status(400).json({ error: 'Código inválido', code: 'INVALID_CODE' });
    }

    const user = await db('usuarios').where({ email: emailRaw }).first();

    // Anti-enumeración: si el email no existe, mismo error que código incorrecto.
    if (!user) {
      return res.status(400).json({ error: 'Código inválido', code: 'INVALID_CODE' });
    }
    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado', code: 'USER_DISABLED' });
    }

    const codeHash = hashToken(codeRaw);
    const row = await db('password_reset_tokens')
      .where({ usuario_id: user.id, code_hash: codeHash })
      .first();

    // Caso: código no coincide con ninguna fila → contar como intento fallido
    // sobre la fila activa más reciente. Si pasa el umbral, invalidarla.
    if (!row) {
      const latest = await db('password_reset_tokens')
        .where({ usuario_id: user.id })
        .whereNull('used_at')
        .whereNotNull('code_hash')
        .orderBy('created_at', 'desc')
        .first();

      if (latest) {
        const attempts = (latest.attempts || 0) + 1;
        if (attempts >= MAX_CODE_ATTEMPTS) {
          await db('password_reset_tokens').where({ id: latest.id }).update({
            attempts,
            used_at: new Date(),
          });
          return res.status(400).json({
            error: 'Demasiados intentos. Solicita un código nuevo.',
            code: 'TOO_MANY_ATTEMPTS',
          });
        }
        await db('password_reset_tokens').where({ id: latest.id }).update({ attempts });
      }
      return res.status(400).json({ error: 'Código inválido', code: 'INVALID_CODE' });
    }

    if (row.used_at) {
      return res.status(400).json({
        error: 'Este código ya fue utilizado o fue reemplazado por uno nuevo.',
        code: 'TOKEN_USED',
      });
    }
    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'El código expiró. Solicita uno nuevo.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if ((row.attempts || 0) >= MAX_CODE_ATTEMPTS) {
      return res.status(400).json({
        error: 'Demasiados intentos. Solicita un código nuevo.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    const strength = validatePasswordStrength(nuevaPassword, [user.email, user.nombre]);
    if (!strength.valid) {
      return res.status(400).json({
        error: strength.reason, code: 'WEAK_PASSWORD', score: strength.score,
      });
    }

    const newHash = await bcrypt.hash(nuevaPassword, BCRYPT_ROUNDS);

    await db.transaction(async (trx) => {
      await trx('usuarios').where({ id: user.id }).update({
        password_hash: newHash,
        debe_cambiar_password: false,
        email_verificado: true,
      });
      await trx('password_reset_tokens').where({ id: row.id }).update({ used_at: new Date() });
      // Invalidar cualquier otra fila activa del mismo usuario (incluida
      // la que tendría sólo token y no se usó).
      await trx('password_reset_tokens')
        .where({ usuario_id: user.id })
        .whereNull('used_at')
        .update({ used_at: new Date() });
    });

    return res.json({ ok: true, mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('reset_password_with_code_error', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function changePassword(req, res) {
  try {
    const { password_actual, nueva_password } = req.body || {};

    const user = await db('usuarios').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Si debe_cambiar_password=true, saltamos la verificación de la actual.
    if (!user.debe_cambiar_password) {
      if (!password_actual) {
        return res.status(400).json({ error: 'Debes ingresar tu contraseña actual' });
      }
      if (!user.password_hash || !(await bcrypt.compare(password_actual, user.password_hash))) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
      }
      if (password_actual === nueva_password) {
        return res.status(400).json({ error: 'La nueva contraseña debe ser distinta de la actual' });
      }
    }

    const strength = validatePasswordStrength(nueva_password, [user.email, user.nombre]);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.reason, code: 'WEAK_PASSWORD', score: strength.score });
    }

    const newHash = await bcrypt.hash(nueva_password, BCRYPT_ROUNDS);
    await db('usuarios').where({ id: user.id }).update({
      password_hash: newHash,
      debe_cambiar_password: false,
    });

    res.json({ ok: true, mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('change_password_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ═══════ GESTIÓN DE USUARIOS (admin) ═══════
async function createUser(req, res) {
  try {
    const { email, nombre, rol, dependencia_id } = req.body || {};
    const emailNorm = (email || '').toLowerCase().trim();
    const nombreNorm = (nombre || '').trim();

    if (!emailNorm || !nombreNorm || !rol) {
      return res.status(400).json({ error: 'email, nombre y rol son requeridos' });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    if (!dependencia_id) {
      return res.status(400).json({ error: 'Todo usuario debe estar asociado a una dependencia' });
    }

    // Verifica que la dependencia exista
    const dep = await db('dependencias').where({ id: dependencia_id }).first();
    if (!dep) {
      return res.status(400).json({ error: 'La dependencia indicada no existe' });
    }

    const existing = await db('usuarios').where({ email: emailNorm }).first();
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const [created] = await db('usuarios')
      .insert({
        email: emailNorm,
        nombre: nombreNorm,
        password_hash: null,
        rol,
        dependencia_id: dependencia_id || null,
        activo: true,
        email_verificado: false,
        debe_cambiar_password: true,
      })
      .returning(['id', 'email', 'nombre', 'rol', 'dependencia_id', 'email_verificado',
                  'debe_cambiar_password', 'activo', 'ultimo_login']);

    await createAndSendResetLink({
      usuarioId: created.id,
      email: created.email,
      nombre: created.nombre,
      isWelcome: true,
    });

    res.status(201).json(toPublicUser(created));
  } catch (err) {
    console.error('create_user_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function resendInvite(req, res) {
  try {
    const { id } = req.params;
    const user = await db('usuarios').where({ id }).first();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!user.activo) return res.status(400).json({ error: 'Usuario desactivado' });

    await createAndSendResetLink({
      usuarioId: user.id,
      email: user.email,
      nombre: user.nombre,
      isWelcome: true,
    });
    res.json({ ok: true, mensaje: 'Email de invitación reenviado' });
  } catch (err) {
    console.error('resend_invite_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function listUsers(req, res) {
  try {
    const { activo, rol } = req.query;
    const q = db('usuarios as u')
      .leftJoin('dependencias as d', 'u.dependencia_id', 'd.id')
      .select(
        'u.id', 'u.email', 'u.nombre', 'u.rol', 'u.dependencia_id',
        'u.email_verificado', 'u.debe_cambiar_password', 'u.activo',
        'u.ultimo_login', 'u.created_at', 'd.nombre as dependencia_nombre',
      )
      .orderBy([{ column: 'u.activo', order: 'desc' }, { column: 'u.nombre', order: 'asc' }]);

    if (activo !== undefined) q.where('u.activo', activo === 'true');
    if (rol) q.where('u.rol', rol);

    const rows = await q;
    res.json(rows.map((r) => toPublicUser(r, r.dependencia_nombre)));
  } catch (err) {
    console.error('list_users_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { nombre, rol, dependencia_id, activo } = req.body || {};
    const updates = {};

    if (nombre !== undefined) updates.nombre = String(nombre).trim();
    if (rol !== undefined) {
      if (!ROLES_VALIDOS.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
      updates.rol = rol;
    }
    if (dependencia_id !== undefined) {
      if (!dependencia_id) {
        return res.status(400).json({ error: 'Todo usuario debe estar asociado a una dependencia' });
      }
      const dep = await db('dependencias').where({ id: dependencia_id }).first();
      if (!dep) return res.status(400).json({ error: 'La dependencia indicada no existe' });
      updates.dependencia_id = dependencia_id;
    }
    if (activo !== undefined) updates.activo = !!activo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Sin campos para actualizar' });
    }
    if (String(req.user.id) === String(id) && updates.activo === false) {
      return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
    }

    const [updated] = await db('usuarios').where({ id }).update(updates)
      .returning(['id', 'email', 'nombre', 'rol', 'dependencia_id', 'email_verificado',
                  'debe_cambiar_password', 'activo', 'ultimo_login']);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(toPublicUser(updated));
  } catch (err) {
    console.error('update_user_error', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  login, refresh, logout, me,
  forgotPassword, resetPassword, resetPasswordWithCode, changePassword,
  createUser, resendInvite, listUsers, updateUser,
};
