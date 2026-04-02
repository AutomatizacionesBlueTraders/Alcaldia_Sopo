import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';

export default function DetalleConductor() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendientes');

  useEffect(() => { cargar(); }, [id]);

  async function cargar() {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/admin/conductores/${id}/historial`);
      setData(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!data) return <p className="text-red-500">Conductor no encontrado</p>;

  const { conductor, completados, pendientes, vehiculo_actual } = data;

  const estadoColor = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-600',
    vacaciones: 'bg-blue-100 text-blue-700',
    incapacidad: 'bg-red-100 text-red-700',
  };

  const servicios = tab === 'pendientes' ? pendientes : completados;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/admin/conductores" className="text-primary-600 hover:underline text-sm mb-4 inline-block">&larr; Volver a conductores</Link>

      {/* Info del conductor */}
      <div className="bg-white rounded-lg shadow-sm border p-5 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{conductor.nombre}</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-500">Teléfono:</span> {conductor.telefono}</p>
              <p><span className="font-medium text-gray-500">Licencia:</span> {conductor.licencia}</p>
              <p><span className="font-medium text-gray-500">Venc. Licencia:</span> {conductor.vencimiento_licencia?.split('T')[0]}</p>
              <p>
                <span className="font-medium text-gray-500">Estado:</span>{' '}
                <span className={`text-xs px-2 py-0.5 rounded ${estadoColor[conductor.estado] || 'bg-gray-100'}`}>{conductor.estado}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Servicios realizados</p>
            <p className="text-2xl font-bold text-primary-600">{completados.length}</p>
          </div>
        </div>

        {vehiculo_actual && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-sm font-medium text-gray-500 mb-1">Vehículo asignado actualmente</p>
            <Link to={`/admin/vehiculos/${vehiculo_actual.id}`} className="text-sm text-primary-600 hover:underline">
              {vehiculo_actual.placa} — {vehiculo_actual.marca} {vehiculo_actual.modelo}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab('pendientes')}
          className={`px-4 py-2 rounded-t text-sm font-medium ${tab === 'pendientes' ? 'bg-white border border-b-0 text-primary-600' : 'bg-gray-100 text-gray-500'}`}
        >
          Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`px-4 py-2 rounded-t text-sm font-medium ${tab === 'historial' ? 'bg-white border border-b-0 text-primary-600' : 'bg-gray-100 text-gray-500'}`}
        >
          Historial ({completados.length})
        </button>
      </div>

      {/* Tabla de servicios */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Horario</th>
              <th className="px-4 py-2">Origen</th>
              <th className="px-4 py-2">Destino</th>
              <th className="px-4 py-2">Vehículo</th>
              <th className="px-4 py-2">Estado</th>
              {tab === 'historial' && <th className="px-4 py-2">KM</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 ? (
              <tr><td colSpan={tab === 'historial' ? 8 : 7} className="px-4 py-6 text-center text-gray-400">
                {tab === 'pendientes' ? 'Sin servicios pendientes' : 'Sin servicios realizados'}
              </td></tr>
            ) : servicios.map(s => (
              <tr key={s.asignacion_id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{s.fecha?.split('T')[0]}</td>
                <td className="px-4 py-2 text-xs">{s.hora_inicio?.substring(0, 5)} - {s.hora_fin?.substring(0, 5)}</td>
                <td className="px-4 py-2">{s.origen}</td>
                <td className="px-4 py-2">{s.destino}</td>
                <td className="px-4 py-2">
                  <Link to={`/admin/vehiculos/${s.vehiculo_id}`} className="text-primary-600 hover:underline">
                    {s.placa}
                  </Link>
                </td>
                <td className="px-4 py-2"><EstadoBadge estado={s.estado_solicitud} /></td>
                {tab === 'historial' && (
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {s.km_inicial && s.km_final ? `${parseFloat(s.km_final - s.km_inicial).toLocaleString()} km` : '—'}
                  </td>
                )}
                <td className="px-4 py-2">
                  <Link to={`/admin/solicitudes/${s.solicitud_id}`} className="text-primary-600 hover:underline text-xs">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
