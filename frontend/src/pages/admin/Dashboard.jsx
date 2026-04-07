import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import {
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlayIcon,
  TruckIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const CARD_CONFIG = [
  { key: 'nuevas_hoy',     label: 'Nuevas hoy',       icon: PlusIcon,          bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    color: 'text-blue-700',    iconColor: 'text-blue-600' },
  { key: 'pend_prog',      label: 'Pend. programación', icon: ClockIcon,        bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   color: 'text-amber-700',   iconColor: 'text-amber-600' },
  { key: 'programadas',    label: 'Programadas',       icon: CalendarIcon,      bg: 'bg-purple-50',  iconBg: 'bg-purple-100',  color: 'text-purple-700',  iconColor: 'text-purple-600' },
  { key: 'confirmadas',    label: 'Confirmadas',       icon: CheckCircleIcon,   bg: 'bg-green-50',   iconBg: 'bg-green-100',   color: 'text-green-700',   iconColor: 'text-green-600' },
  { key: 'en_ejecucion',   label: 'En ejecución',      icon: PlayIcon,          bg: 'bg-indigo-50',  iconBg: 'bg-indigo-100',  color: 'text-indigo-700',  iconColor: 'text-indigo-600' },
  { key: 'servicios_hoy',  label: 'Servicios hoy',     icon: TruckIcon,         bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', color: 'text-emerald-700', iconColor: 'text-emerald-600' },
  { key: 'docs_vencer',    label: 'Docs por vencer',   icon: DocumentTextIcon,  bg: 'bg-red-50',     iconBg: 'bg-red-100',     color: 'text-red-700',     iconColor: 'text-red-600' },
];

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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  );

  const values = {
    nuevas_hoy: data?.nuevas_hoy || 0,
    pend_prog: data?.estados?.PENDIENTE_PROGRAMACION || 0,
    programadas: data?.estados?.PROGRAMADA || 0,
    confirmadas: data?.estados?.CONFIRMADA || 0,
    en_ejecucion: data?.estados?.EN_EJECUCION || 0,
    servicios_hoy: data?.servicios_hoy || 0,
    docs_vencer: data?.docs_por_vencer || 0,
  };

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
        {CARD_CONFIG.map(c => (
          <div key={c.key} className={`${c.bg} rounded-xl p-4 border border-transparent`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`${c.iconBg} w-9 h-9 rounded-lg flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{values[c.key]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
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
                <th className="table-cell">Hora</th>
                <th className="table-cell">Destino</th>
                <th className="table-cell">Vehículo</th>
                <th className="table-cell">Conductor</th>
                <th className="table-cell">Estado</th>
              </tr>
            </thead>
            <tbody>
              {servicios.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-gray-400">
                  <TruckIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Sin servicios programados para hoy
                </td></tr>
              ) : servicios.map(s => (
                <tr key={s.id} className="table-row">
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
