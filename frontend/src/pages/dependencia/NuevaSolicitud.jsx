import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { PaperAirplaneIcon, PencilIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [form, setForm] = useState({
    descripcion_recorrido: '',
    origen: '',
    destino: '',
    pasajeros: 1,
    horario_solicitud: '',
    nombre_solicitante: '',
    telefono_solicitante: '',
    nombre_paciente: '',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePreview(e) {
    e.preventDefault();
    setError('');
    if (!form.origen || !form.destino || !form.horario_solicitud || !form.nombre_solicitante || !form.telefono_solicitante) {
      setError('Completa los campos obligatorios');
      return;
    }
    setConfirmando(true);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data } = await api.post('/solicitudes', form);
      navigate(`/solicitudes/${data.id}`, { state: { created: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear');
      setConfirmando(false);
    } finally {
      setLoading(false);
    }
  }

  if (confirmando) {
    const items = [
      { label: 'Dependencia', value: user?.dependencia_nombre || user?.nombre || '—' },
      { label: 'Descripción del recorrido', value: form.descripcion_recorrido || 'N/A' },
      { label: 'Lugar de salida', value: form.origen },
      { label: 'Destino del servicio', value: form.destino },
      { label: 'Número de pasajeros', value: form.pasajeros },
      { label: 'Horario de la solicitud', value: form.horario_solicitud },
      { label: 'Solicitante', value: `${form.nombre_solicitante} — ${form.telefono_solicitante}` },
      { label: 'Nombre del paciente', value: form.nombre_paciente || 'N/A' },
    ];

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h2 className="page-title">Confirmar Solicitud</h2>
          <p className="text-gray-500 text-sm mt-1">Revisa los datos antes de enviar</p>
        </div>
        <div className="card p-6 space-y-3">
          {items.map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfirmando(false)} className="btn-secondary flex-1 justify-center">
            <PencilIcon className="w-4 h-4" /> Editar
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <><CheckCircleIcon className="w-4 h-4" /> Confirmar y Enviar</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="page-title">Nueva Solicitud de Transporte</h2>
        <p className="text-gray-500 text-sm mt-1">
          Dependencia: <span className="font-semibold text-primary-700">{user?.dependencia_nombre || user?.nombre}</span>
        </p>
      </div>

      <form onSubmit={handlePreview} className="card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción del recorrido</label>
          <textarea name="descripcion_recorrido" value={form.descripcion_recorrido} onChange={handleChange}
            rows="3" placeholder="Describe brevemente el motivo y detalles del recorrido" className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lugar de salida *</label>
            <input type="text" name="origen" value={form.origen} onChange={handleChange} required
              placeholder="Ej: Alcaldía Municipal" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Destino del servicio *</label>
            <input type="text" name="destino" value={form.destino} onChange={handleChange} required
              placeholder="Ej: Gobernación de Cundinamarca" className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de pasajeros</label>
            <input type="number" name="pasajeros" value={form.pasajeros} onChange={handleChange} min="1" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horario de la solicitud *</label>
            <input type="text" name="horario_solicitud" value={form.horario_solicitud} onChange={handleChange} required
              placeholder="Ej: 8:00 AM, 2:30 PM" className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de quien solicita *</label>
            <input type="text" name="nombre_solicitante" value={form.nombre_solicitante} onChange={handleChange} required
              placeholder="Nombre completo" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono de contacto *</label>
            <input type="tel" name="telefono_solicitante" value={form.telefono_solicitante} onChange={handleChange} required
              placeholder="3001234567" className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del paciente</label>
          <input type="text" name="nombre_paciente" value={form.nombre_paciente} onChange={handleChange}
            placeholder="Si aplica, nombre del paciente" className="input-field" />
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3">
          <PaperAirplaneIcon className="w-4 h-4" />
          Revisar y Enviar
        </button>
      </form>
    </div>
  );
}
