import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';

const ESTADOS = ['', 'ENVIADA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA', 'CONFIRMADA', 'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'TRANSFERIDA'];

export default function ListaSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ estado: '', fecha_desde: '', fecha_hasta: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, [page, filtros]);

  async function cargar() {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filtros };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/solicitudes', { params });
      setSolicitudes(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Mis Solicitudes</h2>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select value={filtros.estado} onChange={e => { setFiltros({...filtros, estado: e.target.value}); setPage(1); }}
            className="border rounded px-3 py-1.5 text-sm">
            <option value="">Todos</option>
            {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input type="date" value={filtros.fecha_desde} onChange={e => { setFiltros({...filtros, fecha_desde: e.target.value}); setPage(1); }}
            className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input type="date" value={filtros.fecha_hasta} onChange={e => { setFiltros({...filtros, fecha_hasta: e.target.value}); setPage(1); }}
            className="border rounded px-3 py-1.5 text-sm" />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Origen</th>
              <th className="px-4 py-2">Destino</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Canal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : solicitudes.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">Sin solicitudes</td></tr>
            ) : solicitudes.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/solicitudes/${s.id}`} className="text-primary-600 hover:underline">{s.id}</Link>
                </td>
                <td className="px-4 py-2">{s.fecha_servicio}</td>
                <td className="px-4 py-2 truncate max-w-[150px]">{s.origen}</td>
                <td className="px-4 py-2 truncate max-w-[150px]">{s.destino}</td>
                <td className="px-4 py-2"><EstadoBadge estado={s.estado} /></td>
                <td className="px-4 py-2 text-xs text-gray-400">{s.canal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-30">Anterior</button>
          <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-30">Siguiente</button>
        </div>
      )}
    </div>
  );
}
