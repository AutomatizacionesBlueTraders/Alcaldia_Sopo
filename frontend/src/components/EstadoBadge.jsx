const COLORES = {
  BORRADOR: 'bg-gray-100 text-gray-700',
  ENVIADA: 'bg-blue-100 text-blue-700',
  PENDIENTE_PROGRAMACION: 'bg-yellow-100 text-yellow-700',
  PROGRAMADA: 'bg-purple-100 text-purple-700',
  PENDIENTE_CONFIRMACION: 'bg-orange-100 text-orange-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  NO_CONFIRMADA: 'bg-red-100 text-red-700',
  EN_EJECUCION: 'bg-indigo-100 text-indigo-700',
  FINALIZADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-600',
  RECHAZADA: 'bg-red-200 text-red-800',
  TRANSFERIDA: 'bg-amber-100 text-amber-700',
};

const LABELS = {
  PENDIENTE_PROGRAMACION: 'Pend. Programación',
  PENDIENTE_CONFIRMACION: 'Pend. Confirmación',
  NO_CONFIRMADA: 'No Confirmada',
  EN_EJECUCION: 'En Ejecución',
};

export default function EstadoBadge({ estado }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${COLORES[estado] || 'bg-gray-100 text-gray-600'}`}>
      {LABELS[estado] || estado}
    </span>
  );
}
