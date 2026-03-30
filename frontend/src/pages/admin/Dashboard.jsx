import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/calendario', { params: { fecha: hoy } })
    ]).then(([d, s]) => {
      setData(d.data);
      setServicios(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  const cards = [
    { label: 'Nuevas hoy', value: data?.nuevas_hoy || 0, color: 'text-blue-600' },
    { label: 'Pendientes prog.', value: data?.estados?.PENDIENTE_PROGRAMACION || 0, color: 'text-yellow-600' },
    { label: 'Programadas', value: data?.estados?.PROGRAMADA || 0, color: 'text-purple-600' },
    { label: 'Confirmadas', value: data?.estados?.CONFIRMADA || 0, color: 'text-green-600' },
    { label: 'En ejecución', value: data?.estados?.EN_EJECUCION || 0, color: 'text-indigo-600' },
    { label: 'Servicios hoy', value: data?.servicios_hoy || 0, color: 'text-emerald-600' },
    { label: 'Docs por vencer', value: data?.docs_por_vencer || 0, color: 'text-red-600' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-lg shadow-sm border p-3 text-center">
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <Link to="/admin/solicitudes" className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">Ver solicitudes</Link>
        <Link to="/admin/vehiculos" className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Gestionar flota</Link>
      </div>

      <h3 className="font-medium text-gray-700 mb-3">Servicios de hoy</h3>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Hora</th>
              <th className="px-4 py-2">Destino</th>
              <th className="px-4 py-2">Vehículo</th>
              <th className="px-4 py-2">Conductor</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">Sin servicios hoy</td></tr>
            ) : servicios.map(s => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2">{s.hora_inicio} - {s.hora_fin}</td>
                <td className="px-4 py-2">{s.destino}</td>
                <td className="px-4 py-2">{s.placa} {s.marca}</td>
                <td className="px-4 py-2">{s.conductor_nombre}</td>
                <td className="px-4 py-2 text-xs">{s.estado_solicitud}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
