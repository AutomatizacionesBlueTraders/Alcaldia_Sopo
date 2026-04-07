import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PaperAirplaneIcon, PencilIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const [tiposServicio, setTiposServicio] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [form, setForm] = useState({
    fecha_servicio: '',
    hora_inicio: '',
    hora_fin_estimada: '',
    origen: '',
    destino: '',
    pasajeros: 1,
    tipo_servicio: '',
    contacto_nombre: '',
    contacto_telefono: '',
    observaciones: '',
  });

  useEffect(() => {
    api.get('/catalogos/tipos-servicio').then(r => setTiposServicio(r.data));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePreview(e) {
    e.preventDefault();
    setError('');
    if (!form.fecha_servicio || !form.hora_inicio || !form.origen || !form.destino) {
      setError('Completa los campos obligatorios');
      return;
    }
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    if (new Date(form.fecha_servicio) < new Date(manana.toISOString().split('T')[0])) {
      setError('La fecha debe ser a partir de mañana');
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
      { label: 'Fecha', value: form.fecha_servicio },
      { label: 'Horario', value: `${form.hora_inicio} - ${form.hora_fin_estimada || 'N/A'}` },
      { label: 'Origen', value: form.origen },
      { label: 'Destino', value: form.destino },
      { label: 'Pasajeros', value: form.pasajeros },
      { label: 'Tipo', value: form.tipo_servicio || 'N/A' },
      { label: 'Contacto', value: `${form.contacto_nombre} - ${form.contacto_telefono}` },
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
              <span className="text-sm font-medium text-gray-900">{value}</span>
            </div>
          ))}
          {form.observaciones && (
            <div className="pt-2">
              <span className="text-sm text-gray-500">Observaciones</span>
              <p className="text-sm text-gray-700 mt-1">{form.observaciones}</p>
            </div>
          )}
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
        <p className="text-gray-500 text-sm mt-1">Completa el formulario para solicitar un servicio</p>
      </div>

      <form onSubmit={handlePreview} className="card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha del servicio *</label>
            <input type="date" name="fecha_servicio" value={form.fecha_servicio} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora inicio *</label>
            <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} required className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora fin estimada</label>
          <input type="time" name="hora_fin_estimada" value={form.hora_fin_estimada} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lugar de salida (origen) *</label>
          <input type="text" name="origen" value={form.origen} onChange={handleChange} required placeholder="Ej: Alcaldía Municipal" className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Destino *</label>
          <input type="text" name="destino" value={form.destino} onChange={handleChange} required placeholder="Ej: Gobernación de Cundinamarca" className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pasajeros</label>
            <input type="number" name="pasajeros" value={form.pasajeros} onChange={handleChange} min="1" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de servicio</label>
            <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange} className="input-field">
              <option value="">Seleccionar...</option>
              {tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre contacto</label>
            <input type="text" name="contacto_nombre" value={form.contacto_nombre} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono contacto</label>
            <input type="tel" name="contacto_telefono" value={form.contacto_telefono} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
          <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows="3" className="input-field" />
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3">
          <PaperAirplaneIcon className="w-4 h-4" />
          Revisar y Enviar
        </button>
      </form>
    </div>
  );
}
