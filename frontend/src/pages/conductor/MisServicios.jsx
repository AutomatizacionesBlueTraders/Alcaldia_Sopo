import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, CalendarIcon, MapPinIcon, InboxIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';

export default function MisServicios() {
  const [servicios, setServicios] = useState([]);
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, [fecha]);

  async function cargar() {
    setLoading(true);
    const params = {};
    if (fecha) params.fecha = fecha;
    const { data } = await api.get('/conductor/servicios', { params });
    setServicios(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <ClipboardDocumentListIcon className="w-6 h-6 text-primary-600" />
          Mis Servicios
        </h2>
        <p className="text-sm text-gray-500 mt-1">Servicios asignados y su estado</p>
      </div>

      <div className="flex items-center gap-3">
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="input-field w-auto" />
        {fecha && <button onClick={() => setFecha('')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Limpiar</button>}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
          </div>
        ) : servicios.length === 0 ? (
          <div className="card text-center py-12">
            <InboxIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Sin servicios.</p>
          </div>
        ) : servicios.map(s => (
          <Link key={s.id} to={`/servicios/${s.id}`}
            className="block card card-hover p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{s.fecha?.substring(0, 10)} — {s.hora_inicio?.substring(0, 5)}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                  {s.origen} → {s.destino}
                </p>
                <p className="text-xs text-gray-400 mt-1">{s.placa} {s.marca} {s.modelo}</p>
                {s.tipo_servicio && <p className="text-xs text-gray-400">{s.tipo_servicio}</p>}
              </div>
              <EstadoBadge estado={s.estado_solicitud} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
