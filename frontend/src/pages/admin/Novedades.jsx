import { useState, useEffect } from 'react';
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
    <div>
      <h2 className="text-lg font-semibold mb-4">Novedades</h2>

      <div className="flex gap-3 mb-4">
        <select value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En revisión</option>
          <option value="en_mantenimiento">En mantenimiento</option>
          <option value="resuelto">Resuelto</option>
        </select>
        <select value={filtro.urgencia} onChange={e => setFiltro({...filtro, urgencia: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todas las urgencias</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Placa</th>
              <th className="px-4 py-2">Conductor</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Urgencia</th>
              <th className="px-4 py-2">Puede operar</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : novedades.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">Sin novedades</td></tr>
            ) : novedades.map(n => (
              <tr key={n.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{n.placa}</td>
                <td className="px-4 py-2">{n.conductor_nombre}</td>
                <td className="px-4 py-2">{n.tipo}</td>
                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded ${urgenciaColor(n.urgencia)}`}>{n.urgencia}</span></td>
                <td className="px-4 py-2 text-xs">{n.puede_operar}</td>
                <td className="px-4 py-2 text-xs">{n.estado}</td>
                <td className="px-4 py-2">
                  <select value={n.estado} onChange={e => cambiarEstado(n.id, e.target.value)} className="border rounded px-2 py-1 text-xs">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En revisión</option>
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
