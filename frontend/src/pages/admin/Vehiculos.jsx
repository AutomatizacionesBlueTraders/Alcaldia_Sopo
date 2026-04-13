import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import { PlusIcon, TruckIcon, PencilSquareIcon, TrashIcon, FunnelIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ESTADOS = ['disponible', 'en_servicio', 'mantenimiento', 'inactivo'];

const ESTADO_BADGE = {
  disponible: 'bg-green-50 text-green-700 ring-green-200',
  en_servicio: 'bg-blue-50 text-blue-700 ring-blue-200',
  mantenimiento: 'bg-amber-50 text-amber-700 ring-amber-200',
  inactivo: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const CLASES = ['AUTOMOVIL', 'CAMPERO', 'CAMIONETA', 'CAMION', 'BUS', 'BUSETA', 'MOTOCICLETA', 'VOLQUETA', 'TRACTOR', 'RETROEXCAVADORA', 'MOTONIVELADORA', 'VIBROCOMPACTADORA', 'PLANTA ELECTRICA', 'REMOLQUE', 'OTRO'];
const COMBUSTIBLES = ['GASOLINA', 'DIESEL', 'ELECTRICO', 'GAS', 'N/A'];
const TIPOS_SERVICIO = ['OFICIAL', 'PARTICULAR', 'PUBLICO', 'N/A'];
const CARROCERIAS = ['SEDAN', 'HATCH BACK', 'WAGON', 'CABINADO', 'DOBLE CABINA', 'DOBLE CABINA CON PLATON', 'CERRADA', 'FURGON', 'PLATON', 'VOLCO', 'PANEL', 'NIVELADORA', 'TRACTOR', 'RECOLECTOR COMPACTADOR', 'SIN CARROCERIA', 'OTRO'];

const FORM_VACIO = {
  placa: '', tipo: 'vehiculo', marca: '', modelo: '', anio: '', estado: 'disponible', km_actual: 0,
  placa_inventario: '', propiedad: 'MUNICIPIO DE SOPO', custodia_administrativa: '', uso_operativo: '',
  no_licencia_transito: '', tipo_servicio: '', clase_vehiculo: '', linea: '',
  motor: '', chasis: '', vin: '', cilindraje: '', capacidad_toneladas: '', capacidad_pasajeros: '',
  tipo_carroceria: '', tipo_combustible: '', fecha_matricula: '', sec_transito: '',
  descripcion: '', cod_fasecolda: '', valor_asegurado: '', observaciones: '',
  km_intervalo_aceite: 5000
};

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { cargar(); }, [filtro]);

  async function cargar() {
    setLoading(true);
    const params = {};
    if (filtro.tipo) params.tipo = filtro.tipo;
    if (filtro.estado) params.estado = filtro.estado;
    params.activo = 'true';
    const { data } = await api.get('/admin/vehiculos', { params });
    setVehiculos(data);
    setLoading(false);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ ...FORM_VACIO });
    setModal(true);
  }

  function abrirEditar(v) {
    setEditando(v.id);
    const f = { ...FORM_VACIO };
    Object.keys(f).forEach(k => { if (v[k] !== undefined && v[k] !== null) f[k] = v[k]; });
    setForm(f);
    setModal(true);
  }

  async function handleGuardar() {
    const payload = { ...form };
    // Convertir numericos
    if (payload.cilindraje) payload.cilindraje = parseInt(payload.cilindraje) || null;
    if (payload.capacidad_toneladas) payload.capacidad_toneladas = parseFloat(payload.capacidad_toneladas) || null;
    if (payload.capacidad_pasajeros) payload.capacidad_pasajeros = parseInt(payload.capacidad_pasajeros) || null;
    if (payload.valor_asegurado) payload.valor_asegurado = parseFloat(payload.valor_asegurado) || null;
    if (payload.km_intervalo_aceite) payload.km_intervalo_aceite = parseInt(payload.km_intervalo_aceite) || 5000;
    // Limpiar vacios
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });

    if (editando) {
      await api.patch(`/admin/vehiculos/${editando}`, payload);
    } else {
      await api.post('/admin/vehiculos', payload);
    }
    setModal(false);
    cargar();
  }

  async function handleDesactivar(id) {
    if (!confirm('Desactivar este vehiculo?')) return;
    await api.delete(`/admin/vehiculos/${id}`);
    cargar();
  }

  const f = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Vehiculos</h2>
          <p className="text-gray-500 text-sm mt-1">{vehiculos.length} vehiculos registrados</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Nuevo Vehiculo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <FunnelIcon className="w-4 h-4 text-gray-400" />
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value.toUpperCase())}
            className="input-field pl-9 w-auto min-w-[180px] font-mono"
          />
        </div>
        <select value={filtro.tipo} onChange={e => setFiltro({...filtro, tipo: e.target.value})} className="input-field w-auto min-w-[150px]">
          <option value="">Todos los tipos</option>
          <option value="vehiculo">Vehiculo</option>
          <option value="maquinaria">Maquinaria</option>
        </select>
        <select value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})} className="input-field w-auto min-w-[160px]">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Tabla — solo campos principales */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Placa</th>
              <th className="table-cell">Clase</th>
              <th className="table-cell">Marca</th>
              <th className="table-cell">Linea</th>
              <th className="table-cell">Modelo</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">KM</th>
              <th className="table-cell text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="px-5 py-10 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
              </td></tr>
            ) : vehiculos.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">
                <TruckIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No hay vehiculos
              </td></tr>
            ) : vehiculos.filter(v => !busqueda || v.placa.toUpperCase().includes(busqueda)).map(v => (
              <tr key={v.id} className="table-row">
                <td className="table-cell">
                  <Link to={`/admin/vehiculos/${v.id}`} className="font-mono font-semibold text-primary-600 hover:text-primary-700">{v.placa}</Link>
                </td>
                <td className="table-cell text-xs">{v.clase_vehiculo || v.tipo}</td>
                <td className="table-cell">{v.marca}</td>
                <td className="table-cell text-xs text-gray-500">{v.linea || v.modelo}</td>
                <td className="table-cell">{v.anio}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${ESTADO_BADGE[v.estado] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.estado === 'disponible' ? 'bg-green-500' : v.estado === 'en_servicio' ? 'bg-blue-500' : v.estado === 'mantenimiento' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    {v.estado}
                  </span>
                </td>
                <td className="table-cell font-mono text-xs">{parseFloat(v.km_actual || 0).toLocaleString()}</td>
                <td className="table-cell text-right">
                  <button onClick={() => abrirEditar(v)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors mr-1" title="Editar">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDesactivar(v.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Desactivar">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Vehiculo' : 'Nuevo Vehiculo'} wide>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identificacion</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Placa *</label>
              <input type="text" value={form.placa} onChange={e => f('placa', e.target.value)} className="input-field font-mono uppercase" disabled={!!editando} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Placa inventario</label>
              <input type="text" value={form.placa_inventario || ''} onChange={e => f('placa_inventario', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">No. Licencia transito</label>
              <input type="text" value={form.no_licencia_transito || ''} onChange={e => f('no_licencia_transito', e.target.value)} className="input-field" />
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Clasificacion</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => f('tipo', e.target.value)} className="input-field">
                <option value="vehiculo">Vehiculo</option>
                <option value="maquinaria">Maquinaria</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Clase vehiculo</label>
              <select value={form.clase_vehiculo || ''} onChange={e => f('clase_vehiculo', e.target.value)} className="input-field">
                <option value="">Seleccionar...</option>
                {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo servicio</label>
              <select value={form.tipo_servicio || ''} onChange={e => f('tipo_servicio', e.target.value)} className="input-field">
                <option value="">Seleccionar...</option>
                {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Datos del vehiculo</p>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Marca *</label>
              <input type="text" value={form.marca} onChange={e => f('marca', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Linea</label>
              <input type="text" value={form.linea || ''} onChange={e => f('linea', e.target.value)} className="input-field" placeholder="Ej: PRADO, XTZ250" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Modelo (año) *</label>
              <input type="number" value={form.anio} onChange={e => f('anio', e.target.value)} className="input-field" placeholder="2024" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cilindraje</label>
              <input type="number" value={form.cilindraje || ''} onChange={e => f('cilindraje', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">No. Motor</label>
              <input type="text" value={form.motor || ''} onChange={e => f('motor', e.target.value)} className="input-field font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">No. Chasis</label>
              <input type="text" value={form.chasis || ''} onChange={e => f('chasis', e.target.value)} className="input-field font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
              <input type="text" value={form.vin || ''} onChange={e => f('vin', e.target.value)} className="input-field font-mono text-xs" />
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Capacidad y carroceria</p>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cap. pasajeros</label>
              <input type="number" value={form.capacidad_pasajeros || ''} onChange={e => f('capacidad_pasajeros', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cap. toneladas</label>
              <input type="number" step="0.01" value={form.capacidad_toneladas || ''} onChange={e => f('capacidad_toneladas', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo carroceria</label>
              <select value={form.tipo_carroceria || ''} onChange={e => f('tipo_carroceria', e.target.value)} className="input-field">
                <option value="">Seleccionar...</option>
                {CARROCERIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Combustible</label>
              <select value={form.tipo_combustible || ''} onChange={e => f('tipo_combustible', e.target.value)} className="input-field">
                <option value="">Seleccionar...</option>
                {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cambio aceite cada (km)</label>
              <input type="number" step="500" value={form.km_intervalo_aceite || ''} onChange={e => f('km_intervalo_aceite', e.target.value)} className="input-field" placeholder="5000" />
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Administrativo</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Propiedad</label>
              <input type="text" value={form.propiedad || ''} onChange={e => f('propiedad', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Custodia administrativa</label>
              <input type="text" value={form.custodia_administrativa || ''} onChange={e => f('custodia_administrativa', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Uso operativo</label>
              <input type="text" value={form.uso_operativo || ''} onChange={e => f('uso_operativo', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha matricula</label>
              <input type="text" value={form.fecha_matricula || ''} onChange={e => f('fecha_matricula', e.target.value)} className="input-field" placeholder="DD/MM/AAAA" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sec. transito</label>
              <input type="text" value={form.sec_transito || ''} onChange={e => f('sec_transito', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cod. Fasecolda</label>
              <input type="text" value={form.cod_fasecolda || ''} onChange={e => f('cod_fasecolda', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor asegurado</label>
              <input type="number" value={form.valor_asegurado || ''} onChange={e => f('valor_asegurado', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select value={form.estado} onChange={e => f('estado', e.target.value)} className="input-field">
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">KM actual</label>
              <input type="number" value={form.km_actual} onChange={e => f('km_actual', e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
            <textarea value={form.descripcion || ''} onChange={e => f('descripcion', e.target.value)} rows="2" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
            <textarea value={form.observaciones || ''} onChange={e => f('observaciones', e.target.value)} rows="2" className="input-field" />
          </div>

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleGuardar} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
