const rateLimit = require('express-rate-limit');

// Mensaje genérico para no filtrar info al atacante.
function buildLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
    // Si el backend está detrás de proxy (EasyPanel/nginx/Vercel), Express
    // necesita "trust proxy" para que rate-limit identifique IPs reales.
    // Lo activamos aquí dejando que rate-limit use la IP real solo si el
    // cliente nos llega via X-Forwarded-For (configurado abajo en app.js).
    skip: () => process.env.RATE_LIMIT_DISABLED === 'true',
  });
}

// Login: protege contra fuerza bruta.
const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,                  // 10 intentos por IP
  message: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
});

// Forgot/Reset: protege contra spam de emails y enumeración.
const passwordResetLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,                   // 5 solicitudes por IP por hora
  message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
});

module.exports = { loginLimiter, passwordResetLimiter };
