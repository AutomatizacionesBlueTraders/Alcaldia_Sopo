import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversaciones, setConversaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState(searchParams.get('telefono') || null);
  const [hilo, setHilo] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingHilo, setLoadingHilo] = useState(false);
  const hiloEndRef = useRef(null);

  async function cargarLista() {
    const { data } = await api.get('/conversaciones', { params: q ? { q } : {} });
    setConversaciones(data);
  }

  async function cargarHilo(telefono) {
    setLoadingHilo(true);
    setHilo(null);
    try {
      const { data } = await api.get(`/conversaciones/${telefono}`);
      setHilo(data);
    } finally {
      setLoadingHilo(false);
    }
  }

  useEffect(() => {
    cargarLista()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (seleccionada) {
      cargarHilo(seleccionada);
      // sincronizar URL para deep-linking
      if (searchParams.get('telefono') !== seleccionada) {
        setSearchParams({ telefono: seleccionada }, { replace: true });
      }
    }
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
    <div className="space-y-4">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-7 h-7 text-primary-600" />
          Conversaciones de WhatsApp
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {conversaciones.length} número{conversaciones.length === 1 ? '' : 's'} ha{conversaciones.length === 1 ? '' : 'n'} escrito al bot. El hilo completo se consulta a Twilio al abrir un chat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Lista */}
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

        {/* Hilo */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col bg-gray-50">
          {!seleccionada ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Selecciona una conversación para ver los mensajes
            </div>
          ) : loadingHilo ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-2">
              <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full" />
              <p className="text-xs text-gray-400">Consultando Twilio…</p>
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
                    fallback local
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
          {/* Twilio emite error_code 12300 en TODOS los entrantes cuando el
              webhook de n8n no responde con TwiML — es cosmético, no afecta.
              Solo mostramos el código en salientes (indica fallo real de envío). */}
          {m.error_code && esOut && <span className="ml-1 text-rose-300">· err {m.error_code}</span>}
        </div>
      </div>
    </div>
  );
}
