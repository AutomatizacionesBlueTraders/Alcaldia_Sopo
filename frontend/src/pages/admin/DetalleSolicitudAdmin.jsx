import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardDocumentListIcon, CalendarDaysIcon, ArrowPathIcon, XCircleIcon, NoSymbolIcon, ClockIcon, ArrowLeftIcon, PencilSquareIcon, CheckIcon, XMarkIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import Modal from '../../components/Modal';

export default function DetalleSolicitudAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sol, setSol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Programacion
  const [progModal, setProgModal] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [progForm, setProgForm] = useState({ vehiculo_id: '', conductor_id: '', fecha: '', hora_inicio: '', hora_fin: '' });
  const [progLoading, setProgLoading] = useState(false);
  const [vehiculoSearch, setVehiculoSearch] = useState('');

  // Reprogramacion
  const [reprogModal, setReprogModal] = useState(false);
  const [reprogForm, setReprogForm] = useState({ vehiculo_id: '', conductor_id: '', fecha: '', hora_inicio: '', hora_fin: '' });
  const [reprogVehiculos, setReprogVehiculos] = useState([]);
  const [reprogConductores, setReprogConductores] = useState([]);
  const [reprogLoading, setReprogLoading] = useState(false);
  const [reprogVehiculoSearch, setReprogVehiculoSearch] = useState('');

  // Edicion
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editDeps, setEditDeps] = useState([]);

  // Cancelar/Rechazar
  const [cancelModal, setCancelModal] = useState(false);
  const [rechazarModal, setRechazarModal] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    cargar();
    api.get('/admin/dependencias').then(r => setEditDeps(r.data));
  }, [id]);

  async function cargar() {
    setLoading(true);
    const { data } = await api.get(`/admin/solicitudes/${id}`);
    setSol(data);
    if (data.estado === 'PENDIENTE_PROGRAMACION') {
      const fecha = data.fecha_servicio ? data.fecha_servicio.substring(0, 10) : '';
      const hi = data.hora_inicio ? data.hora_inicio.substring(0, 5) : '';
      const hf = data.hora_fin_estimada ? data.hora_fin_estimada.substring(0, 5) : '';
      setProgForm(f => ({ ...f, fecha, hora_inicio: hi, hora_fin: hf }));
    }
    setLoading(false);
  }

  function iniciarEdicion() {
    setEditForm({
      dependencia_id: sol.dependencia_id || '',
      fecha_servicio: sol.fecha_servicio?.substring(0, 10) || '',
      horario_solicitud: sol.horario_solicitud || '',
      origen: sol.origen || '',
      destino: sol.destino || '',
      pasajeros: sol.pasajeros || 1,
      nombre_solicitante: sol.nombre_solicitante || sol.contacto_nombre || '',
      telefono_solicitante: sol.telefono_solicitante || sol.contacto_telefono || '',
      identificacion_solicitante: sol.identificacion_solicitante || '',
      descripcion_recorrido: sol.descripcion_recorrido || '',
      nombre_paciente: sol.nombre_paciente || '',
      observaciones: sol.observaciones || '',
    });
    setEditando(true);
  }

  async function guardarEdicion() {
    setEditLoading(true);
    try {
      await api.patch(`/admin/solicitudes/${id}`, editForm);
      setEditando(false);
      setMsg('Solicitud actualizada');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
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

  // Reprogramar
  function abrirReprogramar() {
    const a = sol.asignacion;
    if (a) {
      setReprogForm({
        vehiculo_id: a.vehiculo_id || '',
        conductor_id: a.conductor_id || '',
        fecha: a.fecha?.split('T')[0] || '',
        hora_inicio: a.hora_inicio?.substring(0, 5) || '',
        hora_fin: a.hora_fin?.substring(0, 5) || ''
      });
    }
    setReprogModal(true);
  }

  async function buscarDisponiblesReprog() {
    if (!reprogForm.fecha || !reprogForm.hora_inicio || !reprogForm.hora_fin) return;
    const params = { fecha: reprogForm.fecha, hora_inicio: reprogForm.hora_inicio, hora_fin: reprogForm.hora_fin };
    const [v, c] = await Promise.all([
      api.get('/admin/vehiculos/disponibles', { params }),
      api.get('/admin/conductores/disponibles', { params })
    ]);
    setReprogVehiculos(v.data);
    setReprogConductores(c.data);
  }

  useEffect(() => {
    if (reprogModal) buscarDisponiblesReprog();
  }, [reprogModal, reprogForm.fecha, reprogForm.hora_inicio, reprogForm.hora_fin]);

  async function handleReprogramar() {
    setReprogLoading(true);
    try {
      const a = sol.asignacion;
      const body = {
        vehiculo_id: parseInt(reprogForm.vehiculo_id) || a.vehiculo_id,
        conductor_id: parseInt(reprogForm.conductor_id) || a.conductor_id,
        fecha: reprogForm.fecha || a.fecha?.split('T')[0],
        hora_inicio: reprogForm.hora_inicio || a.hora_inicio?.substring(0, 5),
        hora_fin: reprogForm.hora_fin || a.hora_fin?.substring(0, 5),
      };
      await api.patch(`/admin/asignaciones/${a.id}/reprogramar`, body);
      setReprogModal(false);
      setMsg('Servicio reprogramado exitosamente');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al reprogramar');
    } finally {
      setReprogLoading(false);
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

  async function handleMarcarRevisada() {
    setActionLoading(true);
    try {
      await api.patch(`/admin/solicitudes/${id}/marcar-revisada`);
      setMsg('Cancelación marcada como revisada'); cargar();
    } catch (err) { setMsg(err.response?.data?.error || 'Error al marcar como revisada'); }
    finally { setActionLoading(false); }
  }

  async function handleReabrir() {
    if (!confirm('¿Reabrir esta solicitud? Pasará a estado "Pendiente programación".')) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/solicitudes/${id}/reabrir`, {});
      setMsg('Solicitud reabierta. Estado: pendiente programación'); cargar();
    } catch (err) { setMsg(err.response?.data?.error || 'Error al reabrir'); }
    finally { setActionLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
    </div>
  );
  if (!sol) return <p className="text-red-500">No encontrada</p>;

  const filtrarVehiculos = (lista, q) => {
    const t = q.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter(v =>
      (v.placa || '').toLowerCase().includes(t) ||
      (v.marca || '').toLowerCase().includes(t) ||
      (v.modelo || '').toLowerCase().includes(t)
    );
  };
  const vehiculosFiltrados = filtrarVehiculos(vehiculos, vehiculoSearch);
  const reprogVehiculosFiltrados = filtrarVehiculos(reprogVehiculos, reprogVehiculoSearch);

  const puedeProgramar = sol.estado === 'PENDIENTE_PROGRAMACION';
  const puedeReprogramar = ['PROGRAMADA', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_EJECUCION'].includes(sol.estado) && sol.asignacion;
  const puedeEditar = !['CANCELADA', 'RECHAZADA', 'FINALIZADA'].includes(sol.estado);
  const puedeCancelar = !['CANCELADA', 'RECHAZADA', 'FINALIZADA'].includes(sol.estado);
  const puedeReabrir = ['CANCELADA', 'RECHAZADA'].includes(sol.estado);
  const puedeMarcarRevisada = sol.estado === 'CANCELADA' && sol.cancelacion_revisada === false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">{msg}</div>}

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Volver
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-6 h-6 text-primary-600" />
            Solicitud #{sol.id}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gestion administrativa de la solicitud</p>
        </div>
        <EstadoBadge estado={sol.estado} />
      </div>

      {/* Datos — modo vista o edicion */}
      {editando ? (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dependencia</label>
              <select value={editForm.dependencia_id} onChange={e => setEditForm({...editForm, dependencia_id: parseInt(e.target.value)})} className="input-field">
                {editDeps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha del servicio</label>
              <input type="date" value={editForm.fecha_servicio} onChange={e => setEditForm({...editForm, fecha_servicio: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Horario solicitado</label>
              <input type="text" value={editForm.horario_solicitud} onChange={e => setEditForm({...editForm, horario_solicitud: e.target.value})} className="input-field" placeholder="Ej: 8:00 AM a 12:00 PM" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Origen</label>
              <input type="text" value={editForm.origen} onChange={e => setEditForm({...editForm, origen: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Destino</label>
              <input type="text" value={editForm.destino} onChange={e => setEditForm({...editForm, destino: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pasajeros</label>
              <input type="number" min="1" value={editForm.pasajeros} onChange={e => setEditForm({...editForm, pasajeros: parseInt(e.target.value) || 1})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Identificacion solicitante</label>
              <input type="text" value={editForm.identificacion_solicitante} onChange={e => setEditForm({...editForm, identificacion_solicitante: e.target.value})} className="input-field" placeholder="Cedula" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre solicitante</label>
              <input type="text" value={editForm.nombre_solicitante} onChange={e => setEditForm({...editForm, nombre_solicitante: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Telefono solicitante</label>
              <input type="tel" value={editForm.telefono_solicitante} onChange={e => setEditForm({...editForm, telefono_solicitante: e.target.value})} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripcion del recorrido</label>
            <textarea value={editForm.descripcion_recorrido} onChange={e => setEditForm({...editForm, descripcion_recorrido: e.target.value})} rows="2" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del paciente</label>
              <input type="text" value={editForm.nombre_paciente} onChange={e => setEditForm({...editForm, nombre_paciente: e.target.value})} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
            <textarea value={editForm.observaciones} onChange={e => setEditForm({...editForm, observaciones: e.target.value})} rows="2" className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={guardarEdicion} disabled={editLoading} className="btn-primary">
              <CheckIcon className="w-4 h-4" />
              {editLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={() => setEditando(false)} className="btn-secondary">
              <XMarkIcon className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <p><span className="font-medium text-gray-500">Dependencia:</span> {sol.dependencia_nombre || 'N/A'}</p>
            <p><span className="font-medium text-gray-500">Fecha del servicio:</span> {sol.fecha_servicio?.substring(0, 10)}</p>
            <p><span className="font-medium text-gray-500">Horario solicitado:</span> {sol.horario_solicitud || 'N/A'}</p>
            <p><span className="font-medium text-gray-500">Origen:</span> {sol.origen}</p>
            <p><span className="font-medium text-gray-500">Destino:</span> {sol.destino}</p>
            <p><span className="font-medium text-gray-500">Pasajeros:</span> {sol.pasajeros}</p>
            <p><span className="font-medium text-gray-500">Canal:</span> {sol.canal}</p>
            <p><span className="font-medium text-gray-500">Solicitante:</span> {sol.nombre_solicitante || sol.contacto_nombre || 'N/A'}</p>
            <p><span className="font-medium text-gray-500">Telefono:</span> {sol.telefono_solicitante || sol.contacto_telefono || 'N/A'}</p>
            {sol.identificacion_solicitante && <p><span className="font-medium text-gray-500">Identificacion:</span> {sol.identificacion_solicitante}</p>}
          </div>
          {sol.descripcion_recorrido && <p className="mt-2"><span className="font-medium text-gray-500">Descripcion del recorrido:</span> {sol.descripcion_recorrido}</p>}
          {sol.nombre_paciente && sol.nombre_paciente !== 'N/a' && <p className="mt-2"><span className="font-medium text-gray-500">Paciente:</span> {sol.nombre_paciente}</p>}
          {sol.observaciones && <p className="mt-2"><span className="font-medium text-gray-500">Observaciones:</span> {sol.observaciones}</p>}

          {sol.estado === 'CANCELADA' && sol.motivo_cancelacion && (
            <div className="pt-3 mt-3 border-t border-red-100 bg-red-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
              <p className="font-medium text-red-700 mb-1">Motivo de cancelacion</p>
              <p className="text-red-600">{sol.motivo_cancelacion}</p>
            </div>
          )}

          {sol.vehiculo && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="font-medium text-gray-700 mb-1">Asignacion</p>
              <p>Vehiculo: {sol.vehiculo.placa} — {sol.vehiculo.marca} {sol.vehiculo.modelo}</p>
              <p>Conductor: {sol.conductor?.nombre} — {sol.conductor?.telefono}</p>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      {!editando && <div className="flex gap-3 flex-wrap">
        {puedeEditar && (
          <button onClick={iniciarEdicion} className="inline-flex items-center gap-2 px-4 py-2.5 border border-primary-200 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors">
            <PencilSquareIcon className="w-4 h-4" />
            Editar datos
          </button>
        )}
        {puedeProgramar && (
          <button onClick={() => setProgModal(true)} className="btn-primary">
            <CalendarDaysIcon className="w-4 h-4" />
            Programar servicio
          </button>
        )}
        {puedeReprogramar && (
          <button onClick={abrirReprogramar} className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
            {sol.estado === 'EN_EJECUCION' ? 'Cambiar asignacion' : 'Reprogramar'}
          </button>
        )}
        {puedeCancelar && (
          <button onClick={() => setCancelModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            <XCircleIcon className="w-4 h-4" />
            Cancelar
          </button>
        )}
        {puedeMarcarRevisada && (
          <button onClick={handleMarcarRevisada} disabled={actionLoading} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <CheckIcon className="w-4 h-4" />
            Marcar como revisada
          </button>
        )}
        {puedeReabrir && (
          <button onClick={handleReabrir} disabled={actionLoading} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
            <ArrowUturnLeftIcon className="w-4 h-4" />
            Reabrir
          </button>
        )}
        {puedeProgramar && (
          <button onClick={() => setRechazarModal(true)} className="btn-secondary">
            <NoSymbolIcon className="w-4 h-4" />
            Rechazar
          </button>
        )}
      </div>}

      {/* Historial */}
      {sol.historial?.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            Historial
          </h3>
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
                className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hora inicio</label>
              <input type="time" value={progForm.hora_inicio} onChange={e => setProgForm({...progForm, hora_inicio: e.target.value})}
                className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hora fin</label>
              <input type="time" value={progForm.hora_fin} onChange={e => setProgForm({...progForm, hora_fin: e.target.value})}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Vehiculo ({vehiculosFiltrados.length}{vehiculoSearch ? ` de ${vehiculos.length}` : ''} disponibles)</label>
            <input
              type="text"
              value={vehiculoSearch}
              onChange={e => setVehiculoSearch(e.target.value)}
              placeholder="Buscar por placa, marca o modelo..."
              className="input-field mb-1"
            />
            <select value={progForm.vehiculo_id} onChange={e => setProgForm({...progForm, vehiculo_id: e.target.value})}
              className="input-field" size={Math.min(Math.max(vehiculosFiltrados.length, 3), 6)}>
              <option value="">Seleccionar...</option>
              {vehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Conductor ({conductores.length} disponibles)</label>
            <select value={progForm.conductor_id} onChange={e => setProgForm({...progForm, conductor_id: e.target.value})}
              className="input-field">
              <option value="">Seleccionar...</option>
              {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setProgModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleProgramar} disabled={!progForm.vehiculo_id || !progForm.conductor_id || progLoading}
              className="btn-primary disabled:opacity-50">
              {progLoading ? 'Programando...' : 'Programar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Cancelar */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar Solicitud">
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="3" placeholder="Motivo (min 10 caracteres)..."
          className="input-field mb-3" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setCancelModal(false)} className="btn-secondary">Volver</button>
          <button onClick={handleCancelar} disabled={motivo.length < 10 || actionLoading}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">Confirmar</button>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal open={rechazarModal} onClose={() => setRechazarModal(false)} title="Rechazar Solicitud">
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="3" placeholder="Motivo del rechazo..."
          className="input-field mb-3" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setRechazarModal(false)} className="btn-secondary">Volver</button>
          <button onClick={handleRechazar} disabled={!motivo || actionLoading}
            className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">Rechazar</button>
        </div>
      </Modal>

      {/* Modal Reprogramar */}
      <Modal open={reprogModal} onClose={() => setReprogModal(false)} title="Reprogramar Servicio">
        <p className="text-xs text-gray-500 mb-3">Modifique la fecha, horario, vehiculo o conductor segun la novedad.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Fecha</label>
              <input type="date" value={reprogForm.fecha} onChange={e => setReprogForm({...reprogForm, fecha: e.target.value})}
                className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hora inicio</label>
              <input type="time" value={reprogForm.hora_inicio} onChange={e => setReprogForm({...reprogForm, hora_inicio: e.target.value})}
                className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hora fin</label>
              <input type="time" value={reprogForm.hora_fin} onChange={e => setReprogForm({...reprogForm, hora_fin: e.target.value})}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Vehiculo ({reprogVehiculosFiltrados.length}{reprogVehiculoSearch ? ` de ${reprogVehiculos.length}` : ''} disponibles)</label>
            <input
              type="text"
              value={reprogVehiculoSearch}
              onChange={e => setReprogVehiculoSearch(e.target.value)}
              placeholder="Buscar por placa, marca o modelo..."
              className="input-field mb-1"
            />
            <select value={reprogForm.vehiculo_id} onChange={e => setReprogForm({...reprogForm, vehiculo_id: e.target.value})}
              className="input-field" size={Math.min(Math.max(reprogVehiculosFiltrados.length + (sol.vehiculo ? 1 : 0), 3), 6)}>
              <option value="">Seleccionar...</option>
              {sol.vehiculo && !reprogVehiculos.find(v => v.id === sol.vehiculo.id) && (
                <option value={sol.vehiculo.id}>{sol.vehiculo.placa} — {sol.vehiculo.marca} {sol.vehiculo.modelo} (actual)</option>
              )}
              {reprogVehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Conductor ({reprogConductores.length} disponibles)</label>
            <select value={reprogForm.conductor_id} onChange={e => setReprogForm({...reprogForm, conductor_id: e.target.value})}
              className="input-field">
              <option value="">Seleccionar...</option>
              {sol.conductor && !reprogConductores.find(c => c.id === sol.conductor.id) && (
                <option value={sol.conductor.id}>{sol.conductor.nombre} — {sol.conductor.telefono} (actual)</option>
              )}
              {reprogConductores.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setReprogModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleReprogramar} disabled={!reprogForm.vehiculo_id || !reprogForm.conductor_id || reprogLoading}
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-amber-600 transition-colors">
              {reprogLoading ? 'Reprogramando...' : 'Reprogramar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
