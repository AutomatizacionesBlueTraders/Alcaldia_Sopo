import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

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
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Confirmar Solicitud</h2>
        <div className="bg-white rounded-lg shadow-sm border p-5 space-y-2 text-sm">
          <p><span className="font-medium">Fecha:</span> {form.fecha_servicio}</p>
          <p><span className="font-medium">Horario:</span> {form.hora_inicio} - {form.hora_fin_estimada || 'N/A'}</p>
          <p><span className="font-medium">Origen:</span> {form.origen}</p>
          <p><span className="font-medium">Destino:</span> {form.destino}</p>
          <p><span className="font-medium">Pasajeros:</span> {form.pasajeros}</p>
          <p><span className="font-medium">Tipo:</span> {form.tipo_servicio || 'N/A'}</p>
          <p><span className="font-medium">Contacto:</span> {form.contacto_nombre} - {form.contacto_telefono}</p>
          {form.observaciones && <p><span className="font-medium">Observaciones:</span> {form.observaciones}</p>}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setConfirmando(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Editar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Confirmar y Enviar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Nueva Solicitud de Transporte</h2>

      <form onSubmit={handlePreview} className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del servicio *</label>
            <input type="date" name="fecha_servicio" value={form.fecha_servicio} onChange={handleChange} required
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
            <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} required
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin estimada</label>
          <input type="time" name="hora_fin_estimada" value={form.hora_fin_estimada} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de salida (origen) *</label>
          <input type="text" name="origen" value={form.origen} onChange={handleChange} required placeholder="Ej: Alcaldía Municipal"
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
          <input type="text" name="destino" value={form.destino} onChange={handleChange} required placeholder="Ej: Gobernación de Cundinamarca"
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pasajeros</label>
            <input type="number" name="pasajeros" value={form.pasajeros} onChange={handleChange} min="1"
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio</label>
            <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              {tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre contacto</label>
            <input type="text" name="contacto_nombre" value={form.contacto_nombre} onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono contacto</label>
            <input type="tel" name="contacto_telefono" value={form.contacto_telefono} onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows="3"
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>

        <button type="submit" className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm hover:bg-primary-700">
          Revisar y Enviar
        </button>
      </form>
    </div>
  );
}
