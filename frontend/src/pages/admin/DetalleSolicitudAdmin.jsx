import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import Modal from '../../components/Modal';

export default function DetalleSolicitudAdmin() {
  const { id } = useParams();
  const [sol, setSol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Programación
  const [progModal, setProgModal] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [progForm, setProgForm] = useState({ vehiculo_id: '', conductor_id: '', fecha: '', hora_inicio: '', hora_fin: '' });
  const [progLoading, setProgLoading] = useState(false);

  // Cancelar/Rechazar
  const [cancelModal, setCancelModal] = useState(false);
  const [rechazarModal, setRechazarModal] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { cargar(); }, [id]);

  async function cargar() {
    setLoading(true);
    const { data } = await api.get(`/admin/solicitudes/${id}`);
    setSol(data);
    if (['ENVIADA', 'PENDIENTE_PROGRAMACION'].includes(data.estado)) {
      const fecha = data.fecha_servicio ? data.fecha_servicio.substring(0, 10) : '';
      const hi = data.hora_inicio ? data.hora_inicio.substring(0, 5) : '';
      const hf = data.hora_fin_estimada ? data.hora_fin_estimada.substring(0, 5) : '';
      setProgForm(f => ({ ...f, fecha, hora_inicio: hi, hora_fin: hf }));
    }
    setLoading(false);
  }

  async function buscarDisponibles() {
    if (!progForm.fecha || !progForm.hora_inicio || !progForm.hora_fin) return;
    const params = { fecha: progForm.fecha, hora_inicio: progForm.hora_inicio, hora_fin: progForm.hora_fin };
    const [v, c] = await Promise.all([
      api.get('/admin/vehiculos/disponibles', { params }),
      api.get('/admin/conductores/disponibles', { params })
    ]);
    setVehiculos(v.data);
    setConductores(c.data);
  }

  useEffect(() => {
    if (progModal) buscarDisponibles();
  }, [progModal, progForm.fecha, progForm.hora_inicio, progForm.hora_fin]);

  async function handleProgramar() {
    setProgLoading(true);
    try {
      await api.post(`/admin/solicitudes/${id}/programar`, {
        vehiculo_id: parseInt(progForm.vehiculo_id),
        conductor_id: parseInt(progForm.conductor_id),
        fecha: progForm.fecha,
        hora_inicio: progForm.hora_inicio,
        hora_fin: progForm.hora_fin
      });
      setProgModal(false);
      setMsg('Servicio programado');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al programar');
    } finally {
      setProgLoading(false);
    }
  }

  async function handleCancelar() {
    setActionLoading(true);
    try {
      await api.patch(`/admin/solicitudes/${id}/cancelar`, { motivo });
      setCancelModal(false); setMotivo(''); setMsg('Cancelada'); cargar();
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); }
    finally { setActionLoading(false); }
  }

  async function handleRechazar() {
    setActionLoading(true);
    try {
      await api.patch(`/admin/solicitudes/${id}/rechazar`, { motivo });
      setRechazarModal(false); setMotivo(''); setMsg('Rechazada'); cargar();
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); }
    finally { setActionLoading(false); }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!sol) return <p className="text-red-500">No encontrada</p>;

  const puedeProgramar = ['ENVIADA', 'PENDIENTE_PROGRAMACION'].includes(sol.estado);

  return (
    <div className="max-w-3xl mx-auto">
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{msg}</div>}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Solicitud #{sol.id}</h2>
        <EstadoBadge estado={sol.estado} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-5 text-sm mb-4">
        <div className="grid grid-cols-2 gap-3">
          <p><span className="font-medium text-gray-500">Fecha:</span> {sol.fecha_servicio?.substring(0, 10)}</p>
          <p><span className="font-medium text-gray-500">Horario:</span> {sol.hora_inicio?.substring(0, 5)} - {sol.hora_fin_estimada?.substring(0, 5) || 'N/A'}</p>
          <p><span className="font-medium text-gray-500">Origen:</span> {sol.origen}</p>
          <p><span className="font-medium text-gray-500">Destino:</span> {sol.destino}</p>
          <p><span className="font-medium text-gray-500">Pasajeros:</span> {sol.pasajeros}</p>
          <p><span className="font-medium text-gray-500">Tipo:</span> {sol.tipo_servicio || 'N/A'}</p>
          <p><span className="font-medium text-gray-500">Contacto:</span> {sol.contacto_nombre} — {sol.contacto_telefono}</p>
          <p><span className="font-medium text-gray-500">Canal:</span> {sol.canal}</p>
        </div>
        {sol.observaciones && <p className="mt-2"><span className="font-medium text-gray-500">Obs:</span> {sol.observaciones}</p>}

        {sol.vehiculo && (
          <div className="pt-3 mt-3 border-t">
            <p className="font-medium text-gray-700 mb-1">Asignación</p>
            <p>Vehículo: {sol.vehiculo.placa} — {sol.vehiculo.marca} {sol.vehiculo.modelo}</p>
            <p>Conductor: {sol.conductor?.nombre} — {sol.conductor?.telefono}</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 mb-4">
        {puedeProgramar && (
          <button onClick={() => setProgModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
            Programar servicio
          </button>
        )}
        <button onClick={() => setCancelModal(true)} className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">Cancelar</button>
        {puedeProgramar && (
          <button onClick={() => setRechazarModal(true)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50">Rechazar</button>
        )}
      </div>

      {/* Historial */}
      {sol.historial?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-medium text-gray-700 mb-3">Historial</h3>
          <div className="space-y-2">
            {sol.historial.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                <div>
                  <p>{h.estado_anterior ? `${h.estado_anterior} → ` : ''}<span className="font-medium">{h.estado_nuevo}</span></p>
                  {h.notas && <p className="text-gray-400">{h.notas}</p>}
                  <p className="text-gray-300 text-xs">{new Date(h.created_at).toLocaleString('es-CO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Programar */}
      <Modal open={progModal} onClose={() => setProgModal(false)} title="Programar Servicio">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Fecha</label>
              <input type="date" value={progForm.fecha} onChange={e => setProgForm({...progForm, fecha: e.target.value})}
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hora inicio</label>
              <input type="time" value={progForm.hora_inicio} onChange={e => setProgForm({...progForm, hora_inicio: e.target.value})}
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hora fin</label>
              <input type="time" value={progForm.hora_fin} onChange={e => setProgForm({...progForm, hora_fin: e.target.value})}
                className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Vehículo ({vehiculos.length} disponibles)</label>
            <select value={progForm.vehiculo_id} onChange={e => setProgForm({...progForm, vehiculo_id: e.target.value})}
              className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">Seleccionar...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Conductor ({conductores.length} disponibles)</label>
            <select value={progForm.conductor_id} onChange={e => setProgForm({...progForm, conductor_id: e.target.value})}
              className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">Seleccionar...</option>
              {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setProgModal(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
            <button onClick={handleProgramar} disabled={!progForm.vehiculo_id || !progForm.conductor_id || progLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded text-sm disabled:opacity-50">
              {progLoading ? 'Programando...' : 'Programar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Cancelar */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar Solicitud">
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="3" placeholder="Motivo (mín 10 caracteres)..."
          className="w-full border rounded px-3 py-2 text-sm mb-3" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setCancelModal(false)} className="px-4 py-2 border rounded text-sm">Volver</button>
          <button onClick={handleCancelar} disabled={motivo.length < 10 || actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">Confirmar</button>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal open={rechazarModal} onClose={() => setRechazarModal(false)} title="Rechazar Solicitud">
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="3" placeholder="Motivo del rechazo..."
          className="w-full border rounded px-3 py-2 text-sm mb-3" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setRechazarModal(false)} className="px-4 py-2 border rounded text-sm">Volver</button>
          <button onClick={handleRechazar} disabled={!motivo || actionLoading}
            className="px-4 py-2 bg-gray-700 text-white rounded text-sm disabled:opacity-50">Rechazar</button>
        </div>
      </Modal>
    </div>
  );
}
