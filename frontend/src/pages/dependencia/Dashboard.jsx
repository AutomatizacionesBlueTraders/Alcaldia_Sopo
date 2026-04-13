import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import { PlusIcon, ArrowRightIcon, ClipboardDocumentListIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ESTADOS_DISPLAY = ['RECIBIDA', 'PENDIENTE_PROGRAMACION', 'PROGRAMADA', 'CONFIRMADA', 'EN_EJECUCION', 'FINALIZADA', 'CANCELADA'];

const ESTADO_STYLES = {
  RECIBIDA:                   { bg: 'bg-cyan-50',    border: 'border-cyan-100' },
  PENDIENTE_PROGRAMACION:     { bg: 'bg-amber-50',   border: 'border-amber-100' },
  PROGRAMADA:                 { bg: 'bg-purple-50',  border: 'border-purple-100' },
  CONFIRMADA:                 { bg: 'bg-green-50',   border: 'border-green-100' },
  EN_EJECUCION:               { bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  FINALIZADA:                 { bg: 'bg-emerald-50', border: 'border-emerald-100' },
  CANCELADA:                  { bg: 'bg-red-50',     border: 'border-red-100' },
};

export default function DependenciaDashboard() {
  const [data, setData] = useState({ estados: {}, recientes: [], mes: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/solicitudes/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  );

  const mes = data.mes || {};
  const mesNombre = MESES[new Date().getMonth()];
  const mesAnio = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Estado de tus solicitudes de transporte</p>
        </div>
        <Link to="/solicitudes/nueva" className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Nueva Solicitud
        </Link>
      </div>

      {/* Contadores por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ESTADOS_DISPLAY.map(estado => {
          const style = ESTADO_STYLES[estado] || { bg: 'bg-gray-50', border: 'border-gray-100' };
          return (
            <div key={estado} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
              <p className="text-2xl font-bold text-gray-800">{data.estados[estado] || 0}</p>
              <div className="mt-1">
                <EstadoBadge estado={estado} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen del mes */}
      <div>
        <h3 className="section-title flex items-center gap-2 mb-4">
          <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
          Resumen de {mesNombre} {mesAnio}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Solicitudes del mes</p>
            <p className="text-2xl font-bold text-gray-800">{mes.solicitudes_total || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Recibidas</p>
            <p className="text-2xl font-bold text-cyan-600">{mes.solicitudes?.RECIBIDA || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Finalizadas</p>
            <p className="text-2xl font-bold text-emerald-600">{mes.solicitudes?.FINALIZADA || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{mes.solicitudes?.CANCELADA || 0}</p>
          </div>
        </div>
      </div>

      {/* Solicitudes recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Solicitudes recientes</h3>
          <Link to="/solicitudes/lista" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell">#</th>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Origen</th>
                <th className="table-cell">Destino</th>
                <th className="table-cell">Solicitante</th>
                <th className="table-cell">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.recientes.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <Link to={`/solicitudes/${s.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                      #{s.id}
                    </Link>
                  </td>
                  <td className="table-cell">{s.fecha_servicio?.substring(0, 10)}</td>
                  <td className="table-cell">{s.origen}</td>
                  <td className="table-cell">{s.destino}</td>
                  <td className="table-cell">{s.nombre_solicitante || s.contacto_nombre || '--'}</td>
                  <td className="table-cell"><EstadoBadge estado={s.estado} /></td>
                </tr>
              ))}
              {data.recientes.length === 0 && (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-400">
                  <ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No tienes solicitudes aun
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
