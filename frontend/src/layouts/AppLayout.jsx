import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const NAV_ITEMS = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: HomeIcon },
    { to: '/admin/solicitudes', label: 'Solicitudes', icon: ClipboardDocumentListIcon },
    { to: '/admin/vehiculos', label: 'Vehículos', icon: TruckIcon },
    { to: '/admin/conductores', label: 'Conductores', icon: UsersIcon },
    { to: '/admin/novedades', label: 'Novedades', icon: ExclamationTriangleIcon },
    { to: '/admin/combustible', label: 'Combustible', icon: BoltIcon },
  ],
  dependencia: [
    { to: '/solicitudes', label: 'Dashboard', icon: HomeIcon },
    { to: '/solicitudes/nueva', label: 'Nueva Solicitud', icon: PlusCircleIcon },
    { to: '/solicitudes/lista', label: 'Mis Solicitudes', icon: ClipboardDocumentListIcon },
    { to: '/solicitudes/conocimiento', label: 'Info / FAQ', icon: InformationCircleIcon },
  ],
  conductor: [
    { to: '/servicios', label: 'Dashboard', icon: HomeIcon },
    { to: '/servicios/lista', label: 'Mis Servicios', icon: WrenchScrewdriverIcon },
    { to: '/servicios/combustible', label: 'Combustible', icon: BoltIcon },
    { to: '/servicios/novedades', label: 'Novedades', icon: ExclamationTriangleIcon },
  ],
};

const ROL_LABELS = {
  admin: 'Administración',
  dependencia: 'Dependencia',
  conductor: 'Conductor',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS[user?.rol] || [];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo / branding */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Alcaldía de Sopó</h1>
            <p className="text-primary-300 text-xs">Transporte Municipal</p>
          </div>
        </div>
      </div>

      {/* Rol badge */}
      <div className="px-5 mb-4">
        <span className="inline-block bg-accent-500/20 text-accent-200 text-xs font-medium px-2.5 py-1 rounded-full">
          {ROL_LABELS[user?.rol] || user?.rol}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/solicitudes' || item.to === '/admin' || item.to === '/servicios'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User / logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {(user?.nombre || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.nombre}</p>
            <p className="text-primary-300 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-primary-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gradient-to-b from-primary-700 via-primary-600 to-primary-700">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-700 via-primary-600 to-primary-700 z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 p-1 text-primary-300 hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <span className="font-bold text-sm text-primary-700">Alcaldía de Sopó</span>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 text-xs font-bold">
                {(user?.nombre || '?')[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
