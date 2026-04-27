import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TruckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import PasswordStrengthMeter, { evaluatePassword } from '../components/PasswordStrengthMeter';

const EXPIRED_CODES = new Set(['TOKEN_EXPIRED', 'TOKEN_USED', 'INVALID_TOKEN']);

export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Estado para la pantalla "link vencido / inválido"
  const [linkInvalido, setLinkInvalido] = useState(null);
  // { mensaje: string }
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');

    setLoading(true);
    const evalResult = await evaluatePassword(password);
    if (!evalResult || evalResult.score < 3) {
      setLoading(false);
      return setError(
        'La contraseña es demasiado débil. Usa una frase larga con varias palabras, o combina letras, números y símbolos.',
      );
    }

    try {
      await api.post('/auth/reset-password', { token, nueva_password: password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      const data = err?.response?.data || {};
      if (EXPIRED_CODES.has(data.code)) {
        setLinkInvalido({ mensaje: data.error || 'El enlace no es válido.' });
      } else {
        setError(data.error || 'No se pudo restablecer la contraseña');
      }
    } finally {
      setLoading(false);
    }
  }

  const [resendError, setResendError] = useState('');

  async function handleResend(e) {
    e.preventDefault();
    setResendError('');
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email: resendEmail.trim() });
      setResent(true);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      if (status === 404) {
        setResendError(data.error || 'Este correo no está registrado en el sistema.');
      } else if (status === 403) {
        setResendError(data.error || 'Este usuario está desactivado.');
      } else if (status === 429) {
        setResendError('Demasiadas solicitudes. Espera unos minutos.');
      } else {
        setResendError(data.error || 'No se pudo enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setResending(false);
    }
  }

  // Pantalla de token inexistente en la URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enlace inválido</h1>
          <p className="text-gray-500 mt-2 text-sm">
            El enlace no contiene un token válido. Solicita uno nuevo.
          </p>
          <Link to="/recuperar-password" className="btn-primary inline-block mt-6">
            Solicitar enlace
          </Link>
        </div>
      </div>
    );
  }

  // Pantalla "link vencido / inválido / reemplazado"
  if (linkInvalido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Este enlace ya no sirve</h1>
            <p className="text-gray-600 mt-2 text-sm">{linkInvalido.mensaje}</p>
          </div>

          {resent ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">
              Recibirás un correo nuevo (con código y enlace) en los próximos minutos.
              Caduca en 1 hora.
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa tu correo y te enviaremos un correo nuevo con código y enlace:
              </p>
              {resendError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {resendError}
                </div>
              )}
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="input-field"
                placeholder="tu@correo.com"
                required
              />
              <button type="submit" disabled={resending} className="btn-primary w-full justify-center py-3">
                {resending ? 'Enviando…' : 'Enviar correo nuevo'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              ¿Ya tienes el código de 6 dígitos del correo?
            </p>
            <Link
              to={`/recuperar-password/codigo${resendEmail ? `?email=${encodeURIComponent(resendEmail.trim())}` : ''}`}
              className="text-primary-600 hover:underline text-sm font-medium"
            >
              Ingresar código →
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-primary-600 hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Pantalla principal: formulario de nueva contraseña
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
          <p className="text-gray-500 mt-1 text-sm">Define la contraseña con la que ingresarás.</p>
        </div>

        {done ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">
            Contraseña actualizada. Redirigiendo al inicio de sesión…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

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
              <PasswordStrengthMeter password={password} />
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
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-primary-600 hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
