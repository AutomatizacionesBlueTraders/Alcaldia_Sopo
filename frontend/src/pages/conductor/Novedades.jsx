import { useState, useEffect } from 'react';
import api from '../../api/axios';

const TIPOS = ['Daño mecánico', 'Daño eléctrico', 'Daño carrocería', 'Llanta', 'Frenos', 'Luces', 'Otro'];

export default function ConductorNovedades() {
  const [vehiculo, setVehiculo] = useState(null);
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ tipo: '', descripcion: '', urgencia: 'media', puede_operar: 'si' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/conductor/vehiculo'),
      api.get('/conductor/novedades')
    ]).then(([v, n]) => {
      setVehiculo(v.data);
      setNovedades(n.data);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vehiculo) return;
    setEnviando(true);
    try {
      await api.post('/conductor/novedades', { vehiculo_id: vehiculo.id, ...form });
      setMsg('Novedad reportada');
      setForm({ tipo: '', descripcion: '', urgencia: 'media', puede_operar: 'si' });
      const { data } = await api.get('/conductor/novedades');
      setNovedades(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  const urgenciaColor = (u) => {
    if (u === 'critica') return 'bg-red-100 text-red-700';
    if (u === 'alta') return 'bg-orange-100 text-orange-700';
    if (u === 'media') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Novedades</h2>
      {vehiculo && <p className="text-sm text-gray-500 mb-4">Vehículo: <strong>{vehiculo.placa}</strong></p>}
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{msg}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-5 space-y-3 mb-6">
        <h3 className="font-medium text-gray-700">Reportar novedad</h3>

        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} required
          className="w-full border rounded px-3 py-2 text-sm">
          <option value="">Tipo de novedad...</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
          placeholder="Describe la novedad..." rows="3" required
          className="w-full border rounded px-3 py-2 text-sm" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Urgencia</label>
            <select value={form.urgencia} onChange={e => setForm({...form, urgencia: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">¿Puede operar?</label>
            <select value={form.puede_operar} onChange={e => setForm({...form, puede_operar: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm">
              <option value="si">Sí</option>
              <option value="limitado">Limitado</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={enviando} className="w-full bg-primary-600 text-white py-2 rounded text-sm hover:bg-primary-700 disabled:opacity-50">
          {enviando ? 'Enviando...' : 'Reportar novedad'}
        </button>
      </form>

      <h3 className="font-medium text-gray-700 mb-3">Mis novedades</h3>
      <div className="space-y-3">
        {novedades.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin novedades reportadas.</p>
        ) : novedades.map(n => (
          <div key={n.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{n.tipo}</p>
                <p className="text-sm text-gray-600">{n.descripcion}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <div className="text-right space-y-1">
                <span className={`text-xs px-2 py-0.5 rounded ${urgenciaColor(n.urgencia)}`}>{n.urgencia}</span>
                <p className="text-xs text-gray-500">{n.estado}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
