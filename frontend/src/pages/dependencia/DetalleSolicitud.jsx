import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardDocumentListIcon, ArrowsRightLeftIcon, XCircleIcon, ClockIcon, ArrowLeftIcon, PencilSquareIcon, CheckIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import Modal from '../../components/Modal';

export default function DetalleSolicitud() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sol, setSol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [depDestino, setDepDestino] = useState('');
  const [deps, setDeps] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(location.state?.created ? 'Solicitud creada exitosamente' : '');

  useEffect(() => {
    cargar();
    api.get('/catalogos/dependencias').then(r => setDeps(r.data));
  }, [id]);

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await api.get(`/solicitudes/${id}`);
      setSol(data);
    } finally {
      setLoading(false);
    }
  }

  function iniciarEdicion() {
    setEditForm({
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
      await api.patch(`/solicitudes/${id}`, editForm);
      setEditando(false);
      setMsg('Solicitud actualizada');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAprobar() {
    setActionLoading(true);
    try {
      await api.patch(`/solicitudes/${id}/aprobar`);
      setMsg('Solicitud aprobada y enviada al administrador');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al aprobar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelar() {
    setActionLoading(true);
    try {
      await api.patch(`/solicitudes/${id}/cancelar`, { motivo });
      setCancelModal(false);
      setMotivo('');
      setMsg('Solicitud cancelada');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTransferir() {
    setActionLoading(true);
    try {
      await api.post(`/solicitudes/${id}/transferir`, { dependencia_destino_id: parseInt(depDestino), motivo });
      setTransferModal(false);
      setMotivo('');
      setMsg('Solicitud transferida');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
    </div>
  );
  if (!sol) return <p className="text-red-500">Solicitud no encontrada</p>;

  const puedeAprobar = sol.estado === 'RECIBIDA';
  const puedeCancelar = ['RECIBIDA', 'PENDIENTE_PROGRAMACION'].includes(sol.estado);
  const puedeTransferir = ['RECIBIDA', 'PENDIENTE_PROGRAMACION'].includes(sol.estado);
  const puedeEditar = !['CANCELADA', 'RECHAZADA', 'FINALIZADA'].includes(sol.estado);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <p className="text-sm text-gray-500 mt-1">Detalle y seguimiento de la solicitud</p>
        </div>
        <EstadoBadge estado={sol.estado} />
      </div>

      {/* Datos — modo vista o edicion */}
      {editando ? (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
        <div className="card p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
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
          {sol.descripcion_recorrido && <p><span className="font-medium text-gray-500">Descripcion del recorrido:</span> {sol.descripcion_recorrido}</p>}
          {sol.nombre_paciente && sol.nombre_paciente !== 'N/a' && <p><span className="font-medium text-gray-500">Paciente:</span> {sol.nombre_paciente}</p>}
          {sol.observaciones && <p><span className="font-medium text-gray-500">Observaciones:</span> {sol.observaciones}</p>}

          {sol.estado === 'CANCELADA' && sol.motivo_cancelacion && (
            <div className="pt-3 border-t border-red-100 bg-red-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
              <p className="font-medium text-red-700 mb-1">Motivo de cancelacion</p>
              <p className="text-red-600">{sol.motivo_cancelacion}</p>
            </div>
          )}

          {sol.vehiculo && (
            <div className="pt-3 border-t border-gray-100">
              <p className="font-medium text-gray-700 mb-1">Asignacion</p>
              <p>Vehiculo: {sol.vehiculo.placa} — {sol.vehiculo.marca} {sol.vehiculo.modelo}</p>
              <p>Conductor: {sol.conductor?.nombre}</p>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      {!editando && (
        <div className="flex gap-3 flex-wrap">
          {puedeAprobar && (
            <button onClick={handleAprobar} disabled={actionLoading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              <PaperAirplaneIcon className="w-4 h-4" />
              {actionLoading ? 'Enviando...' : 'Aprobar y enviar al administrador'}
            </button>
          )}
          {puedeEditar && (
            <button onClick={iniciarEdicion} className="inline-flex items-center gap-2 px-4 py-2.5 border border-primary-200 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors">
              <PencilSquareIcon className="w-4 h-4" />
              Editar datos
            </button>
          )}
          {puedeCancelar && (
            <button onClick={() => setCancelModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
              <XCircleIcon className="w-4 h-4" />
              Cancelar solicitud
            </button>
          )}
          {puedeTransferir && (
            <button onClick={() => setTransferModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-200 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors">
              <ArrowsRightLeftIcon className="w-4 h-4" />
              Transferir
            </button>
          )}
        </div>
      )}

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

      {/* Modal Cancelar */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar Solicitud">
        <p className="text-sm text-gray-600 mb-3">Ingresa el motivo de la cancelacion (minimo 10 caracteres):</p>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="3"
          className="input-field mb-3" placeholder="Motivo de cancelacion..." />
        <div className="flex justify-end gap-2">
          <button onClick={() => setCancelModal(false)} className="btn-secondary">Volver</button>
          <button onClick={handleCancelar} disabled={motivo.length < 10 || actionLoading}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
            {actionLoading ? 'Cancelando...' : 'Confirmar cancelacion'}
          </button>
        </div>
      </Modal>

      {/* Modal Transferir */}
      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Transferir Solicitud">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dependencia destino:</label>
            <select value={depDestino} onChange={e => setDepDestino(e.target.value)}
              className="input-field">
              <option value="">Seleccionar...</option>
              {deps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Motivo:</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="2"
              className="input-field" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setTransferModal(false)} className="btn-secondary">Volver</button>
            <button onClick={handleTransferir} disabled={!depDestino || !motivo || actionLoading}
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors">
              {actionLoading ? 'Transfiriendo...' : 'Confirmar transferencia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
