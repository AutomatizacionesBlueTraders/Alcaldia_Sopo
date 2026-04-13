import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

// Rango horario visible (6am a 8pm = 14 horas)
const HORA_INICIO = 6;
const HORA_FIN = 20;
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i);
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Colores por estado
const COLOR_ESTADO = {
  PROGRAMADA:   { bg: 'bg-purple-500',  ring: 'ring-purple-600',  text: 'text-white' },
  CONFIRMADA:   { bg: 'bg-green-500',   ring: 'ring-green-600',   text: 'text-white' },
  EN_EJECUCION: { bg: 'bg-indigo-500 animate-pulse', ring: 'ring-indigo-600', text: 'text-white' },
  FINALIZADA:   { bg: 'bg-gray-400',    ring: 'ring-gray-500',    text: 'text-white' },
  CANCELADA:    { bg: 'bg-red-300',     ring: 'ring-red-400',     text: 'text-red-900' },
  RECHAZADA:    { bg: 'bg-red-300',     ring: 'ring-red-400',     text: 'text-red-900' },
  DEFAULT:      { bg: 'bg-blue-400',    ring: 'ring-blue-500',    text: 'text-white' },
};

// Normaliza fecha YYYY-MM-DD en hora local
function toYMD(d) {
  return d.toLocaleDateString('en-CA');
}
function parseHHMM(hora) {
  if (!hora) return null;
  const [h, m] = hora.split(':').map(Number);
  return { h, m };
}
// Devuelve el lunes de la semana de 'd' (local)
function lunesDe(d) {
  const nuevo = new Date(d);
  const dow = nuevo.getDay(); // 0=Dom ... 6=Sab
  const diffAlLunes = (dow + 6) % 7;
  nuevo.setDate(nuevo.getDate() - diffAlLunes);
  nuevo.setHours(0, 0, 0, 0);
  return nuevo;
}
function formatoSemana(lunes) {
  const dom = new Date(lunes);
  dom.setDate(dom.getDate() + 6);
  const opciones = { day: 'numeric', month: 'short' };
  return `${lunes.toLocaleDateString('es-CO', opciones)} — ${dom.toLocaleDateString('es-CO', opciones)} ${dom.getFullYear()}`;
}

