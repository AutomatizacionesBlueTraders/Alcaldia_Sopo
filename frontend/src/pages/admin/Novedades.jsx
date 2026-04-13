import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, FunnelIcon, InboxIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

export default function Novedades() {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ estado: '', urgencia: '' });

  useEffect(() => { cargar(); }, [filtro]);

  async function cargar() {
    setLoading(true);
    const params = {};
    if (filtro.estado) params.estado = filtro.estado;
    if (filtro.urgencia) params.urgencia = filtro.urgencia;
    const { data } = await api.get('/admin/novedades', { params });
    setNovedades(data);
    setLoading(false);
  }

  async function cambiarEstado(id, estado) {
    await api.patch(`/admin/novedades/${id}`, { estado });
    cargar();
  }

  const urgenciaColor = (u) => {
    if (u === 'critica') return 'bg-red-100 text-red-700';
    if (u === 'alta') return 'bg-orange-100 text-orange-700';
    if (u === 'media') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <div>
        <h2 className="page-title flex items-center gap-2">
          <ExclamationTriangleIcon className="w-6 h-6 text-primary-600" />
          Novedades
        </h2>
        <p className="text-sm text-gray-500 mt-1">Reportes de novedades de vehiculos por conductores</p>
      </div>

      <div className="flex gap-3 items-center">
        <FunnelIcon className="w-4 h-4 text-gray-400" />
        <select value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})} className="input-field w-auto">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En revision</option>
          <option value="en_mantenimiento">En mantenimiento</option>
          <option value="resuelto">Resuelto</option>
        </select>
        <select value={filtro.urgencia} onChange={e => setFiltro({...filtro, urgencia: e.target.value})} className="input-field w-auto">
          <option value="">Todas las urgencias</option>
          <option value="critica">Critica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Placa</th>
              <th className="table-cell">Conductor</th>
              <th className="table-cell">Tipo</th>
              <th className="table-cell">Urgencia</th>
              <th className="table-cell">Puede operar</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
              </td></tr>
            ) : novedades.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-400">
                <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Sin novedades
              </td></tr>
            ) : novedades.map(n => (
              <tr key={n.id} className="table-row">
                <td className="table-cell font-medium">{n.placa}</td>
                <td className="table-cell">{n.conductor_nombre}</td>
                <td className="table-cell">{n.tipo}</td>
                <td className="table-cell"><span className={`text-xs px-2 py-0.5 rounded-full ${urgenciaColor(n.urgencia)}`}>{n.urgencia}</span></td>
                <td className="table-cell text-xs">{n.puede_operar}</td>
                <td className="table-cell text-xs">{n.estado}</td>
                <td className="table-cell">
                  <select value={n.estado} onChange={e => cambiarEstado(n.id, e.target.value)} className="input-field w-auto py-1.5 text-xs">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En revision</option>
                    <option value="en_mantenimiento">A mantenimiento</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
