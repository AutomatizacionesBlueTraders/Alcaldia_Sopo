import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  TruckIcon, ExclamationTriangleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../api/axios';
import PasswordStrengthMeter, { evaluatePassword } from '../components/PasswordStrengthMeter';

// Mapea el código del backend al "estado" que muestra la UI.
function mapErrorCode(code) {
  switch (code) {
    case 'INVALID_CODE': return 'invalid';
    case 'TOKEN_EXPIRED': return 'expired';
    case 'TOKEN_USED': return 'used';
    case 'TOO_MANY_ATTEMPTS': return 'too_many';
    case 'WEAK_PASSWORD': return 'weak';
    case 'USER_DISABLED': return 'disabled';
    default: return null;
  }
}

const REASON_TITLES = {
  invalid: 'Código incorrecto',
  expired: 'El código expiró',
  used: 'Este código ya fue utilizado',
  too_many: 'Demasiados intentos',
  weak: 'Contraseña demasiado débil',
  disabled: 'Usuario desactivado',
};

const NEEDS_NEW_CODE = new Set(['expired', 'used', 'too_many']);

export default function IngresarCodigoRecuperacion() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => (params.get('email') || '').trim());
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState(null); // 'invalid' | 'expired' | ...
  const [done, setDone] = useState(false);

  // Para el "reenviar código" cuando el actual ya no sirve
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const codeInputRef = useRef(null);

  useEffect(() => {
    // Si vino con email pre-llenado, foco en el campo del código.
    if (email && codeInputRef.current) codeInputRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onCodeChange(e) {
    // Sólo dígitos, máximo 6.
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setReason(null);

    if (!/^\d{6}$/.test(code)) {
      return setError('El código debe tener 6 dígitos.');
    }
    if (password !== confirm) {
      return setError('Las contraseñas no coinciden.');
    }

    setLoading(true);
    const evalResult = await evaluatePassword(password, [email]);
    if (!evalResult || evalResult.score < 3) {
      setLoading(false);
      return setError(
        'La contraseña es demasiado débil. Usa una frase larga con varias palabras, o combina letras, números y símbolos.',
      );
    }

    try {
      await api.post('/auth/reset-password-with-code', {
        email: email.trim(),
        code,
        nueva_password: password,
      });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      const data = err?.response?.data || {};
      const r = mapErrorCode(data.code);
      if (r) {
        setReason(r);
        setError(data.error || REASON_TITLES[r]);
      } else {
        setError(data.error || 'No se pudo restablecer la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResent(false);
    try {
      // Anti-enumeración: el backend siempre responde 200.
      await api.post('/auth/forgot-password', { email: email.trim() });
      setResent(true);
      setReason(null);
      setError('');
      setCode('');
    } catch {
      // Aún silencioso (el backend ya es genérico).
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  // Pantalla de éxito
  if (done) {
    return (
      <Shell>
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">
          Contraseña actualizada. Redirigiendo al inicio de sesión…
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && !NEEDS_NEW_CODE.has(reason) && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100 flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              {reason && <p className="font-medium">{REASON_TITLES[reason]}</p>}
              <p>{error}</p>
              {reason === 'invalid' && (
                <p className="text-xs text-red-500 mt-1">Verifica el código y el correo.</p>
              )}
            </div>
          </div>
        )}

        {NEEDS_NEW_CODE.has(reason) && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-200">
            <p className="font-medium">{REASON_TITLES[reason]}</p>
            <p className="mt-1">Solicita un código nuevo para continuar.</p>
            {resent ? (
              <p className="text-green-700 mt-3">
                Si el correo existe, recibirás un código nuevo en los próximos minutos.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || !email}
                className="mt-3 inline-flex items-center gap-2 text-amber-900 font-medium hover:underline disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {resending ? 'Enviando…' : 'Enviar código nuevo'}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="usuario@sopo.gov.co"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Código del correo (6 dígitos)
          </label>
          <input
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={onCodeChange}
            className="input-field text-center text-2xl font-mono tracking-[0.5em] py-3"
            placeholder="000000"
            maxLength={6}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Revisa tu correo. El código expira en 1 hora.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            minLength={8}
            required
          />
          <PasswordStrengthMeter password={password} userInputs={[email]} />
          <p className="text-xs text-gray-400 mt-1">
            Mínimo 8 caracteres. Evita contraseñas comunes como "12345678".
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field"
            minLength={8}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link to="/recuperar-password" className="text-primary-600 hover:underline">
          ¿No tienes código? Solicítalo aquí
        </Link>
      </p>
      <p className="text-center text-sm text-gray-500 mt-2">
        <Link to="/login" className="text-primary-600 hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresar código</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Pega el código que te enviamos al correo y elige tu nueva contraseña.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
