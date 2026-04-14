import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlayIcon,
  TruckIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  BeakerIcon,
  XCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';

function tiempoRelativo(fecha) {
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (diff < 60) return 'hace instantes';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function buildCards(hoy) {
  return [
    { key: 'pend_prog',      label: 'Pend. programacion', icon: ClockIcon,        bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   color: 'text-amber-700',   iconColor: 'text-amber-600', to: '/admin/solicitudes?estado=PENDIENTE_PROGRAMACION' },
    { key: 'programadas',    label: 'Programadas',       icon: CalendarIcon,      bg: 'bg-purple-50',  iconBg: 'bg-purple-100',  color: 'text-purple-700',  iconColor: 'text-purple-600', to: '/admin/solicitudes?estado=PROGRAMADA' },
    { key: 'confirmadas',    label: 'Confirmadas',       icon: CheckCircleIcon,   bg: 'bg-green-50',   iconBg: 'bg-green-100',   color: 'text-green-700',   iconColor: 'text-green-600', to: '/admin/solicitudes?estado=CONFIRMADA' },
    { key: 'en_ejecucion',   label: 'En ejecucion',      icon: PlayIcon,          bg: 'bg-indigo-50',  iconBg: 'bg-indigo-100',  color: 'text-indigo-700',  iconColor: 'text-indigo-600', to: '/admin/solicitudes?estado=EN_EJECUCION' },
    { key: 'servicios_hoy',  label: 'Servicios hoy',     icon: TruckIcon,         bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', color: 'text-emerald-700', iconColor: 'text-emerald-600', to: `/admin/solicitudes?fecha_desde=${hoy}&fecha_hasta=${hoy}` },
    { key: 'docs_vencer',    label: 'Docs por vencer',   icon: DocumentTextIcon,  bg: 'bg-red-50',     iconBg: 'bg-red-100',     color: 'text-red-700',     iconColor: 'text-red-600',    to: '/admin/documentos?por_vencer=1' },
    { key: 'aceite_alerta',  label: 'Aceite por cambiar', icon: BeakerIcon,       bg: 'bg-orange-50',  iconBg: 'bg-orange-100',  color: 'text-orange-700',  iconColor: 'text-orange-600', to: '/admin/vehiculos' },
  ];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revisandoId, setRevisandoId] = useState(null);

  async function cargar() {
    const hoy = new Date().toLocaleDateString('en-CA');
    const [d, s] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/calendario', { params: { fecha: hoy } })
    ]);
    setData(d.data);
    setServicios(s.data);
  }

  useEffect(() => {
    cargar().catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function marcarRevisada(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setRevisandoId(id);
    try {
      await api.patch(`/admin/solicitudes/${id}/marcar-revisada`);
      setData(prev => ({
        ...prev,
        canceladas_24h: prev.canceladas_24h.filter(c => c.id !== id)
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al marcar revisada');
    } finally {
      setRevisandoId(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  );

  const values = {
    pend_prog: data?.estados?.PENDIENTE_PROGRAMACION || 0,
    programadas: data?.estados?.PROGRAMADA || 0,
    confirmadas: data?.estados?.CONFIRMADA || 0,
    en_ejecucion: data?.estados?.EN_EJECUCION || 0,
    servicios_hoy: data?.servicios_hoy || 0,
    docs_vencer: data?.docs_por_vencer || 0,
    aceite_alerta: data?.aceite_alerta || 0,
  };

  const mes = data?.mes || {};
  const mesNombre = MESES[new Date().getMonth()];
  const mesAnio = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Resumen general del sistema de transporte</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/solicitudes" className="btn-primary">
            <ClipboardIcon className="w-4 h-4" />
            Ver solicitudes
          </Link>
          <Link to="/admin/vehiculos" className="btn-secondary">
            <TruckIcon className="w-4 h-4" />
            Gestionar flota
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {buildCards(new Date().toLocaleDateString('en-CA')).map(c => {
          const inner = (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className={`${c.iconBg} w-9 h-9 rounded-lg flex items-center justify-center`}>
                  <c.icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${c.color}`}>{values[c.key]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </>
          );
          return c.to ? (
            <Link key={c.key} to={c.to} className={`${c.bg} rounded-xl p-4 border border-transparent hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer block`}>
              {inner}
            </Link>
          ) : (
            <div key={c.key} className={`${c.bg} rounded-xl p-4 border border-transparent`}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Cancelaciones pendientes de revisión */}
      {data?.canceladas_24h?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <XCircleIcon className="w-6 h-6 text-red-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </div>
            <h3 className="section-title text-red-700 !mb-0">
              Cancelaciones sin revisar ({data.canceladas_24h.length})
            </h3>
            <span className="text-xs text-red-500 ml-auto">Marca cada una como revisada para retirarla del panel</span>
          </div>
          <div className="space-y-2">
            {data.canceladas_24h.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-red-100 hover:border-red-300 hover:shadow-sm transition-all"
              >
                <Link to={`/admin/solicitudes/${c.id}`} className="flex-1 min-w-0 block">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-red-700">#{c.id}</span>
                    <span className="text-xs text-gray-500">{c.dependencia_nombre || 'Sin dependencia'}</span>
                    {c.canal === 'whatsapp' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        <ChatBubbleLeftEllipsisIcon className="w-3 h-3" /> WhatsApp
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{tiempoRelativo(c.updated_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{c.origen} → {c.destino}</p>
                  {c.motivo_cancelacion && (
                    <p className="text-xs text-red-600 mt-1 truncate italic">"{c.motivo_cancelacion}"</p>
                  )}
                </Link>
                <button
                  onClick={(e) => marcarRevisada(e, c.id)}
                  disabled={revisandoId === c.id}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  title="Marcar como revisada"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {revisandoId === c.id ? 'Marcando...' : 'Revisada'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen del mes */}
      <div>
        <h3 className="section-title flex items-center gap-2 mb-4">
          <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
          Resumen de {mesNombre} {mesAnio}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Solicitudes del mes</p>
            <p className="text-2xl font-bold text-gray-800">{mes.solicitudes_total || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Finalizadas</p>
            <p className="text-2xl font-bold text-emerald-600">{mes.solicitudes?.FINALIZADA || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{mes.solicitudes?.CANCELADA || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Tanqueos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-primary-600">{mes.combustible_tanqueos || 0}</p>
              <span className="text-xs text-gray-400">{(mes.combustible_galones || 0).toFixed(1)} gal</span>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-1">Gasto combustible</p>
            <p className="text-2xl font-bold text-primary-600">${(mes.combustible_valor || 0).toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>

      {/* Servicios de hoy */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Servicios de hoy</h3>
          <Link to="/admin/solicitudes" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todos <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell">ID</th>
                <th className="table-cell">Hora</th>
                <th className="table-cell">Destino</th>
                <th className="table-cell">Vehiculo</th>
                <th className="table-cell">Conductor</th>
                <th className="table-cell">Estado</th>
              </tr>
            </thead>
            <tbody>
              {servicios.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-400">
                  <TruckIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Sin servicios programados para hoy
                </td></tr>
              ) : servicios.map(s => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/admin/solicitudes/${s.solicitud_id}`)}
                  className="table-row cursor-pointer hover:bg-gray-50"
                >
                  <td className="table-cell">
                    <span className="text-primary-600 font-semibold">#{s.solicitud_id}</span>
                  </td>
                  <td className="table-cell font-medium">{s.hora_inicio?.substring(0, 5)} - {s.hora_fin?.substring(0, 5)}</td>
                  <td className="table-cell">{s.destino}</td>
                  <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.placa}</span> {s.marca}</td>
                  <td className="table-cell">{s.conductor_nombre}</td>
                  <td className="table-cell"><EstadoBadge estado={s.estado_solicitud} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClipboardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
    </svg>
  );
}
