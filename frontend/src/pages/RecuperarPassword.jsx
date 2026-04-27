import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      if (status === 404) {
        setError(data.error || 'Este correo no está registrado en el sistema.');
      } else if (status === 403) {
        setError(data.error || 'Este usuario está desactivado. Contacta al administrador.');
      } else if (status === 429) {
        setError('Demasiadas solicitudes. Espera unos minutos antes de intentar de nuevo.');
      } else {
        setError(data.error || 'No se pudo conectar con el servidor. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Te enviaremos un enlace por correo electrónico.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">
              En los próximos minutos recibirás un correo con un
              <strong> código de 6 dígitos</strong> y un botón para restablecer.
              Revisa también la carpeta de spam. Caduca en 1 hora.
            </div>
            <Link
              to={`/recuperar-password/codigo?email=${encodeURIComponent(email.trim())}`}
              className="btn-primary w-full justify-center py-3"
            >
              Ya recibí el código — ingresarlo
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Si tu correo es corporativo (Outlook, Microsoft 365), el botón del
              correo puede no funcionar. Usa el código.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="usuario@sopo.gov.co"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Enviando…' : 'Enviar enlace'}
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
