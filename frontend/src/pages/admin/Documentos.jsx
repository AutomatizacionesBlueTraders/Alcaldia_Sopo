import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

export default function Documentos() {
  const [docs, setDocs] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [verImagen, setVerImagen] = useState(null);
  const [form, setForm] = useState({ vehiculo_id: '', tipo: 'soat', fecha_expedicion: '', fecha_vencimiento: '', estado: 'vigente', soporte_imagen: '' });
  const [editForm, setEditForm] = useState(null);
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef();
  const editFileRef = useRef();

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

  function leerArchivo(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
  }

  async function handleGuardar() {
    if (!form.vehiculo_id || !form.fecha_vencimiento) return;
    setGuardando(true);
    try {
      await api.post('/admin/documentos', { ...form, vehiculo_id: parseInt(form.vehiculo_id) });
      setModal(false);
      setForm({ vehiculo_id: '', tipo: 'soat', fecha_expedicion: '', fecha_vencimiento: '', estado: 'vigente', soporte_imagen: '' });
      if (fileRef.current) fileRef.current.value = '';
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  function abrirEditar(doc) {
    setEditForm({
      id: doc.id,
      vehiculo_id: doc.vehiculo_id,
      tipo: doc.tipo,
      fecha_expedicion: doc.fecha_expedicion?.substring(0, 10) || '',
      fecha_vencimiento: doc.fecha_vencimiento?.substring(0, 10) || '',
      estado: doc.estado,
      soporte_imagen: doc.soporte_imagen || ''
    });
    setEditModal(true);
  }

  async function handleActualizar() {
    if (!editForm.fecha_vencimiento) return;
    setGuardando(true);
    try {
      await api.patch(`/admin/documentos/${editForm.id}`, editForm);
      setEditModal(false);
      setEditForm(null);
      if (editFileRef.current) editFileRef.current.value = '';
      cargar();
    } finally {
      setGuardando(false);
    }
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
              <th className="px-4 py-2">Soporte</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">Sin documentos</td></tr>
            ) : docs.map(d => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{d.placa}</td>
                <td className="px-4 py-2 uppercase text-xs">{d.tipo}</td>
                <td className="px-4 py-2">{d.fecha_expedicion?.substring(0, 10)}</td>
                <td className="px-4 py-2">{d.fecha_vencimiento?.substring(0, 10)}</td>
                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded ${semaforo(d.estado)}`}>{d.estado}</span></td>
                <td className="px-4 py-2">
                  {d.soporte_imagen ? (
                    <button onClick={() => setVerImagen(d.soporte_imagen)}
                      className="text-primary-600 hover:underline text-xs">Ver imagen</button>
                  ) : (
                    <span className="text-gray-300 text-xs">Sin soporte</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => abrirEditar(d)} className="text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-0.5">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo */}
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
              <label className="text-xs text-gray-500">Vencimiento *</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Imagen del documento (opcional)</label>
            <input ref={fileRef} type="file" accept="image/*"
              onChange={e => leerArchivo(e.target.files[0], b64 => setForm({...form, soporte_imagen: b64}))}
              className="w-full border rounded px-3 py-2 text-sm" />
            {form.soporte_imagen && (
              <img src={form.soporte_imagen} alt="Vista previa" className="mt-2 max-h-32 rounded border" />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
            <button onClick={handleGuardar} disabled={!form.vehiculo_id || !form.fecha_vencimiento || guardando}
              className="px-4 py-2 bg-primary-600 text-white rounded text-sm disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar */}
      {editForm && (
        <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar Documento">
          <div className="space-y-3">
            <select value={editForm.vehiculo_id} onChange={e => setEditForm({...editForm, vehiculo_id: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2 text-sm">
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
            </select>
            <select value={editForm.tipo} onChange={e => setEditForm({...editForm, tipo: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
              <option value="soat">SOAT</option>
              <option value="seguro">Seguro</option>
              <option value="tecnomecanica">Tecnomecánica</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Expedición</label>
                <input type="date" value={editForm.fecha_expedicion} onChange={e => setEditForm({...editForm, fecha_expedicion: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Vencimiento *</label>
                <input type="date" value={editForm.fecha_vencimiento} onChange={e => setEditForm({...editForm, fecha_vencimiento: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Estado</label>
              <select value={editForm.estado} onChange={e => setEditForm({...editForm, estado: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
                <option value="vigente">Vigente</option>
                <option value="por_vencer">Por vencer</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Imagen del documento</label>
              <input ref={editFileRef} type="file" accept="image/*"
                onChange={e => leerArchivo(e.target.files[0], b64 => setEditForm({...editForm, soporte_imagen: b64}))}
                className="w-full border rounded px-3 py-2 text-sm" />
              {editForm.soporte_imagen && (
                <img src={editForm.soporte_imagen} alt="Vista previa" className="mt-2 max-h-32 rounded border" />
              )}
              {editForm.soporte_imagen && (
                <button onClick={() => setEditForm({...editForm, soporte_imagen: ''})}
                  className="text-xs text-red-500 hover:underline mt-1">Quitar imagen</button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
              <button onClick={handleActualizar} disabled={!editForm.fecha_vencimiento || guardando}
                className="px-4 py-2 bg-primary-600 text-white rounded text-sm disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Ver imagen */}
      <Modal open={!!verImagen} onClose={() => setVerImagen(null)} title="Soporte del documento">
        {verImagen && (
          <div className="text-center">
            <img src={verImagen} alt="Soporte" className="max-w-full max-h-96 mx-auto rounded border" />
            <a href={verImagen} download="soporte_documento.png"
              className="mt-3 inline-block text-sm text-primary-600 hover:underline">Descargar imagen</a>
          </div>
        )}
      </Modal>
    </div>
  );
}
