import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import { PlusIcon, TruckIcon, PencilSquareIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ESTADOS = ['disponible', 'en_servicio', 'mantenimiento', 'inactivo'];

const ESTADO_BADGE = {
  disponible: 'bg-green-50 text-green-700 ring-green-200',
  en_servicio: 'bg-blue-50 text-blue-700 ring-blue-200',
  mantenimiento: 'bg-amber-50 text-amber-700 ring-amber-200',
  inactivo: 'bg-gray-100 text-gray-600 ring-gray-200',
};

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Vehículos</h2>
          <p className="text-gray-500 text-sm mt-1">{vehiculos.length} vehículos registrados</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Nuevo Vehículo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <FunnelIcon className="w-4 h-4 text-gray-400" />
        <select value={filtro.tipo} onChange={e => setFiltro({...filtro, tipo: e.target.value})} className="input-field w-auto min-w-[150px]">
          <option value="">Todos los tipos</option>
          <option value="vehiculo">Vehículo</option>
          <option value="maquinaria">Maquinaria</option>
        </select>
        <select value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})} className="input-field w-auto min-w-[160px]">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Placa</th>
              <th className="table-cell">Tipo</th>
              <th className="table-cell">Marca</th>
              <th className="table-cell">Modelo</th>
              <th className="table-cell">Año</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">KM</th>
              <th className="table-cell text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="px-5 py-10 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
              </td></tr>
            ) : vehiculos.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">
                <TruckIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No hay vehículos
              </td></tr>
            ) : vehiculos.map(v => (
              <tr key={v.id} className="table-row">
                <td className="table-cell">
                  <Link to={`/admin/vehiculos/${v.id}`} className="font-mono font-semibold text-primary-600 hover:text-primary-700">{v.placa}</Link>
                </td>
                <td className="table-cell capitalize text-xs">{v.tipo}</td>
                <td className="table-cell">{v.marca}</td>
                <td className="table-cell text-xs text-gray-500">{v.modelo}</td>
                <td className="table-cell">{v.anio}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${ESTADO_BADGE[v.estado] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.estado === 'disponible' ? 'bg-green-500' : v.estado === 'en_servicio' ? 'bg-blue-500' : v.estado === 'mantenimiento' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    {v.estado}
                  </span>
                </td>
                <td className="table-cell font-mono text-xs">{parseFloat(v.km_actual || 0).toLocaleString()}</td>
                <td className="table-cell text-right">
                  <button onClick={() => abrirEditar(v)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors mr-1" title="Editar">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDesactivar(v.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Desactivar">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Vehículo' : 'Nuevo Vehículo'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Placa</label>
            <input type="text" placeholder="ABC-123" value={form.placa} onChange={e => setForm({...form, placa: e.target.value})}
              className="input-field font-mono uppercase" disabled={!!editando} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="input-field">
              <option value="vehiculo">Vehículo</option>
              <option value="maquinaria">Maquinaria</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
              <input type="text" placeholder="Toyota" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Modelo</label>
              <input type="text" placeholder="Hilux" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Año</label>
              <input type="number" placeholder="2024" value={form.anio} onChange={e => setForm({...form, anio: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
              <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="input-field">
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">KM actual</label>
              <input type="number" value={form.km_actual} onChange={e => setForm({...form, km_actual: e.target.value})} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleGuardar} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
