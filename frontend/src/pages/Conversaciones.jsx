import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmtHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota',
  });
}

function fmtFechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoy = new Date();
  const diff = (hoy - d) / 86400000;
  if (diff < 1 && d.getDate() === hoy.getDate()) return fmtHora(iso);
  if (diff < 7) return d.toLocaleDateString('es-CO', { weekday: 'short', timeZone: 'America/Bogota' });
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', timeZone: 'America/Bogota' });
}

function tipoBadge(tipo) {
  const map = {
    dependencia: { label: 'Dependencia', cls: 'bg-blue-100 text-blue-700' },
    conductor: { label: 'Conductor', cls: 'bg-amber-100 text-amber-700' },
    desconocido: { label: 'Externo', cls: 'bg-gray-100 text-gray-600' },
  };
  const m = map[tipo] || map.desconocido;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.cls}`}>{m.label}</span>;
}

export default function Conversaciones() {
  const [conversaciones, setConversaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [hilo, setHilo] = useState(null);
  const [q, setQ] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHilo, setLoadingHilo] = useState(false);
  const hiloEndRef = useRef(null);

  async function cargarLista() {
    const { data } = await api.get('/conversaciones', { params: q ? { q } : {} });
    setConversaciones(data);
  }

  async function cargarStats() {
    const { data } = await api.get('/conversaciones/stats');
    setStats(data);
  }

  async function cargarHilo(telefono) {
    setLoadingHilo(true);
    try {
      const { data } = await api.get(`/conversaciones/${telefono}`);
      setHilo(data);
    } finally {
      setLoadingHilo(false);
    }
  }

  useEffect(() => {
    Promise.all([cargarLista(), cargarStats()])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (seleccionada) cargarHilo(seleccionada);
  }, [seleccionada]);

  useEffect(() => {
    const t = setTimeout(() => cargarLista().catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (hilo && hiloEndRef.current) {
      hiloEndRef.current.scrollIntoView({ block: 'end' });
    }
  }, [hilo]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-7 h-7 text-primary-600" />
          Conversaciones de WhatsApp
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Solo se contabilizan mensajes <strong>entrantes</strong>. El hilo completo se trae desde Twilio al abrir un chat.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Mensajes hoy" value={stats.totales.hoy} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Esta semana" value={stats.totales.semana} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Este mes" value={stats.totales.mes} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard label="Personas hoy" value={stats.totales.conversaciones_hoy} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Personas semana" value={stats.totales.conversaciones_semana} color="text-rose-600" bg="bg-rose-50" />
          <StatCard label="Personas mes" value={stats.totales.conversaciones_mes} color="text-purple-600" bg="bg-purple-50" />
        </div>
      )}

      {/* Métricas clave: conversión + retención + canal */}
      {stats && (
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
      )}

      {/* Gráficos: día y semana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats?.por_dia?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Entrantes por día (30 días)</h3>
            <BarChart datos={stats.por_dia} labelKey="dia" />
          </div>
        )}
        {stats?.por_semana?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Entrantes por semana (12 sem.)</h3>
            <BarChart datos={stats.por_semana} labelKey="semana" />
          </div>
        )}
      </div>

      {/* Heatmap hora × día de la semana */}
      {stats?.heatmap && (
        <div className="card p-4">
          <h3 className="section-title mb-3 text-base">¿Cuándo escriben? (hora × día, 30 días)</h3>
          <Heatmap datos={stats.heatmap} />
        </div>
      )}

      {/* Atascos en el bot + posible fricción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats?.atascos_sesiones?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              Usuarios atascados en el bot
            </h3>
            <p className="text-xs text-gray-500 mb-2">Estados donde hay usuarios sin llegar al final del flujo.</p>
            <RankedList items={stats.atascos_sesiones} labelKey="estado" emptyText="Sin atascos" />
          </div>
        )}
        {stats?.posible_friccion?.length > 0 && (
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
                    onClick={() => setSeleccionada(c.telefono)}
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

      {/* Tipos de entrada + Opciones de menú + Preguntas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stats?.tipos_entrada && (
          <div className="card p-4">
            <h3 className="section-title mb-3 text-base">Tipo de mensaje entrante (30 días)</h3>
            <TiposEntrada datos={stats.tipos_entrada} />
          </div>
        )}
        {stats?.opciones_menu?.length > 0 && (
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
        {stats?.top_preguntas?.length > 0 && (
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

      {/* Top números */}
      {stats?.top_telefonos?.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title mb-3 text-base">Números más activos (30 días)</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_telefonos.map(t => (
              <button
                key={t.telefono}
                onClick={() => setSeleccionada(t.telefono)}
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

      {/* Dos paneles: lista + hilo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        <div className="card overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por número..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversaciones.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Sin conversaciones aún
              </div>
            ) : conversaciones.map(c => (
              <button
                key={c.telefono}
                onClick={() => setSeleccionada(c.telefono)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${seleccionada === c.telefono ? 'bg-primary-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <UserCircleIcon className="w-8 h-8 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-gray-800 truncate">
                        {c.nombre || c.telefono}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {fmtFechaCorta(c.ultima_fecha)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tipoBadge(c.tipo)}
                      <span className="text-xs text-gray-500 font-mono">{c.telefono}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-gray-600 truncate flex-1">
                        {c.ultimo_mensaje || <em className="text-gray-400">(sin texto)</em>}
                      </p>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full shrink-0">
                        {c.total_mensajes}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card overflow-hidden flex flex-col bg-gray-50">
          {!seleccionada ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Selecciona una conversación para ver los mensajes
            </div>
          ) : loadingHilo ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full" />
            </div>
          ) : hilo && (
            <>
              <div className="bg-primary-600 text-white px-5 py-3 flex items-center gap-3">
                <UserCircleIcon className="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{hilo.nombre || hilo.telefono}</p>
                  <p className="text-xs text-primary-100 font-mono">{hilo.telefono}</p>
                </div>
                {tipoBadge(hilo.tipo)}
                {hilo.fuente === 'db-fallback' && (
                  <span className="text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded" title="Twilio no respondió, mostrando copia local">
                    fallback
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {hilo.mensajes.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-6">
                    Sin mensajes guardados para este número
                  </div>
                )}
                {hilo.mensajes.map((m, idx) => {
                  const prev = hilo.mensajes[idx - 1];
                  const fechaActual = m.fecha || m.created_at;
                  const fechaPrev = prev && (prev.fecha || prev.created_at);
                  const mostrarFecha = !prev ||
                    new Date(fechaActual).toDateString() !== new Date(fechaPrev).toDateString();
                  return (
                    <div key={m.sid || idx}>
                      {mostrarFecha && (
                        <div className="text-center my-3">
                          <span className="text-[11px] bg-white text-gray-500 px-2 py-0.5 rounded-full border">
                            {new Date(fechaActual).toLocaleDateString('es-CO', {
                              weekday: 'long', day: '2-digit', month: 'long',
                              timeZone: 'America/Bogota',
                            })}
                          </span>
                        </div>
                      )}
                      <Burbuja m={m} />
                    </div>
                  );
                })}
                <div ref={hiloEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Burbuja({ m }) {
  const esOut = m.direccion === 'out';
  const align = esOut ? 'justify-end' : 'justify-start';
  const color = esOut ? 'bg-primary-500 text-white' : 'bg-white text-gray-800 border';
  const fecha = m.fecha || m.created_at;
  const mediaItems = m.media || [];
  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${color} shadow-sm`}>
        {mediaItems.map((med, i) => (
          <div key={i} className="mb-1">
            <audio controls src={med.proxy_url} className="max-w-full" preload="none" />
          </div>
        ))}
        {m.body && (
          <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
        )}
        {!m.body && mediaItems.length === 0 && m.num_media > 0 && (
          <p className="text-xs italic opacity-70">[media no disponible]</p>
        )}
        <div className={`text-[10px] mt-1 ${esOut ? 'text-primary-100' : 'text-gray-400'}`}>
          {fmtHora(fecha)}
          {m.status && esOut && <span className="ml-1">· {m.status}</span>}
          {m.error_code && <span className="ml-1 text-rose-300">· err {m.error_code}</span>}
        </div>
      </div>
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
  // matriz dia_semana (0..6) × hora (0..23)
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
