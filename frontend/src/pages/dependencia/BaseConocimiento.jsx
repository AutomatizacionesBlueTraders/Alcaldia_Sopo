import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function BaseConocimiento() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', contenido: '', categoria: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      const { data } = await api.get('/conocimiento');
      setItems(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  function abrirNuevo() {
    setForm({ titulo: '', contenido: '', categoria: '' });
    setEditando(null);
    setShowForm(true);
  }

  function abrirEditar(item) {
    setForm({ titulo: item.titulo, contenido: item.contenido, categoria: item.categoria || '' });
    setEditando(item.id);
    setShowForm(true);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.contenido.trim()) return;
    setGuardando(true);
    try {
      if (editando) {
        await api.put(`/conocimiento/${editando}`, form);
      } else {
        await api.post('/conocimiento', form);
      }
      setShowForm(false);
      setEditando(null);
      cargar();
    } catch {
      alert('Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    try {
      await api.delete(`/conocimiento/${id}`);
      cargar();
    } catch {
      alert('Error al eliminar');
    }
  }

  if (loading) return <p className="text-gray-500 text-center py-8">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Base de Conocimiento</h1>
          <p className="text-sm text-gray-500">Preguntas frecuentes e información de tu dependencia para el bot de WhatsApp</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700"
        >
          + Nueva entrada
        </button>
      </div>

      {/* Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardar} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{editando ? 'Editar entrada' : 'Nueva entrada'}</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Título / Pregunta</label>
            <input
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: ¿Cómo solicitar transporte?"
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido / Respuesta</label>
            <textarea
              value={form.contenido}
              onChange={e => setForm({ ...form, contenido: e.target.value })}
              placeholder="Escribe aquí toda la información relevante..."
              rows={6}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (opcional)</label>
            <input
              value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value })}
              placeholder="Ej: Horarios, Requisitos, Trámites..."
              className="w-full border rounded px-3 py-2 text-sm mb-4"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-400 mb-2">No hay entradas aún</p>
          <p className="text-sm text-gray-400">Agrega preguntas frecuentes, horarios, requisitos u otra información que el bot pueda usar para responder consultas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-800">{item.titulo}</h3>
                    {item.categoria && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.categoria}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{item.contenido}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.updated_at || item.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => abrirEditar(item)} className="text-xs text-primary-600 hover:underline">Editar</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => eliminar(item.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
