import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserIcon, ArrowLeftIcon, ClockIcon, CheckCircleIcon, InboxIcon } from '@heroicons/react/24/outline';
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

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
    </div>
  );
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/admin/conductores" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a conductores
      </Link>

      {/* Info del conductor */}
      <div className="card p-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="page-title flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-primary-600" />
              {conductor.nombre}
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-500">Telefono:</span> {conductor.telefono}</p>
              <p><span className="font-medium text-gray-500">Licencia:</span> {conductor.licencia}</p>
              <p><span className="font-medium text-gray-500">Venc. Licencia:</span> {conductor.vencimiento_licencia?.split('T')[0]}</p>
              <p>
                <span className="font-medium text-gray-500">Estado:</span>{' '}
                <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor[conductor.estado] || 'bg-gray-100'}`}>{conductor.estado}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Servicios realizados</p>
            <p className="text-2xl font-bold text-primary-600">{completados.length}</p>
          </div>
        </div>

        {vehiculo_actual && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Vehiculo asignado actualmente</p>
            <Link to={`/admin/vehiculos/${vehiculo_actual.id}`} className="text-sm text-primary-600 hover:underline">
              {vehiculo_actual.placa} — {vehiculo_actual.marca} {vehiculo_actual.modelo}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setTab('pendientes')}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'pendientes' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          <ClockIcon className="w-4 h-4" />
          Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'historial' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          Historial ({completados.length})
        </button>
      </div>

      {/* Tabla de servicios */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Fecha</th>
              <th className="table-cell">Horario</th>
              <th className="table-cell">Origen</th>
              <th className="table-cell">Destino</th>
              <th className="table-cell">Vehiculo</th>
              <th className="table-cell">Estado</th>
              {tab === 'historial' && <th className="table-cell">KM</th>}
              <th className="table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 ? (
              <tr><td colSpan={tab === 'historial' ? 8 : 7} className="px-5 py-8 text-center text-gray-400">
                <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                {tab === 'pendientes' ? 'Sin servicios pendientes' : 'Sin servicios realizados'}
              </td></tr>
            ) : servicios.map(s => (
              <tr key={s.asignacion_id} className="table-row">
                <td className="table-cell">{s.fecha?.split('T')[0]}</td>
                <td className="table-cell text-xs">{s.hora_inicio?.substring(0, 5)} - {s.hora_fin?.substring(0, 5)}</td>
                <td className="table-cell">{s.origen}</td>
                <td className="table-cell">{s.destino}</td>
                <td className="table-cell">
                  <Link to={`/admin/vehiculos/${s.vehiculo_id}`} className="text-primary-600 hover:underline">
                    {s.placa}
                  </Link>
                </td>
                <td className="table-cell"><EstadoBadge estado={s.estado_solicitud} /></td>
                {tab === 'historial' && (
                  <td className="table-cell text-xs text-gray-500">
                    {s.km_inicial && s.km_final ? `${parseFloat(s.km_final - s.km_inicial).toLocaleString()} km` : '—'}
                  </td>
                )}
                <td className="table-cell">
                  <Link to={`/admin/solicitudes/${s.solicitud_id}`} className="text-primary-600 hover:underline text-xs font-medium">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
