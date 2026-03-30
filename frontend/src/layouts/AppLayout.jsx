import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/solicitudes', label: 'Solicitudes' },
    { to: '/admin/vehiculos', label: 'Vehículos' },
    { to: '/admin/conductores', label: 'Conductores' },
    { to: '/admin/documentos', label: 'Documentos' },
    { to: '/admin/novedades', label: 'Novedades' },
    { to: '/admin/combustible', label: 'Combustible' },
  ],
  dependencia: [
    { to: '/solicitudes', label: 'Dashboard' },
    { to: '/solicitudes/nueva', label: 'Nueva Solicitud' },
    { to: '/solicitudes/lista', label: 'Mis Solicitudes' },
  ],
  conductor: [
    { to: '/servicios', label: 'Dashboard' },
    { to: '/servicios/lista', label: 'Mis Servicios' },
    { to: '/servicios/combustible', label: 'Combustible' },
    { to: '/servicios/novedades', label: 'Novedades' },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS[user?.rol] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-800 mr-4 text-sm">Alcaldía de Sopó</span>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/solicitudes' || item.to === '/admin' || item.to === '/servicios'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{user?.nombre}</span>
              <button onClick={logout} className="text-xs text-red-500 hover:underline">Salir</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
