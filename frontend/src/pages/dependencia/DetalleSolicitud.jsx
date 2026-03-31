import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import Modal from '../../components/Modal';

export default function DetalleSolicitud() {
  const { id } = useParams();
  const location = useLocation();
  const [sol, setSol] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!sol) return <p className="text-red-500">Solicitud no encontrada</p>;

  const puedeCancelar = ['ENVIADA', 'PENDIENTE_PROGRAMACION'].includes(sol.estado);
  const puedeTransferir = ['ENVIADA', 'PENDIENTE_PROGRAMACION'].includes(sol.estado);

  return (
    <div className="max-w-2xl mx-auto">
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{msg}</div>}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Solicitud #{sol.id}</h2>
        <EstadoBadge estado={sol.estado} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-5 space-y-3 text-sm mb-4">
        <div className="grid grid-cols-2 gap-3">
          <p><span className="font-medium text-gray-500">Fecha:</span> {sol.fecha_servicio?.substring(0, 10)}</p>
          <p><span className="font-medium text-gray-500">Horario:</span> {sol.hora_inicio?.substring(0, 5)} - {sol.hora_fin_estimada?.substring(0, 5) || 'N/A'}</p>
          <p><span className="font-medium text-gray-500">Origen:</span> {sol.origen}</p>
          <p><span className="font-medium text-gray-500">Destino:</span> {sol.destino}</p>
          <p><span className="font-medium text-gray-500">Pasajeros:</span> {sol.pasajeros}</p>
          <p><span className="font-medium text-gray-500">Tipo:</span> {sol.tipo_servicio || 'N/A'}</p>
          <p><span className="font-medium text-gray-500">Contacto:</span> {sol.contacto_nombre}</p>
          <p><span className="font-medium text-gray-500">Teléfono:</span> {sol.contacto_telefono}</p>
          <p><span className="font-medium text-gray-500">Canal:</span> {sol.canal}</p>
        </div>
        {sol.observaciones && <p><span className="font-medium text-gray-500">Observaciones:</span> {sol.observaciones}</p>}

        {sol.vehiculo && (
          <div className="pt-3 border-t">
            <p className="font-medium text-gray-700 mb-1">Asignación</p>
            <p>Vehículo: {sol.vehiculo.placa} — {sol.vehiculo.marca} {sol.vehiculo.modelo}</p>
            <p>Conductor: {sol.conductor?.nombre}</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      {(puedeCancelar || puedeTransferir) && (
        <div className="flex gap-3 mb-4">
          {puedeCancelar && (
            <button onClick={() => setCancelModal(true)} className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">
              Cancelar solicitud
            </button>
          )}
          {puedeTransferir && (
            <button onClick={() => setTransferModal(true)} className="px-4 py-2 border border-amber-300 text-amber-600 rounded text-sm hover:bg-amber-50">
              Transferir
            </button>
          )}
        </div>
      )}

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

      {/* Modal Cancelar */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar Solicitud">
        <p className="text-sm text-gray-600 mb-3">Ingresa el motivo de la cancelación (mínimo 10 caracteres):</p>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="3"
          className="w-full border rounded-md px-3 py-2 text-sm mb-3" placeholder="Motivo de cancelación..." />
        <div className="flex justify-end gap-2">
          <button onClick={() => setCancelModal(false)} className="px-4 py-2 border rounded text-sm">Volver</button>
          <button onClick={handleCancelar} disabled={motivo.length < 10 || actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">
            {actionLoading ? 'Cancelando...' : 'Confirmar cancelación'}
          </button>
        </div>
      </Modal>

      {/* Modal Transferir */}
      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Transferir Solicitud">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dependencia destino:</label>
            <select value={depDestino} onChange={e => setDepDestino(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Seleccionar...</option>
              {deps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Motivo:</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows="2"
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setTransferModal(false)} className="px-4 py-2 border rounded text-sm">Volver</button>
            <button onClick={handleTransferir} disabled={!depDestino || !motivo || actionLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded text-sm disabled:opacity-50">
              {actionLoading ? 'Transfiriendo...' : 'Confirmar transferencia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
