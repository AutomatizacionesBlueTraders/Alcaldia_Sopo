import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function NoAutorizado() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card p-10 text-center max-w-sm">
        <ShieldExclamationIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
        <p className="text-gray-600 mb-6">No tienes permiso para acceder a esta pagina</p>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary w-full justify-center"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
