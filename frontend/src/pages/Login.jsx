import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TruckIcon } from '@heroicons/react/24/outline';

const ROLE_ROUTES = {
  admin: '/admin',
  dependencia: '/solicitudes',
  conductor: '/servicios',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.rol] || '/');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 bg-white rounded-full" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
            <TruckIcon className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Sistema de Gestión<br />de Transporte
          </h2>
          <p className="text-primary-200 text-lg max-w-md">
            Plataforma integral para la gestión del parque automotor
            y servicios de transporte de la Alcaldía Municipal de Sopó.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3">
              <p className="text-accent-300 text-2xl font-bold">30+</p>
              <p className="text-primary-300 text-xs">Vehículos</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3">
              <p className="text-accent-300 text-2xl font-bold">10</p>
              <p className="text-primary-300 text-xs">Dependencias</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3">
              <p className="text-accent-300 text-2xl font-bold">24/7</p>
              <p className="text-primary-300 text-xs">Disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="text-center mb-8">
            <div className="lg:hidden w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
              <TruckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Alcaldía de Sopó</h1>
            <p className="text-gray-500 mt-1 text-sm">Ingresa a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Sopó, Cundinamarca &mdash; Colombia
          </p>
        </div>
      </div>
    </div>
  );
}
