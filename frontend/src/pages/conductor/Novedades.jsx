import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, PlusIcon, InboxIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

const TIPOS = ['Dano mecanico', 'Dano electrico', 'Dano carroceria', 'Llanta', 'Frenos', 'Luces', 'Otro'];

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

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
    </div>
  );

  const urgenciaColor = (u) => {
    if (u === 'critica') return 'bg-red-100 text-red-700';
    if (u === 'alta') return 'bg-orange-100 text-orange-700';
    if (u === 'media') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <ExclamationTriangleIcon className="w-6 h-6 text-primary-600" />
          Novedades
        </h2>
        {vehiculo && <p className="text-sm text-gray-500 mt-1">Vehiculo: <strong>{vehiculo.placa}</strong></p>}
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">{msg}</div>}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-gray-400" />
          Reportar novedad
        </h3>

        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} required
          className="input-field">
          <option value="">Tipo de novedad...</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
          placeholder="Describe la novedad..." rows="3" required
          className="input-field" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Urgencia</label>
            <select value={form.urgencia} onChange={e => setForm({...form, urgencia: e.target.value})}
              className="input-field">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Critica</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Puede operar?</label>
            <select value={form.puede_operar} onChange={e => setForm({...form, puede_operar: e.target.value})}
              className="input-field">
              <option value="si">Si</option>
              <option value="limitado">Limitado</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={enviando} className="w-full btn-primary justify-center py-2.5 disabled:opacity-50">
          {enviando ? 'Enviando...' : 'Reportar novedad'}
        </button>
      </form>

      <div>
        <h3 className="section-title mb-3">Mis novedades</h3>
        <div className="space-y-3">
          {novedades.length === 0 ? (
            <div className="card text-center py-8">
              <InboxIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Sin novedades reportadas.</p>
            </div>
          ) : novedades.map(n => (
            <div key={n.id} className="card card-hover p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{n.tipo}</p>
                  <p className="text-sm text-gray-600">{n.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${urgenciaColor(n.urgencia)}`}>{n.urgencia}</span>
                  <p className="text-xs text-gray-500">{n.estado}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
