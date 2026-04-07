import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import {
  TruckIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ClockIcon,
  BoltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function ConductorDashboard() {
  const [data, setData] = useState({ servicios_hoy: [], novedades_pendientes: 0 });
  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/conductor/dashboard'),
      api.get('/conductor/vehiculo')
    ]).then(([d, v]) => {
      setData(d.data);
      setVehiculo(v.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="page-title">Mi Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu actividad como conductor</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-600">Servicios hoy</span>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{data.servicios_hoy.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600">Novedades pendientes</span>
          </div>
          <p className="text-3xl font-bold text-orange-700">{data.novedades_pendientes}</p>
        </div>
        {vehiculo && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-200 w-10 h-10 rounded-lg flex items-center justify-center">
                <TruckIcon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600">Mi vehículo</span>
            </div>
            <p className="text-xl font-bold text-gray-800 font-mono">{vehiculo.placa}</p>
            <p className="text-xs text-gray-500 mt-0.5">{vehiculo.marca} {vehiculo.modelo} &mdash; {parseFloat(vehiculo.km_actual || 0).toLocaleString()} km</p>
          </div>
        )}
      </div>

      {/* Servicios de hoy */}
      <div>
        <h3 className="section-title mb-4">Servicios de hoy</h3>
        <div className="space-y-3">
          {data.servicios_hoy.length === 0 ? (
            <div className="card p-10 text-center">
              <TruckIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No tienes servicios para hoy.</p>
            </div>
          ) : data.servicios_hoy.map(s => (
            <Link key={s.id} to={`/servicios/${s.id}`}
              className="card card-hover block p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{s.hora_inicio?.substring(0, 5)}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-700">{s.destino}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    {s.origen} <ArrowRightIcon className="w-3 h-3" /> {s.destino}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <TruckIcon className="w-3.5 h-3.5" />
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s.placa}</span>
                    {s.marca}
                  </div>
                </div>
                <EstadoBadge estado={s.estado_solicitud} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-3">
        <Link to="/servicios/lista" className="btn-secondary">
          <ClockIcon className="w-4 h-4" />
          Todos mis servicios
        </Link>
        <Link to="/servicios/combustible" className="btn-secondary">
          <BoltIcon className="w-4 h-4" />
          Registrar combustible
        </Link>
        <Link to="/servicios/novedades" className="btn-secondary">
          <ExclamationTriangleIcon className="w-4 h-4" />
          Reportar novedad
        </Link>
      </div>
    </div>
  );
}
