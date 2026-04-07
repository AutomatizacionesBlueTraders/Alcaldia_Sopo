import { useState, useEffect } from 'react';
import { BookOpenIcon, PlusIcon, PencilSquareIcon, TrashIcon, InboxIcon } from '@heroicons/react/24/outline';
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

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6 text-primary-600" />
            Base de Conocimiento
          </h1>
          <p className="text-sm text-gray-500 mt-1">Preguntas frecuentes e informacion de tu dependencia para el bot de WhatsApp</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Nueva entrada
        </button>
      </div>

      {/* Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardar} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="section-title mb-4">{editando ? 'Editar entrada' : 'Nueva entrada'}</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo / Pregunta</label>
            <input
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: ¿Como solicitar transporte?"
              className="input-field mb-3"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido / Respuesta</label>
            <textarea
              value={form.contenido}
              onChange={e => setForm({ ...form, contenido: e.target.value })}
              placeholder="Escribe aqui toda la informacion relevante..."
              rows={6}
              className="input-field mb-3"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opcional)</label>
            <input
              value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value })}
              placeholder="Ej: Horarios, Requisitos, Tramites..."
              className="input-field mb-4"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="btn-primary disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <div className="card text-center py-12 px-6">
          <InboxIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No hay entradas aun</p>
          <p className="text-sm text-gray-400">Agrega preguntas frecuentes, horarios, requisitos u otra informacion que el bot pueda usar para responder consultas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card card-hover p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-800">{item.titulo}</h3>
                    {item.categoria && (
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{item.categoria}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{item.contenido}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.updated_at || item.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => abrirEditar(item)} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => eliminar(item.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                    <TrashIcon className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
