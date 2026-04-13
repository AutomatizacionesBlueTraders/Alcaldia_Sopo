import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import { FunnelIcon, ClipboardDocumentListIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ESTADOS = ['', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA', 'CONFIRMADA', 'EN_EJECUCION', 'FINALIZADA', 'CANCELADA', 'RECHAZADA'];

export default function AdminSolicitudes() {
  const [searchParams] = useSearchParams();
  const [solicitudes, setSolicitudes] = useState([]);
  const [deps, setDeps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    estado: searchParams.get('estado') || '',
    dependencia_id: searchParams.get('dependencia_id') || '',
    canal: searchParams.get('canal') || '',
    fecha_desde: searchParams.get('fecha_desde') || '',
    fecha_hasta: searchParams.get('fecha_hasta') || ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dependencias').then(r => setDeps(r.data));
  }, []);

  useEffect(() => { cargar(); }, [page, filtros]);

  async function cargar() {
    setLoading(true);
    const params = { page, limit: 20, ...filtros };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    const { data } = await api.get('/admin/solicitudes', { params });
    setSolicitudes(data.data);
    setTotal(data.total);
    setLoading(false);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <div>
        <h2 className="page-title">Todas las Solicitudes</h2>
        <p className="text-gray-500 text-sm mt-1">{total} solicitudes en total</p>
      </div>

      {/* Filtros */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Estado</label>
            <select value={filtros.estado} onChange={e => { setFiltros({...filtros, estado: e.target.value}); setPage(1); }}
              className="input-field w-auto min-w-[140px]">
              <option value="">Todos</option>
              {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Dependencia</label>
            <select value={filtros.dependencia_id} onChange={e => { setFiltros({...filtros, dependencia_id: e.target.value}); setPage(1); }}
              className="input-field w-auto min-w-[160px]">
              <option value="">Todas</option>
              {deps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Canal</label>
            <select value={filtros.canal} onChange={e => { setFiltros({...filtros, canal: e.target.value}); setPage(1); }}
              className="input-field w-auto min-w-[110px]">
              <option value="">Todos</option>
              <option value="web">Web</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Desde</label>
            <input type="date" value={filtros.fecha_desde} onChange={e => { setFiltros({...filtros, fecha_desde: e.target.value}); setPage(1); }}
              className="input-field w-auto" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Hasta</label>
            <input type="date" value={filtros.fecha_hasta} onChange={e => { setFiltros({...filtros, fecha_hasta: e.target.value}); setPage(1); }}
              className="input-field w-auto" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">#</th>
              <th className="table-cell">Fecha</th>
              <th className="table-cell">Dependencia</th>
              <th className="table-cell">Ruta</th>
              <th className="table-cell">Pax</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">Canal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-5 py-10 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
              </td></tr>
            ) : solicitudes.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">
                <ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Sin solicitudes
              </td></tr>
            ) : solicitudes.map(s => (
              <tr key={s.id} className="table-row">
                <td className="table-cell">
                  <Link to={`/admin/solicitudes/${s.id}`} className="text-primary-600 hover:text-primary-700 font-semibold">#{s.id}</Link>
                </td>
                <td className="table-cell">{s.fecha_servicio?.substring(0, 10)}</td>
                <td className="table-cell text-xs">{s.dependencia_nombre}</td>
                <td className="table-cell text-xs truncate max-w-[200px]">
                  {s.origen} <span className="text-gray-400 mx-1">&rarr;</span> {s.destino}
                </td>
                <td className="table-cell text-center">{s.pasajeros}</td>
                <td className="table-cell"><EstadoBadge estado={s.estado} /></td>
                <td className="table-cell">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.canal === 'whatsapp' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {s.canal === 'whatsapp' ? 'WA' : 'Web'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary py-2 px-3 disabled:opacity-30">
              <ChevronLeftIcon className="w-4 h-4" /> Anterior
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary py-2 px-3 disabled:opacity-30">
              Siguiente <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
