import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardDocumentCheckIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import Modal from '../../components/Modal';

export default function DetalleServicio() {
  const { id } = useParams();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [iniciarModal, setIniciarModal] = useState(false);
  const [finalizarModal, setFinalizarModal] = useState(false);
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { cargar(); }, [id]);

  async function cargar() {
    setLoading(true);
    const { data } = await api.get(`/conductor/servicios/${id}`);
    setServicio(data);
    setLoading(false);
  }

  async function handleIniciar() {
    setActionLoading(true);
    try {
      await api.post(`/conductor/servicios/${id}/iniciar`, { km_inicial: parseFloat(kmInicial) });
      setIniciarModal(false);
      setMsg('Servicio iniciado');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinalizar() {
    setActionLoading(true);
    try {
      await api.post(`/conductor/servicios/${id}/finalizar`, { km_final: parseFloat(kmFinal) });
      setFinalizarModal(false);
      setMsg('Servicio finalizado');
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
  if (!servicio) return <p className="text-red-500">Servicio no encontrado</p>;

  const estado = servicio.estado || servicio.estado_solicitud;
  const puedeIniciar = ['CONFIRMADA', 'PROGRAMADA'].includes(estado);
  const puedeFinalizar = estado === 'EN_EJECUCION';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">{msg}</div>}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-primary-600" />
            Servicio #{servicio.id}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Detalle del servicio asignado</p>
        </div>
        <EstadoBadge estado={estado} />
      </div>

      <div className="card p-5 text-sm space-y-2">
        <p><span className="font-medium text-gray-500">Fecha:</span> {(servicio.fecha || servicio.fecha_servicio)?.substring(0, 10)}</p>
        <p><span className="font-medium text-gray-500">Horario:</span> {servicio.hora_inicio?.substring(0, 5)} - {servicio.hora_fin?.substring(0, 5)}</p>
        <p><span className="font-medium text-gray-500">Origen:</span> {servicio.origen}</p>
        <p><span className="font-medium text-gray-500">Destino:</span> {servicio.destino}</p>
        <p><span className="font-medium text-gray-500">Pasajeros:</span> {servicio.pasajeros}</p>
        {servicio.contacto_nombre && <p><span className="font-medium text-gray-500">Contacto:</span> {servicio.contacto_nombre} — {servicio.contacto_telefono}</p>}
        {servicio.observaciones && <p><span className="font-medium text-gray-500">Obs:</span> {servicio.observaciones}</p>}
        <div className="pt-2 border-t border-gray-100">
          <p><span className="font-medium text-gray-500">Vehiculo:</span> {servicio.placa} — {servicio.marca} {servicio.modelo}</p>
          {servicio.km_inicial && <p><span className="font-medium text-gray-500">KM inicial:</span> {parseFloat(servicio.km_inicial).toLocaleString()}</p>}
          {servicio.km_final && <p><span className="font-medium text-gray-500">KM final:</span> {parseFloat(servicio.km_final).toLocaleString()}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        {puedeIniciar && (
          <button onClick={() => setIniciarModal(true)} className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <PlayIcon className="w-5 h-5" />
            Iniciar Servicio
          </button>
        )}
        {puedeFinalizar && (
          <button onClick={() => setFinalizarModal(true)} className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <StopIcon className="w-5 h-5" />
            Finalizar Servicio
          </button>
        )}
      </div>

      {/* Modal Iniciar */}
      <Modal open={iniciarModal} onClose={() => setIniciarModal(false)} title="Iniciar Servicio">
        <p className="text-sm text-gray-600 mb-3">Ingresa el kilometraje actual del odometro:</p>
        <input type="number" value={kmInicial} onChange={e => setKmInicial(e.target.value)}
          placeholder="Ej: 45230" className="input-field mb-3" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setIniciarModal(false)} className="btn-secondary">Cancelar</button>
          <button onClick={handleIniciar} disabled={!kmInicial || actionLoading}
            className="btn-primary disabled:opacity-50">
            {actionLoading ? 'Iniciando...' : 'Confirmar'}
          </button>
        </div>
      </Modal>

      {/* Modal Finalizar */}
      <Modal open={finalizarModal} onClose={() => setFinalizarModal(false)} title="Finalizar Servicio">
        <p className="text-sm text-gray-600 mb-1">KM inicial registrado: <strong>{servicio.km_inicial ? parseFloat(servicio.km_inicial).toLocaleString() : 'N/A'}</strong></p>
        <p className="text-sm text-gray-600 mb-3">Ingresa el kilometraje final:</p>
        <input type="number" value={kmFinal} onChange={e => setKmFinal(e.target.value)}
          placeholder="Ej: 45280" className="input-field mb-3" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setFinalizarModal(false)} className="btn-secondary">Cancelar</button>
          <button onClick={handleFinalizar} disabled={!kmFinal || actionLoading}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {actionLoading ? 'Finalizando...' : 'Confirmar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
