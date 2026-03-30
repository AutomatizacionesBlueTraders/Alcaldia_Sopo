import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Conductores</h2>
        <button onClick={abrirCrear} className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">+ Nuevo</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Licencia</th>
              <th className="px-4 py-2">Venc. Licencia</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : conductores.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{c.nombre}</td>
                <td className="px-4 py-2">{c.telefono}</td>
                <td className="px-4 py-2">{c.licencia}</td>
                <td className="px-4 py-2">{c.vencimiento_licencia?.split('T')[0]}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.estado}</span>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => abrirEditar(c)} className="text-primary-600 hover:underline text-xs">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Conductor' : 'Nuevo Conductor'}>
        <div className="space-y-3">
          <input type="text" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm" />
          <input type="tel" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Categoría licencia" value={form.licencia} onChange={e => setForm({...form, licencia: e.target.value})}
              className="border rounded px-3 py-2 text-sm" />
            <input type="date" value={form.vencimiento_licencia} onChange={e => setForm({...form, vencimiento_licencia: e.target.value})}
              className="border rounded px-3 py-2 text-sm" />
          </div>
          <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="incapacidad">Incapacidad</option>
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
            <button onClick={handleGuardar} className="px-4 py-2 bg-primary-600 text-white rounded text-sm">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
