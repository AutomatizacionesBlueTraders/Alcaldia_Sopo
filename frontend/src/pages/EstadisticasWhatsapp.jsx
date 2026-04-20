import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CloudIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function EstadisticasWhatsapp() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const rutaConversaciones = window.location.pathname.startsWith('/admin')
    ? '/admin/conversaciones'
    : '/solicitudes/conversaciones';

  useEffect(() => {
    api.get('/conversaciones/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  );

  if (!stats) return (
    <div className="card p-8 text-center text-gray-500">
      No se pudieron cargar las estadísticas.
    </div>
  );

  const irAHilo = (telefono) => navigate(`${rutaConversaciones}?telefono=${telefono}`);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <ChartBarIcon className="w-7 h-7 text-primary-600" />
          Estadísticas de WhatsApp
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Basado en mensajes entrantes del bot y su cruce con solicitudes y sesiones.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Mensajes hoy" value={stats.totales.hoy} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Esta semana" value={stats.totales.semana} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Este mes" value={stats.totales.mes} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Personas hoy" value={stats.totales.conversaciones_hoy} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Personas semana" value={stats.totales.conversaciones_semana} color="text-rose-600" bg="bg-rose-50" />
        <StatCard label="Personas mes" value={stats.totales.conversaciones_mes} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={ArrowTrendingUpIcon}
          title="Conversión bot → solicitud"
          value={`${stats.conversion.tasa}%`}
          detail={`${stats.conversion.convirtieron} de ${stats.conversion.total_escribieron} personas que escribieron terminaron creando solicitud (30 días).`}
          color="emerald"
        />
        <KpiCard
          icon={CloudIcon}
          title="Retención 14 días"
          value={`${stats.retencion.tasa}%`}
          detail={`${stats.retencion.volvieron} de ${stats.retencion.total_antiguos} usuarios antiguos volvieron a escribir.`}
          color="blue"
        />
        <KpiCard
          icon={ChatBubbleLeftRightIcon}
          title="Canal de solicitudes (30 días)"
          value={`${stats.por_canal.whatsapp || 0} / ${(stats.por_canal.whatsapp || 0) + (stats.por_canal.web || 0)}`}
          detail={`WhatsApp: ${stats.por_canal.whatsapp || 0} · Web: ${stats.por_canal.web || 0}`}
          color="indigo"
        />
      </div>

      {/* Gráficos día/semana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.por_dia?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Entrantes por día (30 días)</h3>
            <BarChart datos={stats.por_dia} labelKey="dia" />
          </div>
        )}
        {stats.por_semana?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Entrantes por semana (12 sem.)</h3>
            <BarChart datos={stats.por_semana} labelKey="semana" />
          </div>
        )}
      </div>

      {/* Heatmap */}
      {stats.heatmap && (
        <div className="card p-4">
          <h3 className="section-title mb-3 text-base">¿Cuándo escriben? (hora × día, 30 días)</h3>
          <Heatmap datos={stats.heatmap} />
        </div>
      )}

      {/* Atascos + Fricción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.atascos_sesiones?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              Usuarios atascados en el bot
            </h3>
            <p className="text-xs text-gray-500 mb-2">Estados donde hay usuarios sin llegar al final del flujo.</p>
            <RankedList items={stats.atascos_sesiones} labelKey="estado" emptyText="Sin atascos" />
          </div>
        )}
        {stats.posible_friccion?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />
              Conversaciones con posible fricción (7 días)
            </h3>
            <p className="text-xs text-gray-500 mb-2">Más de 10 mensajes enviados. Revisar si el bot les resolvió.</p>
            <ul className="space-y-1.5">
              {stats.posible_friccion.map(c => (
                <li key={c.telefono} className="text-xs flex items-center justify-between gap-2">
                  <button
                    onClick={() => irAHilo(c.telefono)}
                    className="flex items-center gap-2 min-w-0 hover:text-primary-600"
                  >
                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-mono truncate">{c.telefono}</span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-500">{c.mensajes} msg</span>
                    {c.creo_solicitud ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">creó solicitud</span>
                    ) : (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">sin solicitud</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tipos + Opciones + Preguntas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stats.tipos_entrada && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Tipo de mensaje entrante (30 días)</h3>
            <TiposEntrada datos={stats.tipos_entrada} />
          </div>
        )}
        {stats.opciones_menu?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Opciones de menú elegidas</h3>
            <RankedList
              items={stats.opciones_menu}
              labelKey="opcion"
              emptyText="Nadie eligió opciones numéricas"
              renderLabel={(o) => `Opción ${o}`}
            />
          </div>
        )}
        {stats.top_preguntas?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Preguntas / frases repetidas</h3>
            <RankedList
              items={stats.top_preguntas}
              labelKey="pregunta"
              emptyText="Sin preguntas de texto libre aún"
              truncate={60}
            />
          </div>
        )}
      </div>

      {/* Top teléfonos */}
      {stats.top_telefonos?.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title mb-3 text-base">Números más activos (30 días)</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_telefonos.map(t => (
              <button
                key={t.telefono}
                onClick={() => irAHilo(t.telefono)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-sm"
              >
                <PhoneIcon className="w-3.5 h-3.5 text-gray-500" />
                {t.nombre ? (
                  <span className="font-medium">{t.nombre}</span>
                ) : (
                  <span className="font-mono">{t.telefono}</span>
                )}
                {t.nombre && <span className="text-[10px] text-gray-400 font-mono">{t.telefono}</span>}
                <span className="text-xs text-gray-500">({t.total})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-3`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, detail, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <div className={`card p-4 border ${colors[color] || ''}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-6 h-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs opacity-80 mt-2">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function BarChart({ datos, labelKey = 'dia' }) {
  const max = Math.max(1, ...datos.map(d => d.total));
  return (
    <div className="flex items-end gap-1 h-28">
      {datos.map(d => {
        const h = (d.total / max) * 100;
        const etiqueta = d[labelKey];
        return (
          <div
            key={etiqueta}
            className="flex-1 flex flex-col justify-end min-w-0"
            title={`${etiqueta}: ${d.total} msgs · ${d.personas} personas`}
          >
            <div
              className="w-full bg-primary-500 hover:bg-primary-600 rounded-t transition-colors"
              style={{ height: `${h}%`, minHeight: d.total > 0 ? '2px' : '0' }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Heatmap({ datos }) {
  const matriz = Array.from({ length: 7 }, () => Array(24).fill(0));
  let max = 0;
  datos.forEach(d => {
    matriz[d.dia_semana][d.hora] = d.total;
    if (d.total > max) max = d.total;
  });
  max = Math.max(1, max);

  function color(v) {
    if (v === 0) return 'bg-gray-100';
    const r = v / max;
    if (r > 0.75) return 'bg-primary-700';
    if (r > 0.50) return 'bg-primary-500';
    if (r > 0.25) return 'bg-primary-300';
    return 'bg-primary-100';
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex text-[10px] text-gray-400 pl-8">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="w-5 text-center">{h % 6 === 0 ? h : ''}</div>
          ))}
        </div>
        {DIAS.map((dia, i) => (
          <div key={dia} className="flex items-center">
            <div className="w-8 text-[11px] text-gray-500">{dia}</div>
            {matriz[i].map((v, h) => (
              <div
                key={h}
                className={`w-5 h-5 ${color(v)} border border-white`}
                title={`${dia} ${String(h).padStart(2, '0')}:00 → ${v} msgs`}
              />
            ))}
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2 pl-8">
          <span>menos</span>
          <div className="w-3 h-3 bg-gray-100 border border-white" />
          <div className="w-3 h-3 bg-primary-100 border border-white" />
          <div className="w-3 h-3 bg-primary-300 border border-white" />
          <div className="w-3 h-3 bg-primary-500 border border-white" />
          <div className="w-3 h-3 bg-primary-700 border border-white" />
          <span>más</span>
        </div>
      </div>
    </div>
  );
}

function TiposEntrada({ datos }) {
  const total = datos.total || 1;
  const items = [
    { k: 'opciones_menu', label: 'Opciones de menú', color: 'bg-blue-500' },
    { k: 'texto_libre',   label: 'Texto libre / preguntas', color: 'bg-purple-500' },
    { k: 'audios',        label: 'Audios', color: 'bg-amber-500' },
    { k: 'otros_media',   label: 'Otros adjuntos', color: 'bg-rose-400' },
    { k: 'vacios',        label: 'Vacíos', color: 'bg-gray-300' },
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {items.map(it => {
          const pct = ((datos[it.k] || 0) / total) * 100;
          if (pct === 0) return null;
          return <div key={it.k} className={it.color} style={{ width: `${pct}%` }} title={`${it.label}: ${datos[it.k]}`} />;
        })}
      </div>
      <ul className="text-xs space-y-1 mt-2">
        {items.map(it => {
          const val = datos[it.k] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <li key={it.k} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-sm ${it.color} shrink-0`} />
                <span className="truncate text-gray-700">{it.label}</span>
              </span>
              <span className="text-gray-500 shrink-0">{val} <span className="text-gray-400">({pct}%)</span></span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-gray-400 mt-1">Total entrantes: {datos.total}</p>
    </div>
  );
}

function RankedList({ items, labelKey, emptyText, renderLabel, truncate }) {
  if (!items.length) {
    return <p className="text-xs text-gray-400">{emptyText}</p>;
  }
  const max = Math.max(1, ...items.map(i => i.total));
  return (
    <ul className="space-y-1.5">
      {items.map((it, idx) => {
        let label = it[labelKey];
        if (renderLabel) label = renderLabel(label);
        if (truncate && typeof label === 'string' && label.length > truncate) {
          label = label.slice(0, truncate) + '…';
        }
        const pct = (it.total / max) * 100;
        return (
          <li key={idx} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-gray-700" title={it[labelKey]}>{label}</span>
              <span className="text-gray-500 font-semibold shrink-0">{it.total}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-primary-400" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
