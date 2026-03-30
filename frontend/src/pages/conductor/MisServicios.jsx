import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <div>
      <h2 className="text-lg font-semibold mb-4">Mis Servicios</h2>

      <div className="mb-4">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm" />
        {fecha && <button onClick={() => setFecha('')} className="ml-2 text-sm text-gray-400 hover:underline">Limpiar</button>}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : servicios.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin servicios.</p>
        ) : servicios.map(s => (
          <Link key={s.id} to={`/servicios/${s.id}`}
            className="block bg-white rounded-lg shadow-sm border p-4 hover:border-primary-300 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{s.fecha} — {s.hora_inicio}</p>
                <p className="text-sm text-gray-600">{s.origen} → {s.destino}</p>
                <p className="text-xs text-gray-400">{s.placa} {s.marca} {s.modelo}</p>
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
