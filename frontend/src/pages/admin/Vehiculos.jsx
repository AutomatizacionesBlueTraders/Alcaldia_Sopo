import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';

const ESTADOS = ['disponible', 'en_servicio', 'mantenimiento', 'inactivo'];

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ placa: '', tipo: 'vehiculo', marca: '', modelo: '', anio: '', estado: 'disponible', km_actual: 0 });
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });

  useEffect(() => { cargar(); }, [filtro]);

  async function cargar() {
    setLoading(true);
    const params = {};
    if (filtro.tipo) params.tipo = filtro.tipo;
    if (filtro.estado) params.estado = filtro.estado;
    params.activo = 'true';
    const { data } = await api.get('/admin/vehiculos', { params });
    setVehiculos(data);
    setLoading(false);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ placa: '', tipo: 'vehiculo', marca: '', modelo: '', anio: '', estado: 'disponible', km_actual: 0 });
    setModal(true);
  }

  function abrirEditar(v) {
    setEditando(v.id);
    setForm({ placa: v.placa, tipo: v.tipo, marca: v.marca, modelo: v.modelo, anio: v.anio, estado: v.estado, km_actual: v.km_actual });
    setModal(true);
  }

  async function handleGuardar() {
    if (editando) {
      await api.patch(`/admin/vehiculos/${editando}`, form);
    } else {
      await api.post('/admin/vehiculos', form);
    }
    setModal(false);
    cargar();
  }

  async function handleDesactivar(id) {
    if (!confirm('Desactivar este vehículo?')) return;
    await api.delete(`/admin/vehiculos/${id}`);
    cargar();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Vehículos</h2>
        <button onClick={abrirCrear} className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">+ Nuevo</button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filtro.tipo} onChange={e => setFiltro({...filtro, tipo: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los tipos</option>
          <option value="vehiculo">Vehículo</option>
          <option value="maquinaria">Maquinaria</option>
        </select>
        <select value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Placa</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Marca</th>
              <th className="px-4 py-2">Modelo</th>
              <th className="px-4 py-2">Año</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">KM</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : vehiculos.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  <Link to={`/admin/vehiculos/${v.id}`} className="text-primary-600 hover:underline">{v.placa}</Link>
                </td>
                <td className="px-4 py-2 text-xs">{v.tipo}</td>
                <td className="px-4 py-2">{v.marca}</td>
                <td className="px-4 py-2 text-xs">{v.modelo}</td>
                <td className="px-4 py-2">{v.anio}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${v.estado === 'disponible' ? 'bg-green-100 text-green-700' : v.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{v.estado}</span>
                </td>
                <td className="px-4 py-2">{parseFloat(v.km_actual || 0).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button onClick={() => abrirEditar(v)} className="text-primary-600 hover:underline text-xs mr-2">Editar</button>
                  <button onClick={() => handleDesactivar(v.id)} className="text-red-500 hover:underline text-xs">Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Vehículo' : 'Nuevo Vehículo'}>
        <div className="space-y-3">
          <input type="text" placeholder="Placa" value={form.placa} onChange={e => setForm({...form, placa: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm" disabled={!!editando} />
          <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
            <option value="vehiculo">Vehículo</option>
            <option value="maquinaria">Maquinaria</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Marca" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})}
              className="border rounded px-3 py-2 text-sm" />
            <input type="text" placeholder="Modelo" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})}
              className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Año" value={form.anio} onChange={e => setForm({...form, anio: e.target.value})}
              className="border rounded px-3 py-2 text-sm" />
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="border rounded px-3 py-2 text-sm">
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="number" placeholder="KM actual" value={form.km_actual} onChange={e => setForm({...form, km_actual: e.target.value})}
              className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
            <button onClick={handleGuardar} className="px-4 py-2 bg-primary-600 text-white rounded text-sm">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