export default function WeekCalendar({ reservas, onChangeRango, tipo = 'vehiculo' }) {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));

  // Notificar cambio de rango hacia afuera (para que el padre recargue)
  useEffect(() => {
    const desde = toYMD(lunes);
    const hasta = new Date(lunes); hasta.setDate(hasta.getDate() + 6);
    onChangeRango?.({ desde, hasta: toYMD(hasta) });

  }, [lunes]);

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [lunes]);

  const hoy = toYMD(new Date());

  // Agrupa reservas por día
  const reservasPorDia = useMemo(() => {
    const map = {};
    for (const r of reservas || []) {
      const ymd = r.fecha?.substring(0, 10);
      if (!ymd) continue;
      if (!map[ymd]) map[ymd] = [];
      map[ymd].push(r);
    }
    return map;
  }, [reservas]);

  function cambiarSemana(offsetDias) {
    const d = new Date(lunes);
    d.setDate(d.getDate() + offsetDias);
    setLunes(d);
  }

  function irHoy() {
    setLunes(lunesDe(new Date()));
  }

  const esSemanaActual = toYMD(lunes) === toYMD(lunesDe(new Date()));

  return (
    <div className="card p-4 space-y-3">
      {/* Controles */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-medium text-gray-700">{formatoSemana(lunes)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => cambiarSemana(-7)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Semana anterior">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button onClick={irHoy} disabled={esSemanaActual}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${esSemanaActual ? 'bg-gray-100 text-gray-400' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}>
            Hoy
          </button>
          <button onClick={() => cambiarSemana(7)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Semana siguiente">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grilla */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header de días */}
          <div className="grid" style={{ gridTemplateColumns: '50px repeat(7, minmax(0, 1fr))' }}>
            <div />
            {dias.map((d, i) => {
              const ymd = toYMD(d);
              const esHoy = ymd === hoy;
              return (
                <div key={i} className={`text-center py-2 border-b ${esHoy ? 'border-primary-400' : 'border-gray-200'}`}>
                  <p className={`text-xs font-medium ${esHoy ? 'text-primary-700' : 'text-gray-500'}`}>{DIAS_CORTO[i]}</p>
                  <p className={`text-lg font-semibold ${esHoy ? 'text-primary-600' : 'text-gray-700'}`}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Filas por hora */}
          <div className="relative" style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, minmax(0, 1fr))', gridAutoRows: '40px' }}>
            {HORAS.map((h, rowIdx) => (
              <div key={`label-${h}`} className="text-xs text-gray-400 pr-2 text-right pt-0.5 border-r border-gray-100"
                style={{ gridColumn: 1, gridRow: rowIdx + 1 }}>
                {h}:00
              </div>
            ))}

            {/* Celdas fondo */}
            {dias.map((d, colIdx) =>
              HORAS.map((h, rowIdx) => {
                const ymd = toYMD(d);
                const esHoy = ymd === hoy;
                return (
                  <div
                    key={`cell-${colIdx}-${h}`}
                    className={`border-r border-b border-gray-100 ${esHoy ? 'bg-primary-50/20' : ''}`}
                    style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1 }}
                  />
                );
              })
            )}

            {/* Bloques de reservas */}
            {dias.map((d, colIdx) => {
              const ymd = toYMD(d);
              const reservasDia = reservasPorDia[ymd] || [];
              return reservasDia.map((r) => {
                const ini = parseHHMM(r.hora_inicio);
                const fin = parseHHMM(r.hora_fin);
                if (!ini || !fin) return null;
                // Posición en filas (cada fila = 1 hora = 40px)
                const inicioRel = (ini.h + ini.m / 60) - HORA_INICIO;
                const finRel = (fin.h + fin.m / 60) - HORA_INICIO;
                if (finRel <= 0 || inicioRel >= HORAS.length) return null;
                const topPct = Math.max(0, inicioRel) / HORAS.length * 100;
                const heightPct = (Math.min(HORAS.length, finRel) - Math.max(0, inicioRel)) / HORAS.length * 100;
                const color = COLOR_ESTADO[r.estado] || COLOR_ESTADO.DEFAULT;
                const subtitulo = tipo === 'vehiculo'
                  ? (r.conductor_nombre || 'Sin conductor')
                  : (r.vehiculo_placa || 'Sin vehículo');
                return (
                  <div
                    key={`r-${r.id}`}
                    className="relative"
                    style={{ gridColumn: colIdx + 2, gridRow: `1 / ${HORAS.length + 1}`, pointerEvents: 'none' }}
                  >
                    <Link
                      to={r.solicitud_id ? `/admin/solicitudes/${r.solicitud_id}` : '#'}
                      className={`absolute left-0.5 right-0.5 rounded-md ring-1 ring-inset ${color.ring} ${color.bg} ${color.text} px-1.5 py-0.5 text-[10px] font-medium shadow-sm hover:opacity-90 transition-opacity overflow-hidden`}
                      style={{ top: `${topPct}%`, height: `${heightPct}%`, pointerEvents: 'auto' }}
                      title={`${r.hora_inicio?.substring(0,5)}-${r.hora_fin?.substring(0,5)} · ${r.origen} → ${r.destino} · ${subtitulo}`}
                    >
                      <p className="truncate leading-tight">{r.hora_inicio?.substring(0,5)} {r.origen}</p>
                      <p className="truncate leading-tight opacity-90">{subtitulo}</p>
                    </Link>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" /> Programada</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> Confirmada</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500" /> En ejecución</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-400" /> Finalizada</span>
      </div>
    </div>
  );
}
