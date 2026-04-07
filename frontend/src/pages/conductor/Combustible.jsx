import { useState, useEffect } from 'react';
import { BeakerIcon, PlusIcon, InboxIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

export default function ConductorCombustible() {
  const [vehiculo, setVehiculo] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], galones: '', valor_cop: '', km_registro: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get('/conductor/vehiculo').then(r => {
      setVehiculo(r.data);
      if (r.data) {
        api.get('/conductor/combustible', { params: { vehiculo_id: r.data.id } }).then(c => setRegistros(c.data));
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vehiculo) return;
    setEnviando(true);
    try {
      await api.post('/conductor/combustible', {
        vehiculo_id: vehiculo.id,
        fecha: form.fecha,
        galones: parseFloat(form.galones),
        valor_cop: parseFloat(form.valor_cop),
        km_registro: form.km_registro ? parseFloat(form.km_registro) : null
      });
      setMsg('Tanqueo registrado');
      setForm({ fecha: new Date().toISOString().split('T')[0], galones: '', valor_cop: '', km_registro: '' });
      const { data } = await api.get('/conductor/combustible', { params: { vehiculo_id: vehiculo.id } });
      setRegistros(data);
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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <BeakerIcon className="w-6 h-6 text-primary-600" />
          Combustible
        </h2>
        {vehiculo && <p className="text-sm text-gray-500 mt-1">Vehiculo: <strong>{vehiculo.placa}</strong> — {vehiculo.marca} {vehiculo.modelo}</p>}
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">{msg}</div>}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-gray-400" />
          Registrar tanqueo
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Galones</label>
            <input type="number" step="0.1" value={form.galones} onChange={e => setForm({...form, galones: e.target.value})}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Valor (COP)</label>
            <input type="number" value={form.valor_cop} onChange={e => setForm({...form, valor_cop: e.target.value})}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">KM odometro</label>
            <input type="number" value={form.km_registro} onChange={e => setForm({...form, km_registro: e.target.value})}
              className="input-field" />
          </div>
        </div>
        <button type="submit" disabled={enviando} className="w-full btn-primary justify-center py-2.5 disabled:opacity-50">
          {enviando ? 'Registrando...' : 'Registrar tanqueo'}
        </button>
      </form>

      <div>
        <h3 className="section-title mb-3">Historial</h3>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Galones</th>
                <th className="table-cell">Valor</th>
                <th className="table-cell">KM</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400">
                  <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Sin registros
                </td></tr>
              ) : registros.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell">{r.fecha?.substring(0, 10)}</td>
                  <td className="table-cell">{parseFloat(r.galones).toFixed(1)}</td>
                  <td className="table-cell">${parseFloat(r.valor_cop).toLocaleString('es-CO')}</td>
                  <td className="table-cell">{r.km_registro ? parseFloat(r.km_registro).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
