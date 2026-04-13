import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import { PlusIcon, UsersIcon, PencilSquareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ESTADO_BADGE = {
  activo: 'bg-green-50 text-green-700 ring-green-200',
  inactivo: 'bg-gray-100 text-gray-600 ring-gray-200',
  vacaciones: 'bg-blue-50 text-blue-700 ring-blue-200',
  incapacidad: 'bg-amber-50 text-amber-700 ring-amber-200',
};

const ESTADO_DOT = {
  activo: 'bg-green-500',
  inactivo: 'bg-gray-400',
  vacaciones: 'bg-blue-500',
  incapacidad: 'bg-amber-500',
};

export default function Conductores() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', telefono: '', licencia: '', vencimiento_licencia: '', estado: 'activo' });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    const { data } = await api.get('/admin/conductores');
    setConductores(data);
    setLoading(false);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: '', telefono: '', licencia: '', vencimiento_licencia: '', estado: 'activo' });
    setModal(true);
  }

  function abrirEditar(c) {
    setEditando(c.id);
    setForm({ nombre: c.nombre, telefono: c.telefono, licencia: c.licencia, vencimiento_licencia: c.vencimiento_licencia?.split('T')[0] || '', estado: c.estado });
    setModal(true);
  }

  async function handleGuardar() {
    if (editando) {
      await api.patch(`/admin/conductores/${editando}`, form);
    } else {
      await api.post('/admin/conductores', form);
    }
    setModal(false);
    cargar();
  }

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Conductores</h2>
          <p className="text-gray-500 text-sm mt-1">{conductores.length} conductores registrados</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Nuevo Conductor
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Nombre</th>
              <th className="table-cell">Teléfono</th>
              <th className="table-cell">Licencia</th>
              <th className="table-cell">Venc. Licencia</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-10 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
              </td></tr>
            ) : conductores.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-400">
                <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No hay conductores
              </td></tr>
            ) : conductores.map(c => (
              <tr key={c.id} className="table-row">
                <td className="table-cell">
                  <Link to={`/admin/conductores/${c.id}`} className="font-semibold text-primary-600 hover:text-primary-700">{c.nombre}</Link>
                </td>
                <td className="table-cell font-mono text-xs">{c.telefono}</td>
                <td className="table-cell">{c.licencia}</td>
                <td className="table-cell">{c.vencimiento_licencia?.split('T')[0]}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${ESTADO_BADGE[c.estado] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[c.estado] || 'bg-gray-400'}`} />
                    {c.estado}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Conductor' : 'Nuevo Conductor'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
            <input type="text" placeholder="Juan Pérez" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
            <input type="tel" placeholder="3001234567" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría licencia</label>
              <input type="text" placeholder="C1" value={form.licencia} onChange={e => setForm({...form, licencia: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimiento licencia</label>
              <input type="date" value={form.vencimiento_licencia} onChange={e => setForm({...form, vencimiento_licencia: e.target.value})} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="input-field">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="vacaciones">Vacaciones</option>
              <option value="incapacidad">Incapacidad</option>
            </select>
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
