import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';

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

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Mi Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-2xl font-bold text-indigo-600">{data.servicios_hoy.length}</p>
          <p className="text-xs text-gray-500">Servicios hoy</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-2xl font-bold text-orange-600">{data.novedades_pendientes}</p>
          <p className="text-xs text-gray-500">Novedades pendientes</p>
        </div>
        {vehiculo && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-lg font-bold text-gray-800">{vehiculo.placa}</p>
            <p className="text-xs text-gray-500">{vehiculo.marca} {vehiculo.modelo} — {parseFloat(vehiculo.km_actual || 0).toLocaleString()} km</p>
          </div>
        )}
      </div>

      <h3 className="font-medium text-gray-700 mb-3">Servicios de hoy</h3>
      <div className="space-y-3">
        {data.servicios_hoy.length === 0 ? (
          <p className="text-gray-400 text-sm">No tienes servicios para hoy.</p>
        ) : data.servicios_hoy.map(s => (
          <Link key={s.id} to={`/servicios/${s.id}`}
            className="block bg-white rounded-lg shadow-sm border p-4 hover:border-primary-300 transition">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{s.hora_inicio} — {s.destino}</p>
                <p className="text-sm text-gray-500">{s.origen} → {s.destino}</p>
                <p className="text-xs text-gray-400">{s.placa} {s.marca}</p>
              </div>
              <EstadoBadge estado={s.estado_solicitud} />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/servicios/lista" className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Ver todos mis servicios</Link>
        <Link to="/servicios/combustible" className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Registrar combustible</Link>
        <Link to="/servicios/novedades" className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Reportar novedad</Link>
      </div>
    </div>
  );
}
