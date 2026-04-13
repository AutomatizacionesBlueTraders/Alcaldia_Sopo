import { useState, useEffect } from 'react';
import { BeakerIcon, PlusIcon, InboxIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

const COMBUSTIBLES = ['GASOLINA', 'DIESEL', 'GAS'];

const ESTADO_LABEL = {
  PROGRAMADA: 'Programado',
  CONFIRMADA: 'Confirmado',
  EN_EJECUCION: 'En ejecución',
  FINALIZADA: 'Finalizado',
};

export default function ConductorCombustible() {
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoId, setVehiculoId] = useState('');
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    fecha: new Date().toLocaleDateString('en-CA'),
    tipo_combustible: 'GASOLINA',
    no_ticket: '',
    valor_galon: '',
    galones: '',
    valor_cop: '',
    km_registro: '',
    observaciones: ''
  });
  const [enviando, setEnviando] = useState(false);

  const vehiculoSel = vehiculos.find(v => v.id === parseInt(vehiculoId)) || null;

  useEffect(() => {
    api.get('/conductor/vehiculos-asignados').then(r => {
      setVehiculos(r.data);
      // Pre-seleccionar el primero (más reciente)
      if (r.data.length > 0) setVehiculoId(String(r.data[0].id));
    }).finally(() => setLoading(false));
  }, []);

  // Cuando cambia el vehículo seleccionado, recargar historial
  useEffect(() => {
    if (!vehiculoId) { setRegistros([]); return; }
    api.get('/conductor/combustible', { params: { vehiculo_id: vehiculoId } })
      .then(r => setRegistros(r.data))
      .catch(() => setRegistros([]));
  }, [vehiculoId]);

  function updateCalc(field, value) {
    const newForm = { ...form, [field]: value };
    if (field === 'valor_galon' || field === 'galones') {
      const vg = parseFloat(field === 'valor_galon' ? value : newForm.valor_galon) || 0;
      const gl = parseFloat(field === 'galones' ? value : newForm.galones) || 0;
      if (vg > 0 && gl > 0) {
        newForm.valor_cop = (vg * gl).toFixed(0);
      }
    }
    setForm(newForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vehiculoId) return;
    setEnviando(true);
    try {
      await api.post('/conductor/combustible', {
        vehiculo_id: parseInt(vehiculoId),
        fecha: form.fecha,
        tipo_combustible: form.tipo_combustible,
        no_ticket: form.no_ticket || null,
        valor_galon: form.valor_galon ? parseFloat(form.valor_galon) : null,
        galones: parseFloat(form.galones),
        valor_cop: parseFloat(form.valor_cop),
        km_registro: form.km_registro ? parseFloat(form.km_registro) : null,
        observaciones: form.observaciones || null
      });
      setMsg('Tanqueo registrado');
      setForm({
        fecha: new Date().toLocaleDateString('en-CA'),
        tipo_combustible: 'GASOLINA',
        no_ticket: '', valor_galon: '', galones: '', valor_cop: '', km_registro: '', observaciones: ''
      });
      const { data } = await api.get('/conductor/combustible', { params: { vehiculo_id: vehiculoId } });
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

  if (vehiculos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <BeakerIcon className="w-6 h-6 text-primary-600" />
            Combustible
          </h2>
        </div>
        <div className="card p-10 text-center text-gray-400">
          <TruckIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No tienes vehículos asignados actualmente ni en los últimos 30 días.</p>
          <p className="text-xs mt-2">Cuando te asignen un servicio podrás registrar tanqueos aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <BeakerIcon className="w-6 h-6 text-primary-600" />
          Combustible
        </h2>
        <p className="text-sm text-gray-500 mt-1">Registra el tanqueo del vehículo que acabas de usar</p>
      </div>

      {/* Selector de vehículo */}
      <div className="card p-5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <TruckIcon className="w-4 h-4" />
          Vehículo
        </label>
        <select value={vehiculoId} onChange={e => setVehiculoId(e.target.value)} className="input-field">
          {vehiculos.map(v => (
            <option key={v.id} value={v.id}>
              {v.placa} — {v.marca} {v.modelo || ''} ({ESTADO_LABEL[v.ultimo_estado] || v.ultimo_estado} · {v.ultima_fecha?.substring(0, 10)})
            </option>
          ))}
        </select>
        {vehiculoSel && (
          <p className="text-xs text-gray-400 mt-2">
            KM registrado: <span className="font-mono text-gray-600">{parseFloat(vehiculoSel.km_actual || 0).toLocaleString()}</span>
          </p>
        )}
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">{msg}</div>}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-gray-400" />
          Registrar tanqueo
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Fecha *</label>
            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tipo combustible *</label>
            <select value={form.tipo_combustible} onChange={e => setForm({...form, tipo_combustible: e.target.value})} className="input-field">
              {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">No. Ticket</label>
            <input type="text" value={form.no_ticket} onChange={e => setForm({...form, no_ticket: e.target.value})}
              className="input-field" placeholder="Numero de ticket" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Valor x galon ($)</label>
            <input type="number" step="0.01" value={form.valor_galon} onChange={e => updateCalc('valor_galon', e.target.value)}
              className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Total galones *</label>
            <input type="number" step="0.1" value={form.galones} onChange={e => updateCalc('galones', e.target.value)}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Valor total tanqueo ($) *</label>
            <input type="number" value={form.valor_cop} onChange={e => setForm({...form, valor_cop: e.target.value})}
              className="input-field" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Kilometraje</label>
            <input type="number" value={form.km_registro} onChange={e => setForm({...form, km_registro: e.target.value})}
              className="input-field" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">Observaciones</label>
          <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})}
            rows="2" className="input-field" placeholder="Observaciones adicionales..." />
        </div>
        <button type="submit" disabled={enviando} className="w-full btn-primary justify-center py-2.5 disabled:opacity-50">
          {enviando ? 'Registrando...' : 'Registrar tanqueo'}
        </button>
      </form>

      <div>
        <h3 className="section-title mb-3">Historial {vehiculoSel && <span className="text-xs font-normal text-gray-400">({vehiculoSel.placa})</span>}</h3>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Tipo</th>
                <th className="table-cell">Ticket</th>
                <th className="table-cell">Galones</th>
                <th className="table-cell">Valor</th>
                <th className="table-cell">KM</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                  <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Sin registros
                </td></tr>
              ) : registros.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell">{r.fecha?.substring(0, 10)}</td>
                  <td className="table-cell text-xs">{r.tipo_combustible || '-'}</td>
                  <td className="table-cell text-xs">{r.no_ticket || '-'}</td>
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
