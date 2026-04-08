const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, rol: user.rol, dependencia_id: user.dependencia_id };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await db('usuarios').where({ email, activo: true }).first();
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokens = generateTokens(user);

    await db('usuarios').where({ id: user.id }).update({
      refresh_token: tokens.refreshToken,
      updated_at: db.fn.now()
    });

    let dependencia_nombre = null;
    if (user.dependencia_id) {
      const dep = await db('dependencias').where({ id: user.dependencia_id }).first();
      dependencia_nombre = dep?.nombre || null;
    }

    res.json({
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, dependencia_id: user.dependencia_id, dependencia_nombre },
      ...tokens
    });
  } catch (err) {
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
    const user = await db('usuarios').where({ id: payload.id, refresh_token: refreshToken, activo: true }).first();
    if (!user) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const tokens = generateTokens(user);
    await db('usuarios').where({ id: user.id }).update({
      refresh_token: tokens.refreshToken,
      updated_at: db.fn.now()
    });

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
}

async function logout(req, res) {
  try {
    await db('usuarios').where({ id: req.user.id }).update({
      refresh_token: null,
      updated_at: db.fn.now()
    });
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function me(req, res) {
  try {
    const user = await db('usuarios')
      .select('usuarios.id', 'usuarios.nombre', 'usuarios.email', 'usuarios.rol', 'usuarios.dependencia_id', 'dependencias.nombre as dependencia_nombre')
      .leftJoin('dependencias', 'usuarios.dependencia_id', 'dependencias.id')
      .where({ 'usuarios.id': req.user.id, 'usuarios.activo': true })
      .first();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { login, refresh, logout, me };
