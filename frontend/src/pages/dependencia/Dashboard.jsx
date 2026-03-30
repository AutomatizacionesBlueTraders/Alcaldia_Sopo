import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';

const ESTADOS_DISPLAY = ['ENVIADA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA', 'CONFIRMADA', 'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'TRANSFERIDA'];

export default function DependenciaDashboard() {
  const [data, setData] = useState({ estados: {}, recientes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/solicitudes/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
        <Link to="/solicitudes/nueva" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700">
          + Nueva Solicitud
        </Link>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {ESTADOS_DISPLAY.map(estado => (
          <div key={estado} className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-2xl font-bold text-gray-800">{data.estados[estado] || 0}</p>
            <EstadoBadge estado={estado} />
          </div>
        ))}
      </div>

      {/* Recientes */}
      <h3 className="font-medium text-gray-700 mb-3">Solicitudes recientes</h3>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Destino</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.recientes.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/solicitudes/${s.id}`} className="text-primary-600 hover:underline">{s.id}</Link>
                </td>
                <td className="px-4 py-2">{s.fecha_servicio}</td>
                <td className="px-4 py-2">{s.destino}</td>
                <td className="px-4 py-2"><EstadoBadge estado={s.estado} /></td>
              </tr>
            ))}
            {data.recientes.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-400">Sin solicitudes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
