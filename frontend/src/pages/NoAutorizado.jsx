import { useNavigate } from 'react-router-dom';

export default function NoAutorizado() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <p className="text-gray-600 mb-4">No tienes permiso para acceder a esta página</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
