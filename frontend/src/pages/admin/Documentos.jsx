import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

export default function Documentos() {
  const [docs, setDocs] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vehiculo_id: '', tipo: 'soat', fecha_expedicion: '', fecha_vencimiento: '', estado: 'vigente' });
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });

  useEffect(() => {
    api.get('/admin/vehiculos').then(r => setVehiculos(r.data));
  }, []);

  useEffect(() => { cargar(); }, [filtro]);

  async function cargar() {
    setLoading(true);
    const params = {};
    if (filtro.tipo) params.tipo = filtro.tipo;
    if (filtro.estado) params.estado = filtro.estado;
    const { data } = await api.get('/admin/documentos', { params });
    setDocs(data);
    setLoading(false);
  }

  async function handleGuardar() {
    await api.post('/admin/documentos', { ...form, vehiculo_id: parseInt(form.vehiculo_id) });
    setModal(false);
    cargar();
  }

  const semaforo = (estado) => {
    if (estado === 'vigente') return 'bg-green-100 text-green-700';
    if (estado === 'por_vencer') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <button onClick={() => setModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">+ Nuevo</button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filtro.tipo} onChange={e => setFiltro({...filtro, tipo: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los tipos</option>
          <option value="soat">SOAT</option>
          <option value="seguro">Seguro</option>
          <option value="tecnomecanica">Tecnomecánica</option>
        </select>
        <select value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos</option>
          <option value="vigente">Vigente</option>
          <option value="por_vencer">Por vencer</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Placa</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Expedición</th>
              <th className="px-4 py-2">Vencimiento</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">Sin documentos</td></tr>
            ) : docs.map(d => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{d.placa}</td>
                <td className="px-4 py-2 uppercase text-xs">{d.tipo}</td>
                <td className="px-4 py-2">{d.fecha_expedicion?.substring(0, 10)}</td>
                <td className="px-4 py-2">{d.fecha_vencimiento?.substring(0, 10)}</td>
                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded ${semaforo(d.estado)}`}>{d.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Documento">
        <div className="space-y-3">
          <select value={form.vehiculo_id} onChange={e => setForm({...form, vehiculo_id: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar vehículo...</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
          </select>
          <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
            <option value="soat">SOAT</option>
            <option value="seguro">Seguro</option>
            <option value="tecnomecanica">Tecnomecánica</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Expedición</label>
              <input type="date" value={form.fecha_expedicion} onChange={e => setForm({...form, fecha_expedicion: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
            <button onClick={handleGuardar} disabled={!form.vehiculo_id || !form.fecha_vencimiento}
              className="px-4 py-2 bg-primary-600 text-white rounded text-sm disabled:opacity-50">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
