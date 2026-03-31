import { useState, useEffect } from 'react';
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
    <div>
      <h2 className="text-lg font-semibold mb-4">Combustible</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filtro.vehiculo_id} onChange={e => setFiltro({...filtro, vehiculo_id: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los vehículos</option>
          {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca}</option>)}
        </select>
        <input type="date" value={filtro.fecha_desde} onChange={e => setFiltro({...filtro, fecha_desde: e.target.value})}
          className="border rounded px-3 py-1.5 text-sm" />
        <input type="date" value={filtro.fecha_hasta} onChange={e => setFiltro({...filtro, fecha_hasta: e.target.value})}
          className="border rounded px-3 py-1.5 text-sm" />
      </div>

      {registros.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalGalones.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Total galones</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">${totalValor.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-500">Total invertido</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Placa</th>
              <th className="px-4 py-2">Conductor</th>
              <th className="px-4 py-2">Galones</th>
              <th className="px-4 py-2">Valor (COP)</th>
              <th className="px-4 py-2">KM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">Sin registros</td></tr>
            ) : registros.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{r.fecha?.substring(0, 10)}</td>
                <td className="px-4 py-2 font-medium">{r.placa}</td>
                <td className="px-4 py-2">{r.conductor_nombre || '-'}</td>
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
