import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { TruckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthMeter, { evaluatePassword } from '../components/PasswordStrengthMeter';

const ROLE_ROUTES = {
  admin: '/admin',
  dependencia: '/solicitudes',
  conductor: '/servicios',
};

export default function CambiarPassword() {
  const { user, loading, updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [passwordActual, setPasswordActual] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const forzado = !!user.debe_cambiar_password;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    if (!forzado && !passwordActual) return setError('Ingresa tu contraseña actual.');

    setSaving(true);
    const evalResult = await evaluatePassword(password, [user?.email, user?.nombre]);
    if (!evalResult || evalResult.score < 3) {
      setSaving(false);
      return setError(
        'La contraseña es demasiado débil. Usa una frase larga con varias palabras, o combina letras, números y símbolos.',
      );
    }

    try {
      await updatePassword({
        nueva_password: password,
        password_actual: forzado ? undefined : passwordActual,
      });
      navigate(ROLE_ROUTES[user.rol] || '/', { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.error || 'No se pudo actualizar la contraseña';
      setError(detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {forzado ? 'Define tu contraseña' : 'Cambiar contraseña'}
          </h1>
          {forzado && (
            <p className="text-gray-500 mt-1 text-sm">
              Por seguridad, debes establecer una contraseña nueva para continuar.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {!forzado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña actual</label>
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="input-field"
                required
              />
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
            <PasswordStrengthMeter password={password} userInputs={[user?.email, user?.nombre]} />
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

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
            {saving ? 'Guardando…' : 'Guardar contraseña'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
