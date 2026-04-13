import { useState, useEffect, useRef } from 'react';
import { BookOpenIcon, PlusIcon, PencilSquareIcon, TrashIcon, InboxIcon, DocumentArrowDownIcon, PaperClipIcon, XMarkIcon, DocumentTextIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CAT_ICONS = {
  default: DocumentTextIcon,
};

function getFileIcon(nombre) {
  if (!nombre) return null;
  const ext = nombre.split('.').pop().toLowerCase();
  const iconMap = {
    pdf: 'bg-red-100 text-red-600',
    doc: 'bg-blue-100 text-blue-600',
    docx: 'bg-blue-100 text-blue-600',
    xls: 'bg-green-100 text-green-600',
    xlsx: 'bg-green-100 text-green-600',
    jpg: 'bg-purple-100 text-purple-600',
    jpeg: 'bg-purple-100 text-purple-600',
    png: 'bg-purple-100 text-purple-600',
  };
  return iconMap[ext] || 'bg-gray-100 text-gray-600';
}

export default function BaseConocimiento() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', contenido: '', categoria: '' });
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [expandido, setExpandido] = useState(null);
  const fileRef = useRef();

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

  const categorias = [...new Set(items.map(i => i.categoria).filter(Boolean))];

  const filtrados = filtroCategoria
    ? items.filter(i => i.categoria === filtroCategoria)
    : items;

  function abrirNuevo() {
    setForm({ titulo: '', contenido: '', categoria: '' });
    setArchivo(null);
    setEditando(null);
    setShowForm(true);
  }

  function abrirEditar(item) {
    setForm({ titulo: item.titulo, contenido: item.contenido, categoria: item.categoria || '' });
    setArchivo(null);
    setEditando(item.id);
    setShowForm(true);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.contenido.trim()) return;
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('contenido', form.contenido);
      formData.append('categoria', form.categoria);
      if (archivo) formData.append('archivo', archivo);

      if (editando) {
        await api.put(`/conocimiento/${editando}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/conocimiento', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowForm(false);
      setEditando(null);
      setArchivo(null);
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

  async function quitarArchivo(id) {
    if (!confirm('¿Quitar el archivo adjunto?')) return;
    try {
      await api.patch(`/conocimiento/${id}/quitar-archivo`);
      cargar();
    } catch {
      alert('Error al quitar archivo');
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
          <p className="text-sm text-gray-500 mt-1">
            Documentos, preguntas frecuentes e informacion de tu dependencia
          </p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Nueva entrada
        </button>
      </div>

      {/* Filtro por categoria */}
      {categorias.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroCategoria('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !filtroCategoria ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({items.length})
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat === filtroCategoria ? '' : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroCategoria === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat} ({items.filter(i => i.categoria === cat).length})
            </button>
          ))}
        </div>
      )}

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
              list="categorias-list"
            />
            <datalist id="categorias-list">
              {categorias.map(c => <option key={c} value={c} />)}
            </datalist>

            {/* Archivo adjunto */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo adjunto (opcional)</label>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <PaperClipIcon className="w-4 h-4" />
                {archivo ? archivo.name : 'Seleccionar archivo'}
              </button>
              {archivo && (
                <button type="button" onClick={() => setArchivo(null)} className="text-red-500 hover:text-red-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                onChange={e => setArchivo(e.target.files[0] || null)}
              />
            </div>

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

      {/* Lista tipo documento */}
      {filtrados.length === 0 ? (
        <div className="card text-center py-12 px-6">
          <InboxIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No hay entradas aun</p>
          <p className="text-sm text-gray-400">Agrega documentos, preguntas frecuentes, horarios, requisitos u otra informacion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(item => (
            <div key={item.id} className="card overflow-hidden">
              {/* Header del documento */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandido(expandido === item.id ? null : item.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  item.archivo_url ? getFileIcon(item.archivo_nombre) : 'bg-primary-50 text-primary-600'
                }`}>
                  {item.archivo_url
                    ? <DocumentArrowDownIcon className="w-5 h-5" />
                    : <DocumentTextIcon className="w-5 h-5" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800 truncate">{item.titulo}</h3>
                    {item.categoria && (
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full shrink-0">{item.categoria}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.updated_at || item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {item.archivo_nombre && (
                      <span className="ml-2 text-gray-500">
                        <PaperClipIcon className="w-3 h-3 inline -mt-0.5" /> {item.archivo_nombre}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => abrirEditar(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => eliminar(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenido expandible */}
              {expandido === item.id && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/30">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{item.contenido}</p>

                  {item.archivo_url && (
                    <div className="mt-4 flex items-center gap-3">
                      <a
                        href={`${API_BASE}${item.archivo_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-primary-600 font-medium hover:bg-primary-50 hover:border-primary-200 transition-colors"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Descargar {item.archivo_nombre}
                      </a>
                      <button
                        onClick={() => quitarArchivo(item.id)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resumen */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <FolderOpenIcon className="w-4 h-4" />
        {items.length} {items.length === 1 ? 'entrada' : 'entradas'} en total
        {items.filter(i => i.archivo_url).length > 0 && (
          <span> · {items.filter(i => i.archivo_url).length} con archivo adjunto</span>
        )}
      </div>
    </div>
  );
}
