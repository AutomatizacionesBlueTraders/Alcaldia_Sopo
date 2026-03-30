import { useAuth } from '../../context/AuthContext';

export default function DependenciaDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg text-gray-800">Panel Dependencia</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.nombre}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Salir</button>
        </div>
      </nav>
      <main className="p-6">
        <h2 className="text-xl font-semibold mb-4">Mis Solicitudes</h2>
        <p className="text-gray-600">Panel de dependencia — próximamente solicitudes y formularios.</p>
      </main>
    </div>
  );
}
