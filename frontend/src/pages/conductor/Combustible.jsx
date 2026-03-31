import { useState, useEffect } from 'react';
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

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Combustible</h2>
      {vehiculo && <p className="text-sm text-gray-500 mb-4">Vehículo: <strong>{vehiculo.placa}</strong> — {vehiculo.marca} {vehiculo.modelo}</p>}
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{msg}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-5 space-y-3 mb-6">
        <h3 className="font-medium text-gray-700">Registrar tanqueo</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Galones</label>
            <input type="number" step="0.1" value={form.galones} onChange={e => setForm({...form, galones: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Valor (COP)</label>
            <input type="number" value={form.valor_cop} onChange={e => setForm({...form, valor_cop: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">KM odómetro</label>
            <input type="number" value={form.km_registro} onChange={e => setForm({...form, km_registro: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={enviando} className="w-full bg-primary-600 text-white py-2 rounded text-sm hover:bg-primary-700 disabled:opacity-50">
          {enviando ? 'Registrando...' : 'Registrar tanqueo'}
        </button>
      </form>

      <h3 className="font-medium text-gray-700 mb-3">Historial</h3>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Galones</th>
              <th className="px-4 py-2">Valor</th>
              <th className="px-4 py-2">KM</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-400">Sin registros</td></tr>
            ) : registros.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.fecha?.substring(0, 10)}</td>
                <td className="px-4 py-2">{parseFloat(r.galones).toFixed(1)}</td>
                <td className="px-4 py-2">${parseFloat(r.valor_cop).toLocaleString('es-CO')}</td>
                <td className="px-4 py-2">{r.km_registro ? parseFloat(r.km_registro).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
