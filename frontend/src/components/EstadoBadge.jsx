const COLORES = {
  BORRADOR: 'bg-gray-100 text-gray-600 ring-gray-200',
  ENVIADA: 'bg-blue-50 text-blue-700 ring-blue-200',
  PENDIENTE_PROGRAMACION: 'bg-amber-50 text-amber-700 ring-amber-200',
  PROGRAMADA: 'bg-purple-50 text-purple-700 ring-purple-200',
  PENDIENTE_CONFIRMACION: 'bg-orange-50 text-orange-700 ring-orange-200',
  CONFIRMADA: 'bg-green-50 text-green-700 ring-green-200',
  NO_CONFIRMADA: 'bg-red-50 text-red-700 ring-red-200',
  EN_EJECUCION: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  FINALIZADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELADA: 'bg-red-50 text-red-600 ring-red-200',
  RECHAZADA: 'bg-red-100 text-red-800 ring-red-300',
  TRANSFERIDA: 'bg-amber-50 text-amber-700 ring-amber-200',
};

const DOTS = {
  BORRADOR: 'bg-gray-400',
  ENVIADA: 'bg-blue-500',
  PENDIENTE_PROGRAMACION: 'bg-amber-500',
  PROGRAMADA: 'bg-purple-500',
  PENDIENTE_CONFIRMACION: 'bg-orange-500',
  CONFIRMADA: 'bg-green-500',
  NO_CONFIRMADA: 'bg-red-500',
  EN_EJECUCION: 'bg-indigo-500 animate-pulse',
  FINALIZADA: 'bg-emerald-500',
  CANCELADA: 'bg-red-500',
  RECHAZADA: 'bg-red-600',
  TRANSFERIDA: 'bg-amber-500',
};

const LABELS = {
  PENDIENTE_PROGRAMACION: 'Pend. Programación',
  PENDIENTE_CONFIRMACION: 'Pend. Confirmación',
  NO_CONFIRMADA: 'No Confirmada',
  EN_EJECUCION: 'En Ejecución',
};

export default function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${COLORES[estado] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[estado] || 'bg-gray-400'}`} />
      {LABELS[estado] || estado}
    </span>
  );
}
