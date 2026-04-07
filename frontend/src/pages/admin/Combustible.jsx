import { useState, useEffect } from 'react';
import { BeakerIcon, FunnelIcon, InboxIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

export default function Combustible() {
  const [registros, setRegistros] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ vehiculo_id: '', fecha_desde: '', fecha_hasta: '' });

  useEffect(() => {
    api.get('/admin/vehiculos').then(r => setVehiculos(r.data));
  }, []);

  useEffect(() => { cargar(); }, [filtro]);

  async function cargar() {
    setLoading(true);
    const params = {};
    if (filtro.vehiculo_id) params.vehiculo_id = filtro.vehiculo_id;
    if (filtro.fecha_desde) params.fecha_desde = filtro.fecha_desde;
    if (filtro.fecha_hasta) params.fecha_hasta = filtro.fecha_hasta;
    const { data } = await api.get('/admin/combustible', { params });
    setRegistros(data);
    setLoading(false);
  }

  const totalGalones = registros.reduce((s, r) => s + parseFloat(r.galones || 0), 0);
  const totalValor = registros.reduce((s, r) => s + parseFloat(r.valor_cop || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title flex items-center gap-2">
          <BeakerIcon className="w-6 h-6 text-primary-600" />
          Combustible
        </h2>
        <p className="text-sm text-gray-500 mt-1">Registro de tanqueos y consumo de combustible</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <FunnelIcon className="w-4 h-4 text-gray-400" />
        <select value={filtro.vehiculo_id} onChange={e => setFiltro({...filtro, vehiculo_id: e.target.value})} className="input-field w-auto">
          <option value="">Todos los vehiculos</option>
          {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca}</option>)}
        </select>
        <input type="date" value={filtro.fecha_desde} onChange={e => setFiltro({...filtro, fecha_desde: e.target.value})}
          className="input-field w-auto" />
        <input type="date" value={filtro.fecha_hasta} onChange={e => setFiltro({...filtro, fecha_hasta: e.target.value})}
          className="input-field w-auto" />
      </div>

      {registros.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{totalGalones.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">Total galones</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">${totalValor.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-500 mt-1">Total invertido</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Fecha</th>
              <th className="table-cell">Placa</th>
              <th className="table-cell">Conductor</th>
              <th className="table-cell">Galones</th>
              <th className="table-cell">Valor (COP)</th>
              <th className="table-cell">KM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
              </td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Sin registros
              </td></tr>
            ) : registros.map(r => (
              <tr key={r.id} className="table-row">
                <td className="table-cell">{r.fecha?.substring(0, 10)}</td>
                <td className="table-cell font-medium">{r.placa}</td>
                <td className="table-cell">{r.conductor_nombre || '-'}</td>
                <td className="table-cell">{parseFloat(r.galones).toFixed(1)}</td>
                <td className="table-cell">${parseFloat(r.valor_cop).toLocaleString('es-CO')}</td>
                <td className="table-cell">{r.km_registro ? parseFloat(r.km_registro).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
