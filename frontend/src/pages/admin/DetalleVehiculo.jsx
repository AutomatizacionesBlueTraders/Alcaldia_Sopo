import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TruckIcon, ArrowLeftIcon, ClockIcon, CheckCircleIcon, InboxIcon, DocumentTextIcon, PlusIcon, PencilSquareIcon, PhotoIcon, BeakerIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import EstadoBadge from '../../components/EstadoBadge';
import Modal from '../../components/Modal';
import WeekCalendar from '../../components/WeekCalendar';

const ALERTA_ACEITE = {
  ok:                      { txt: 'OK',          bg: 'bg-green-50 text-green-700',  bar: 'bg-green-500' },
  proximo:                 { txt: 'Próximo',     bg: 'bg-amber-50 text-amber-700',  bar: 'bg-amber-500' },
  vencido:                 { txt: 'Vencido',     bg: 'bg-red-50 text-red-700',      bar: 'bg-red-500'   },
  sin_cambio_registrado:   { txt: 'Sin registro', bg: 'bg-gray-50 text-gray-500',   bar: 'bg-gray-300'  },
};

function Campo({ label, value }) {
  if (!value || value === 'N/A') return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

export default function DetalleVehiculo() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ficha');

  // Documentos
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [editDocModal, setEditDocModal] = useState(false);
  const [verImagen, setVerImagen] = useState(null);
  const [docForm, setDocForm] = useState({ tipo: 'soat', fecha_expedicion: '', fecha_vencimiento: '', estado: 'vigente', soporte_imagen: '' });
  const [editDocForm, setEditDocForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef();
  const editFileRef = useRef();

  // Aceite
  const [aceiteEstado, setAceiteEstado] = useState(null);
  const [aceiteHist, setAceiteHist] = useState([]);
  const [aceiteLoading, setAceiteLoading] = useState(false);
  const [aceiteModal, setAceiteModal] = useState(false);
  const [aceiteForm, setAceiteForm] = useState({ fecha: new Date().toLocaleDateString('en-CA'), km_cambio: '', tipo_aceite: '', taller: '', costo: '', observaciones: '' });
  const [aceiteError, setAceiteError] = useState('');
  const [aceiteGuardando, setAceiteGuardando] = useState(false);

  // Calendario
  const [reservasCal, setReservasCal] = useState([]);
  const [rangoCal, setRangoCal] = useState(null);

  useEffect(() => { cargar(); }, [id]);

  async function cargar() {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/admin/vehiculos/${id}/historial`);
      setData(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function cargarDocs() {
    setDocsLoading(true);
    try {
      const { data } = await api.get('/admin/documentos', { params: { vehiculo_id: id } });
      setDocs(data);
    } catch {}
    setDocsLoading(false);
  }

  async function cargarAceite() {
    setAceiteLoading(true);
    try {
      const [estado, hist] = await Promise.all([
        api.get('/admin/aceite'),
        api.get(`/admin/aceite/vehiculo/${id}/historial`)
      ]);
      const mio = estado.data.find(e => e.id === parseInt(id));
      setAceiteEstado(mio || null);
      setAceiteHist(hist.data);
    } catch {} finally {
      setAceiteLoading(false);
    }
  }

  const cargarCalendario = useCallback(async (desde, hasta) => {
    try {
      const { data: r } = await api.get(`/admin/vehiculos/${id}/calendario`, { params: { desde, hasta } });
      setReservasCal(r);
    } catch {}
  }, [id]);

  useEffect(() => {
    if (tab === 'documentos') cargarDocs();
    if (tab === 'aceite') cargarAceite();
  }, [tab]);

  useEffect(() => {
    if (tab === 'calendario' && rangoCal) cargarCalendario(rangoCal.desde, rangoCal.hasta);
  }, [tab, rangoCal, cargarCalendario]);

  async function guardarCambioAceite(e) {
    e.preventDefault();
    setAceiteError('');
    if (!aceiteForm.fecha || !aceiteForm.km_cambio) {
      setAceiteError('Fecha y kilometraje son obligatorios');
      return;
    }
    setAceiteGuardando(true);
    try {
      await api.post('/admin/aceite', {
        vehiculo_id: parseInt(id),
        fecha: aceiteForm.fecha,
        km_cambio: parseInt(aceiteForm.km_cambio),
        tipo_aceite: aceiteForm.tipo_aceite || null,
        taller: aceiteForm.taller || null,
        costo: aceiteForm.costo ? parseFloat(aceiteForm.costo) : null,
        observaciones: aceiteForm.observaciones || null
      });
      setAceiteModal(false);
      setAceiteForm({ fecha: new Date().toLocaleDateString('en-CA'), km_cambio: '', tipo_aceite: '', taller: '', costo: '', observaciones: '' });
      await cargarAceite();
    } catch (err) {
      setAceiteError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setAceiteGuardando(false);
    }
  }

  function abrirModalAceite() {
    setAceiteForm({
      fecha: new Date().toLocaleDateString('en-CA'),
      km_cambio: aceiteEstado?.km_actual || '',
      tipo_aceite: '', taller: '', costo: '', observaciones: ''
    });
    setAceiteError('');
    setAceiteModal(true);
  }

  function leerArchivo(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
  }

  async function handleGuardarDoc() {
    if (!docForm.fecha_vencimiento) return;
    setGuardando(true);
    try {
      await api.post('/admin/documentos', { ...docForm, vehiculo_id: parseInt(id) });
      setDocModal(false);
      setDocForm({ tipo: 'soat', fecha_expedicion: '', fecha_vencimiento: '', estado: 'vigente', soporte_imagen: '' });
      if (fileRef.current) fileRef.current.value = '';
      cargarDocs();
    } finally { setGuardando(false); }
  }

  function abrirEditarDoc(doc) {
    setEditDocForm({
      id: doc.id,
      tipo: doc.tipo,
      fecha_expedicion: doc.fecha_expedicion?.substring(0, 10) || '',
      fecha_vencimiento: doc.fecha_vencimiento?.substring(0, 10) || '',
      estado: doc.estado,
      soporte_imagen: doc.soporte_imagen || ''
    });
    setEditDocModal(true);
  }

  async function handleActualizarDoc() {
    if (!editDocForm.fecha_vencimiento) return;
    setGuardando(true);
    try {
      await api.patch(`/admin/documentos/${editDocForm.id}`, editDocForm);
      setEditDocModal(false);
      setEditDocForm(null);
      if (editFileRef.current) editFileRef.current.value = '';
      cargarDocs();
    } finally { setGuardando(false); }
  }

  const semaforo = (estado) => {
    if (estado === 'vigente') return 'bg-green-100 text-green-700';
    if (estado === 'por_vencer') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
    </div>
  );
  if (!data) return <p className="text-red-500">Vehiculo no encontrado</p>;

  const { vehiculo, completados, pendientes, conductor_actual } = data;
  const v = vehiculo;

  const estadoColor = {
    disponible: 'bg-green-100 text-green-700',
    en_servicio: 'bg-indigo-100 text-indigo-700',
    mantenimiento: 'bg-yellow-100 text-yellow-700',
    inactivo: 'bg-gray-100 text-gray-600',
  };

  const servicios = tab === 'pendientes' ? pendientes : tab === 'historial' ? completados : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/admin/vehiculos" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a vehiculos
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="page-title flex items-center gap-2">
              <TruckIcon className="w-6 h-6 text-primary-600" />
              {v.placa}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {v.clase_vehiculo || v.tipo} — {v.marca} {v.linea || v.modelo} ({v.anio})
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[v.estado] || 'bg-gray-100'}`}>{v.estado}</span>
              <span className="text-sm text-gray-500">KM: <span className="font-mono font-medium text-gray-700">{parseFloat(v.km_actual || 0).toLocaleString()}</span></span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Servicios realizados</p>
            <p className="text-2xl font-bold text-primary-600">{completados.length}</p>
          </div>
        </div>

        {conductor_actual && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Conductor asignado actualmente</p>
            <Link to={`/admin/conductores/${conductor_actual.id}`} className="text-sm text-primary-600 hover:underline">
              {conductor_actual.nombre} — {conductor_actual.telefono}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {[
          { key: 'ficha', label: 'Ficha tecnica', icon: DocumentTextIcon },
          { key: 'documentos', label: 'Documentos', icon: DocumentTextIcon },
          { key: 'aceite', label: 'Aceite', icon: BeakerIcon },
          { key: 'calendario', label: 'Calendario', icon: CalendarDaysIcon },
          { key: 'pendientes', label: `Pendientes (${pendientes.length})`, icon: ClockIcon },
          { key: 'historial', label: `Historial (${completados.length})`, icon: CheckCircleIcon },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== FICHA TECNICA ===== */}
      {tab === 'ficha' && (
        <div className="card p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Identificacion</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Campo label="Placa" value={v.placa} />
              <Campo label="Placa inventario" value={v.placa_inventario} />
              <Campo label="No. Licencia transito" value={v.no_licencia_transito} />
              <Campo label="VIN" value={v.vin} />
              <Campo label="No. Motor" value={v.motor} />
              <Campo label="No. Chasis" value={v.chasis} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Clasificacion</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Campo label="Clase vehiculo" value={v.clase_vehiculo} />
              <Campo label="Marca" value={v.marca} />
              <Campo label="Linea" value={v.linea || v.modelo} />
              <Campo label="Modelo (año)" value={v.anio} />
              <Campo label="Tipo servicio" value={v.tipo_servicio} />
              <Campo label="Tipo" value={v.tipo} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Especificaciones</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Campo label="Cilindraje (cc)" value={v.cilindraje} />
              <Campo label="Cap. pasajeros" value={v.capacidad_pasajeros} />
              <Campo label="Cap. toneladas" value={v.capacidad_toneladas} />
              <Campo label="Tipo carroceria" value={v.tipo_carroceria} />
              <Campo label="Combustible" value={v.tipo_combustible} />
              <Campo label="KM actual" value={parseFloat(v.km_actual || 0).toLocaleString()} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Administrativo</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Campo label="Propiedad" value={v.propiedad} />
              <Campo label="Custodia administrativa" value={v.custodia_administrativa} />
              <Campo label="Uso operativo" value={v.uso_operativo} />
              <Campo label="Fecha matricula" value={v.fecha_matricula} />
              <Campo label="Sec. transito" value={v.sec_transito} />
              <Campo label="Cod. Fasecolda" value={v.cod_fasecolda} />
              <Campo label="Valor asegurado" value={v.valor_asegurado ? `$${parseFloat(v.valor_asegurado).toLocaleString()}` : null} />
            </div>
          </div>
          {(v.descripcion || v.observaciones) && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notas</p>
              {v.descripcion && <div className="mb-3"><p className="text-xs font-medium text-gray-400">Descripcion</p><p className="text-sm text-gray-700 whitespace-pre-line">{v.descripcion}</p></div>}
              {v.observaciones && <div><p className="text-xs font-medium text-gray-400">Observaciones</p><p className="text-sm text-gray-700 whitespace-pre-line">{v.observaciones}</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ===== DOCUMENTOS ===== */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setDocModal(true)} className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              Nuevo documento
            </button>
          </div>

          {docsLoading ? (
            <div className="card p-8 text-center">
              <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
            </div>
          ) : docs.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Sin documentos registrados</p>
              <p className="text-xs mt-1">Agrega SOAT, seguro o tecnomecanica</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map(d => (
                <div key={d.id} className="card p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 uppercase">{d.tipo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${semaforo(d.estado)}`}>{d.estado}</span>
                    </div>
                    <button onClick={() => abrirEditarDoc(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm space-y-1">
                    {d.fecha_expedicion && <p><span className="text-gray-400 text-xs">Expedicion:</span> {d.fecha_expedicion?.substring(0, 10)}</p>}
                    <p><span className="text-gray-400 text-xs">Vencimiento:</span> <span className="font-medium">{d.fecha_vencimiento?.substring(0, 10)}</span></p>
                  </div>
                  {d.soporte_imagen ? (
                    <button onClick={() => setVerImagen(d.soporte_imagen)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:underline text-xs">
                      <PhotoIcon className="w-3.5 h-3.5" />
                      Ver soporte
                    </button>
                  ) : (
                    <p className="text-xs text-gray-300">Sin soporte adjunto</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modal Nuevo Doc */}
          <Modal open={docModal} onClose={() => setDocModal(false)} title="Nuevo Documento">
            <div className="space-y-3">
              <select value={docForm.tipo} onChange={e => setDocForm({...docForm, tipo: e.target.value})} className="input-field">
                <option value="soat">SOAT</option>
                <option value="seguro">Seguro</option>
                <option value="tecnomecanica">Tecnomecanica</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Expedicion</label>
                  <input type="date" value={docForm.fecha_expedicion} onChange={e => setDocForm({...docForm, fecha_expedicion: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Vencimiento *</label>
                  <input type="date" value={docForm.fecha_vencimiento} onChange={e => setDocForm({...docForm, fecha_vencimiento: e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Imagen del documento (opcional)</label>
                <input ref={fileRef} type="file" accept="image/*"
                  onChange={e => leerArchivo(e.target.files[0], b64 => setDocForm({...docForm, soporte_imagen: b64}))}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm" />
                {docForm.soporte_imagen && <img src={docForm.soporte_imagen} alt="Vista previa" className="mt-2 max-h-32 rounded-lg border border-gray-200" />}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDocModal(false)} className="btn-secondary">Cancelar</button>
                <button onClick={handleGuardarDoc} disabled={!docForm.fecha_vencimiento || guardando} className="btn-primary disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Modal Editar Doc */}
          {editDocForm && (
            <Modal open={editDocModal} onClose={() => setEditDocModal(false)} title="Editar Documento">
              <div className="space-y-3">
                <select value={editDocForm.tipo} onChange={e => setEditDocForm({...editDocForm, tipo: e.target.value})} className="input-field">
                  <option value="soat">SOAT</option>
                  <option value="seguro">Seguro</option>
                  <option value="tecnomecanica">Tecnomecanica</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Expedicion</label>
                    <input type="date" value={editDocForm.fecha_expedicion} onChange={e => setEditDocForm({...editDocForm, fecha_expedicion: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Vencimiento *</label>
                    <input type="date" value={editDocForm.fecha_vencimiento} onChange={e => setEditDocForm({...editDocForm, fecha_vencimiento: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Estado</label>
                  <select value={editDocForm.estado} onChange={e => setEditDocForm({...editDocForm, estado: e.target.value})} className="input-field">
                    <option value="vigente">Vigente</option>
                    <option value="por_vencer">Por vencer</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Imagen del documento</label>
                  <input ref={editFileRef} type="file" accept="image/*"
                    onChange={e => leerArchivo(e.target.files[0], b64 => setEditDocForm({...editDocForm, soporte_imagen: b64}))}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm" />
                  {editDocForm.soporte_imagen && <img src={editDocForm.soporte_imagen} alt="Vista previa" className="mt-2 max-h-32 rounded-lg border border-gray-200" />}
                  {editDocForm.soporte_imagen && <button onClick={() => setEditDocForm({...editDocForm, soporte_imagen: ''})} className="text-xs text-red-500 hover:underline mt-1">Quitar imagen</button>}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditDocModal(false)} className="btn-secondary">Cancelar</button>
                  <button onClick={handleActualizarDoc} disabled={!editDocForm.fecha_vencimiento || guardando} className="btn-primary disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Modal Ver imagen */}
          <Modal open={!!verImagen} onClose={() => setVerImagen(null)} title="Soporte del documento">
            {verImagen && (
              <div className="text-center">
                <img src={verImagen} alt="Soporte" className="max-w-full max-h-96 mx-auto rounded-lg border border-gray-200" />
                <a href={verImagen} download="soporte_documento.png" className="mt-3 inline-block text-sm text-primary-600 hover:underline">Descargar imagen</a>
              </div>
            )}
          </Modal>
        </div>
      )}

      {/* ===== ACEITE ===== */}
      {tab === 'aceite' && (
        <div className="space-y-4">
          {aceiteLoading ? (
            <div className="card p-8 text-center">
              <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
            </div>
          ) : (
            <>
              {/* Card estado */}
              <div className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado del aceite</p>
                    {aceiteEstado && (
                      <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${(ALERTA_ACEITE[aceiteEstado.alerta] || ALERTA_ACEITE.sin_cambio_registrado).bg}`}>
                        {(ALERTA_ACEITE[aceiteEstado.alerta] || ALERTA_ACEITE.sin_cambio_registrado).txt}
                      </span>
                    )}
                  </div>
                  <button onClick={abrirModalAceite} className="btn-primary">
                    <PlusIcon className="w-4 h-4" />
                    Registrar cambio
                  </button>
                </div>

                {aceiteEstado ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Intervalo</p>
                        <p className="font-semibold text-gray-700">{Number(aceiteEstado.km_intervalo_aceite).toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Último cambio</p>
                        <p className="font-semibold text-gray-700">
                          {aceiteEstado.km_ultimo_cambio != null ? `${Number(aceiteEstado.km_ultimo_cambio).toLocaleString()} km` : 'Nunca'}
                        </p>
                        {aceiteEstado.fecha_ultimo_cambio && (
                          <p className="text-xs text-gray-400">{aceiteEstado.fecha_ultimo_cambio.substring(0, 10)}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">KM actual</p>
                        <p className="font-semibold text-gray-700">{Number(aceiteEstado.km_actual).toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">KM desde cambio</p>
                        <p className="font-semibold text-gray-700">
                          {aceiteEstado.km_desde_cambio != null ? `${Number(aceiteEstado.km_desde_cambio).toLocaleString()} km` : '-'}
                        </p>
                      </div>
                    </div>

                    {aceiteEstado.progreso != null && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progreso hasta próximo cambio</span>
                          <span>{Math.round(aceiteEstado.progreso * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className={`h-full ${(ALERTA_ACEITE[aceiteEstado.alerta] || ALERTA_ACEITE.sin_cambio_registrado).bar} transition-all`}
                            style={{ width: `${Math.min(100, Math.round(aceiteEstado.progreso * 100))}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin datos de aceite disponibles</p>
                )}
              </div>

              {/* Historial */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">Historial de cambios</p>
                </div>
                {aceiteHist.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <BeakerIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Sin registros previos
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell">Fecha</th>
                        <th className="table-cell">KM</th>
                        <th className="table-cell">Tipo aceite</th>
                        <th className="table-cell">Taller</th>
                        <th className="table-cell">Costo</th>
                        <th className="table-cell">Obs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aceiteHist.map(h => (
                        <tr key={h.id} className="table-row">
                          <td className="table-cell">{h.fecha?.substring(0, 10)}</td>
                          <td className="table-cell font-mono">{Number(h.km_cambio).toLocaleString()}</td>
                          <td className="table-cell text-xs">{h.tipo_aceite || '-'}</td>
                          <td className="table-cell text-xs">{h.taller || '-'}</td>
                          <td className="table-cell text-xs">{h.costo ? `$${Number(h.costo).toLocaleString('es-CO')}` : '-'}</td>
                          <td className="table-cell text-xs text-gray-500 max-w-[200px] truncate" title={h.observaciones || ''}>{h.observaciones || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Modal registrar cambio */}
          <Modal open={aceiteModal} onClose={() => setAceiteModal(false)} title="Registrar cambio de aceite">
            <form onSubmit={guardarCambioAceite} className="space-y-4">
              {aceiteError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{aceiteError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Fecha *</label>
                  <input type="date" value={aceiteForm.fecha} onChange={e => setAceiteForm({...aceiteForm, fecha: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Kilometraje al cambio *</label>
                  <input type="number" value={aceiteForm.km_cambio} onChange={e => setAceiteForm({...aceiteForm, km_cambio: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tipo de aceite</label>
                  <input type="text" value={aceiteForm.tipo_aceite} onChange={e => setAceiteForm({...aceiteForm, tipo_aceite: e.target.value})} className="input-field" placeholder="Ej: 15W-40 sintetico" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Taller</label>
                  <input type="text" value={aceiteForm.taller} onChange={e => setAceiteForm({...aceiteForm, taller: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Costo ($)</label>
                  <input type="number" value={aceiteForm.costo} onChange={e => setAceiteForm({...aceiteForm, costo: e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Observaciones</label>
                <textarea value={aceiteForm.observaciones} onChange={e => setAceiteForm({...aceiteForm, observaciones: e.target.value})} rows="2" className="input-field" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setAceiteModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={aceiteGuardando} className="btn-primary disabled:opacity-50">
                  {aceiteGuardando ? 'Guardando...' : 'Registrar cambio'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ===== CALENDARIO ===== */}
      {tab === 'calendario' && (
        <WeekCalendar
          reservas={reservasCal}
          tipo="vehiculo"
          onChangeRango={({ desde, hasta }) => setRangoCal({ desde, hasta })}
        />
      )}

      {/* ===== SERVICIOS (pendientes/historial) ===== */}
      {(tab === 'pendientes' || tab === 'historial') && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Horario</th>
                <th className="table-cell">Origen</th>
                <th className="table-cell">Destino</th>
                <th className="table-cell">Conductor</th>
                <th className="table-cell">Estado</th>
                {tab === 'historial' && <th className="table-cell">KM</th>}
                <th className="table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {servicios.length === 0 ? (
                <tr><td colSpan={tab === 'historial' ? 8 : 7} className="px-5 py-8 text-center text-gray-400">
                  <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  {tab === 'pendientes' ? 'Sin servicios pendientes' : 'Sin servicios realizados'}
                </td></tr>
              ) : servicios.map(s => (
                <tr key={s.asignacion_id} className="table-row">
                  <td className="table-cell">{s.fecha?.split('T')[0]}</td>
                  <td className="table-cell text-xs">{s.hora_inicio?.substring(0, 5)} - {s.hora_fin?.substring(0, 5)}</td>
                  <td className="table-cell">{s.origen}</td>
                  <td className="table-cell">{s.destino}</td>
                  <td className="table-cell">
                    <Link to={`/admin/conductores/${s.conductor_id}`} className="text-primary-600 hover:underline">{s.conductor_nombre}</Link>
                  </td>
                  <td className="table-cell"><EstadoBadge estado={s.estado_solicitud} /></td>
                  {tab === 'historial' && (
                    <td className="table-cell text-xs text-gray-500">
                      {s.km_inicial && s.km_final ? `${parseFloat(s.km_final - s.km_inicial).toLocaleString()} km` : '--'}
                    </td>
                  )}
                  <td className="table-cell">
                    <Link to={`/admin/solicitudes/${s.solicitud_id}`} className="text-primary-600 hover:underline text-xs font-medium">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
