import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BeakerIcon, FunnelIcon, InboxIcon, CalendarDaysIcon, MagnifyingGlassIcon, TableCellsIcon, TruckIcon, PlusIcon, PencilSquareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import Modal from '../../components/Modal';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COMBUSTIBLES = ['GASOLINA', 'DIESEL', 'GAS'];

const FORM_INICIAL = {
  vehiculo_id: '',
  conductor_id: '',
  fecha: new Date().toLocaleDateString('en-CA'),
  tipo_combustible: 'GASOLINA',
  no_ticket: '',
  valor_galon: '',
  galones: '',
  valor_cop: '',
  km_registro: '',
  observaciones: ''
};

export default function Combustible() {
  const [registros, setRegistros] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ vehiculo_id: '', fecha_desde: '', fecha_hasta: '' });
  const [vista, setVista] = useState('todo'); // todo | mes | reporte
  const [busqueda, setBusqueda] = useState('');

  // Modal registrar / editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = crear, id = editar
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState('');

  // Búsqueda de vehículo por placa (dropdown searchable)
  const [vehBusqueda, setVehBusqueda] = useState('');
  const [vehDropdown, setVehDropdown] = useState(false);

  useEffect(() => {
    api.get('/admin/vehiculos').then(r => setVehiculos(r.data)).catch(() => {});
    api.get('/admin/conductores').then(r => setConductores(r.data)).catch(() => {});
  }, []);

  function updateCalc(field, value) {
    const newForm = { ...form, [field]: value };
    if (field === 'valor_galon' || field === 'galones') {
      const vg = parseFloat(field === 'valor_galon' ? value : newForm.valor_galon) || 0;
      const gl = parseFloat(field === 'galones' ? value : newForm.galones) || 0;
      if (vg > 0 && gl > 0) newForm.valor_cop = (vg * gl).toFixed(0);
    }
    setForm(newForm);
  }

  function abrirModal() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormError('');
    setVehBusqueda('');
    setVehDropdown(false);
    setModalOpen(true);
  }

  function abrirEditar(r) {
    const veh = vehiculos.find(v => v.id === r.vehiculo_id);
    setEditandoId(r.id);
    setForm({
      vehiculo_id: r.vehiculo_id || '',
      conductor_id: r.conductor_id || '',
      fecha: r.fecha ? r.fecha.substring(0, 10) : '',
      tipo_combustible: r.tipo_combustible || 'GASOLINA',
      no_ticket: r.no_ticket || '',
      valor_galon: r.valor_galon || '',
      galones: r.galones || '',
      valor_cop: r.valor_cop || '',
      km_registro: r.km_registro || '',
      observaciones: r.observaciones || ''
    });
    setVehBusqueda(veh ? `${veh.placa} — ${veh.marca} ${veh.modelo || ''}`.trim() : (r.placa || ''));
    setVehDropdown(false);
    setFormError('');
    setModalOpen(true);
  }

  function seleccionarVehiculo(v) {
    setForm(f => ({ ...f, vehiculo_id: v.id }));
    setVehBusqueda(`${v.placa} — ${v.marca} ${v.modelo || ''}`.trim());
    setVehDropdown(false);
  }

  const vehiculosFiltrados = vehBusqueda
    ? vehiculos.filter(v => {
        const q = vehBusqueda.toUpperCase();
        return (
          (v.placa || '').toUpperCase().includes(q) ||
          (v.marca || '').toUpperCase().includes(q) ||
          (v.modelo || '').toUpperCase().includes(q)
        );
      })
    : vehiculos;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.vehiculo_id || !form.fecha || !form.galones || !form.valor_cop) {
      setFormError('Vehiculo, fecha, galones y valor total son obligatorios');
      return;
    }
    setEnviando(true);
    try {
      const payload = {
        vehiculo_id: parseInt(form.vehiculo_id),
        conductor_id: form.conductor_id ? parseInt(form.conductor_id) : null,
        fecha: form.fecha,
        tipo_combustible: form.tipo_combustible,
        no_ticket: form.no_ticket || null,
        valor_galon: form.valor_galon ? parseFloat(form.valor_galon) : null,
        galones: parseFloat(form.galones),
        valor_cop: parseFloat(form.valor_cop),
        km_registro: form.km_registro ? parseFloat(form.km_registro) : null,
        observaciones: form.observaciones || null
      };
      if (editandoId) {
        await api.patch(`/admin/combustible/${editandoId}`, payload);
      } else {
        await api.post('/admin/combustible', payload);
      }
      setModalOpen(false);
      await cargar();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => { cargar(); }, [filtro]);

  async function cargar() {
    setLoading(true);
    try {
      const params = {};
      if (filtro.vehiculo_id) params.vehiculo_id = filtro.vehiculo_id;
      if (filtro.fecha_desde) params.fecha_desde = filtro.fecha_desde;
      if (filtro.fecha_hasta) params.fecha_hasta = filtro.fecha_hasta;
      const { data } = await api.get('/admin/combustible', { params });
      setRegistros(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  const filtrados = busqueda ? registros.filter(r => (r.placa || '').toUpperCase().includes(busqueda)) : registros;

  const totalGalones = filtrados.reduce((s, r) => s + parseFloat(r.galones || 0), 0);
  const totalValor = filtrados.reduce((s, r) => s + parseFloat(r.valor_cop || 0), 0);

  // Agrupar por mes
  const porMes = {};
  filtrados.forEach(r => {
    const fecha = r.fecha?.substring(0, 7);
    if (!fecha) return;
    if (!porMes[fecha]) porMes[fecha] = { registros: [], galones: 0, valor: 0 };
    porMes[fecha].registros.push(r);
    porMes[fecha].galones += parseFloat(r.galones || 0);
    porMes[fecha].valor += parseFloat(r.valor_cop || 0);
  });
  const mesesOrdenados = Object.keys(porMes).sort().reverse();

  // Reporte: agrupar por mes + vehiculo
  const reporte = {};
  filtrados.forEach(r => {
    const mes = r.fecha?.substring(0, 7);
    if (!mes) return;
    const key = `${mes}|${r.placa}`;
    if (!reporte[key]) {
      reporte[key] = {
        mes, placa: r.placa, vehiculo_id: r.vehiculo_id,
        tanqueos: 0, galones: 0, valor: 0, valor_galon_sum: 0, valor_galon_count: 0,
        km_min: null, km_max: null, tipo_combustible: r.tipo_combustible
      };
    }
    const rp = reporte[key];
    rp.tanqueos++;
    rp.galones += parseFloat(r.galones || 0);
    rp.valor += parseFloat(r.valor_cop || 0);
    if (r.valor_galon) { rp.valor_galon_sum += parseFloat(r.valor_galon); rp.valor_galon_count++; }
    const km = r.km_registro ? parseFloat(r.km_registro) : null;
    if (km !== null) {
      if (rp.km_min === null || km < rp.km_min) rp.km_min = km;
      if (rp.km_max === null || km > rp.km_max) rp.km_max = km;
    }
  });
  // Agrupar reporte por mes
  const reportePorMes = {};
  Object.values(reporte).forEach(r => {
    if (!reportePorMes[r.mes]) reportePorMes[r.mes] = [];
    reportePorMes[r.mes].push(r);
  });
  const reporteMeses = Object.keys(reportePorMes).sort().reverse();

  function formatMes(ym) {
    const [y, m] = ym.split('-');
    return `${MESES[parseInt(m) - 1]} ${y}`;
  }

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <BeakerIcon className="w-6 h-6 text-primary-600" />
            Combustible
          </h2>
          <p className="text-sm text-gray-500 mt-1">Registro de tanqueos y consumo de combustible</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[
              { key: 'todo', label: 'Todo', icon: TableCellsIcon },
              { key: 'mes', label: 'Por mes', icon: CalendarDaysIcon },
              { key: 'reporte', label: 'Reporte', icon: TruckIcon },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setVista(v.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${vista === v.key ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                <v.icon className="w-4 h-4" />
                {v.label}
              </button>
            ))}
          </div>
          <button onClick={abrirModal} className="btn-primary inline-flex items-center gap-1.5">
            <PlusIcon className="w-4 h-4" />
            Registrar tanqueo
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <FunnelIcon className="w-4 h-4 text-gray-400" />
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Buscar por placa..." value={busqueda}
            onChange={e => setBusqueda(e.target.value.toUpperCase())}
            className="input-field pl-9 w-auto min-w-[180px] font-mono" />
        </div>
        <select value={filtro.vehiculo_id} onChange={e => setFiltro({...filtro, vehiculo_id: e.target.value})} className="input-field w-auto">
          <option value="">Todos los vehiculos</option>
          {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca}</option>)}
        </select>
        <select onChange={e => {
          if (!e.target.value) { setFiltro({...filtro, fecha_desde: '', fecha_hasta: ''}); return; }
          const [y, m] = e.target.value.split('-');
          const desde = `${y}-${m}-01`;
          const hasta = new Date(parseInt(y), parseInt(m), 0).toLocaleDateString('en-CA');
          setFiltro({...filtro, fecha_desde: desde, fecha_hasta: hasta});
        }} className="input-field w-auto">
          <option value="">Mes...</option>
          {(() => {
            const opts = [];
            const now = new Date();
            for (let i = 0; i < 12; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              opts.push(<option key={val} value={val}>{MESES[d.getMonth()]} {d.getFullYear()}</option>);
            }
            return opts;
          })()}
        </select>
        <input type="date" value={filtro.fecha_desde} onChange={e => setFiltro({...filtro, fecha_desde: e.target.value})} className="input-field w-auto" />
        <input type="date" value={filtro.fecha_hasta} onChange={e => setFiltro({...filtro, fecha_hasta: e.target.value})} className="input-field w-auto" />
      </div>

      {filtrados.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{totalGalones.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">Total galones</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">${totalValor.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-500 mt-1">Total invertido</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{filtrados.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total tanqueos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{totalGalones > 0 ? `$${(totalValor / totalGalones).toFixed(0)}` : '-'}</p>
            <p className="text-xs text-gray-500 mt-1">Promedio $/galon</p>
          </div>
        </div>
      )}

      {/* ============ VISTA: TODO ============ */}
      {vista === 'todo' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Placa</th>
                <th className="table-cell">Tipo</th>
                <th className="table-cell">No. Ticket</th>
                <th className="table-cell">$/Galon</th>
                <th className="table-cell">Galones</th>
                <th className="table-cell">Valor Total</th>
                <th className="table-cell">KM</th>
                <th className="table-cell">Conductor</th>
                <th className="table-cell">Obs.</th>
                <th className="table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="px-5 py-8 text-center">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
                </td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="11" className="px-5 py-8 text-center text-gray-400">
                  <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Sin registros
                </td></tr>
              ) : filtrados.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell">{r.fecha?.substring(0, 10)}</td>
                  <td className="table-cell font-medium">{r.placa}</td>
                  <td className="table-cell text-xs">{r.tipo_combustible || '-'}</td>
                  <td className="table-cell text-xs">{r.no_ticket || '-'}</td>
                  <td className="table-cell">{r.valor_galon ? `$${parseFloat(r.valor_galon).toLocaleString('es-CO')}` : '-'}</td>
                  <td className="table-cell">{parseFloat(r.galones).toFixed(1)}</td>
                  <td className="table-cell font-medium">${parseFloat(r.valor_cop).toLocaleString('es-CO')}</td>
                  <td className="table-cell">{r.km_registro ? parseFloat(r.km_registro).toLocaleString() : '-'}</td>
                  <td className="table-cell text-xs">{r.conductor_nombre || '-'}</td>
                  <td className="table-cell text-xs text-gray-400 truncate max-w-[100px]" title={r.observaciones || ''}>{r.observaciones || '-'}</td>
                  <td className="table-cell">
                    <button onClick={() => abrirEditar(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ VISTA: POR MES ============ */}
      {vista === 'mes' && (
        <div className="space-y-6">
          {loading ? (
            <div className="card p-8 text-center">
              <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
            </div>
          ) : mesesOrdenados.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Sin registros
            </div>
          ) : mesesOrdenados.map(mes => (
            <div key={mes} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-primary-500" />
                  {formatMes(mes)}
                </h3>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span><strong className="text-gray-700">{porMes[mes].galones.toFixed(1)}</strong> gal</span>
                  <span><strong className="text-gray-700">${porMes[mes].valor.toLocaleString('es-CO')}</strong></span>
                  <span><strong className="text-gray-700">{porMes[mes].registros.length}</strong> tanqueos</span>
                </div>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-cell">Fecha</th>
                      <th className="table-cell">Placa</th>
                      <th className="table-cell">Tipo</th>
                      <th className="table-cell">No. Ticket</th>
                      <th className="table-cell">$/Galon</th>
                      <th className="table-cell">Galones</th>
                      <th className="table-cell">Valor Total</th>
                      <th className="table-cell">KM</th>
                      <th className="table-cell">Conductor</th>
                      <th className="table-cell"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {porMes[mes].registros.map(r => (
                      <tr key={r.id} className="table-row">
                        <td className="table-cell">{r.fecha?.substring(0, 10)}</td>
                        <td className="table-cell font-medium">{r.placa}</td>
                        <td className="table-cell text-xs">{r.tipo_combustible || '-'}</td>
                        <td className="table-cell text-xs">{r.no_ticket || '-'}</td>
                        <td className="table-cell">{r.valor_galon ? `$${parseFloat(r.valor_galon).toLocaleString('es-CO')}` : '-'}</td>
                        <td className="table-cell">{parseFloat(r.galones).toFixed(1)}</td>
                        <td className="table-cell font-medium">${parseFloat(r.valor_cop).toLocaleString('es-CO')}</td>
                        <td className="table-cell">{r.km_registro ? parseFloat(r.km_registro).toLocaleString() : '-'}</td>
                        <td className="table-cell text-xs">{r.conductor_nombre || '-'}</td>
                        <td className="table-cell">
                          <button onClick={() => abrirEditar(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ MODAL: REGISTRAR TANQUEO ============ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editandoId ? `Editar tanqueo #${editandoId}` : 'Registrar tanqueo'} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{formError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs text-gray-500">Vehiculo *</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={vehBusqueda}
                  onChange={e => {
                    setVehBusqueda(e.target.value.toUpperCase());
                    setVehDropdown(true);
                    if (form.vehiculo_id) setForm(f => ({ ...f, vehiculo_id: '' }));
                  }}
                  onFocus={() => setVehDropdown(true)}
                  onBlur={() => setTimeout(() => setVehDropdown(false), 150)}
                  placeholder="Buscar por placa, marca o modelo..."
                  className="input-field pl-9 font-mono uppercase"
                  autoComplete="off"
                />
              </div>
              {vehDropdown && vehiculosFiltrados.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {vehiculosFiltrados.map(v => (
                    <li
                      key={v.id}
                      onMouseDown={() => seleccionarVehiculo(v)}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${form.vehiculo_id === v.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                    >
                      <span className="font-mono font-semibold">{v.placa}</span>
                      <span className="text-gray-500"> — {v.marca} {v.modelo || ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              {vehDropdown && vehiculosFiltrados.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
                  Sin resultados
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">Conductor (opcional)</label>
              <select value={form.conductor_id} onChange={e => setForm({...form, conductor_id: e.target.value})} className="input-field">
                <option value="">Sin conductor</option>
                {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Tipo combustible *</label>
              <select value={form.tipo_combustible} onChange={e => setForm({...form, tipo_combustible: e.target.value})} className="input-field">
                {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">No. Ticket</label>
              <input type="text" value={form.no_ticket} onChange={e => setForm({...form, no_ticket: e.target.value})} className="input-field" placeholder="Numero de ticket" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Valor x galon ($)</label>
              <input type="number" step="0.01" value={form.valor_galon} onChange={e => updateCalc('valor_galon', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Total galones *</label>
              <input type="number" step="0.1" value={form.galones} onChange={e => updateCalc('galones', e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Valor total tanqueo ($) *</label>
              <input type="number" value={form.valor_cop} onChange={e => setForm({...form, valor_cop: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Kilometraje</label>
              <input type="number" value={form.km_registro} onChange={e => setForm({...form, km_registro: e.target.value})} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} rows="2" className="input-field" placeholder="Observaciones adicionales..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={enviando} className="btn-primary disabled:opacity-50">
              {enviando ? 'Guardando...' : (editandoId ? 'Guardar cambios' : 'Registrar tanqueo')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ VISTA: REPORTE POR VEHICULO ============ */}
      {vista === 'reporte' && (
        <div className="space-y-6">
          {loading ? (
            <div className="card p-8 text-center">
              <div className="animate-spin w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
            </div>
          ) : reporteMeses.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <InboxIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Sin registros
            </div>
          ) : reporteMeses.map(mes => {
            const vehiculosMes = reportePorMes[mes];
            const totalMesGal = vehiculosMes.reduce((s, v) => s + v.galones, 0);
            const totalMesVal = vehiculosMes.reduce((s, v) => s + v.valor, 0);
            const totalMesTanq = vehiculosMes.reduce((s, v) => s + v.tanqueos, 0);
            return (
              <div key={mes} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-primary-500" />
                    {formatMes(mes)}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span><strong className="text-gray-700">{vehiculosMes.length}</strong> vehiculos</span>
                    <span><strong className="text-gray-700">{totalMesTanq}</strong> tanqueos</span>
                    <span><strong className="text-gray-700">{totalMesGal.toFixed(1)}</strong> gal</span>
                    <span><strong className="text-gray-700">${totalMesVal.toLocaleString('es-CO')}</strong></span>
                  </div>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell">Placa</th>
                        <th className="table-cell">Combustible</th>
                        <th className="table-cell">Tanqueos</th>
                        <th className="table-cell">Total Galones</th>
                        <th className="table-cell">Prom. $/Galon</th>
                        <th className="table-cell">Valor Total</th>
                        <th className="table-cell">KM Recorridos</th>
                        <th className="table-cell">Rendimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehiculosMes.sort((a, b) => b.valor - a.valor).map(v => {
                        const promGalon = v.galones > 0 ? (v.valor / v.galones) : 0;
                        const kmRecorridos = (v.km_min !== null && v.km_max !== null && v.km_max > v.km_min) ? (v.km_max - v.km_min) : null;
                        const rendimiento = (kmRecorridos && v.galones > 0) ? (kmRecorridos / v.galones) : null;
                        return (
                          <tr key={v.placa} className="table-row">
                            <td className="table-cell font-mono font-semibold text-primary-600">{v.placa}</td>
                            <td className="table-cell text-xs">{v.tipo_combustible || '-'}</td>
                            <td className="table-cell text-center">{v.tanqueos}</td>
                            <td className="table-cell">{v.galones.toFixed(1)}</td>
                            <td className="table-cell">${promGalon.toFixed(0)}</td>
                            <td className="table-cell font-medium">${v.valor.toLocaleString('es-CO')}</td>
                            <td className="table-cell">{kmRecorridos ? `${kmRecorridos.toLocaleString()} km` : '-'}</td>
                            <td className="table-cell">
                              {rendimiento ? (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rendimiento > 30 ? 'bg-green-50 text-green-700' : rendimiento > 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                  {rendimiento.toFixed(1)} km/gal
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Fila totales */}
                      <tr className="bg-gray-50 font-medium">
                        <td className="table-cell">TOTAL</td>
                        <td className="table-cell"></td>
                        <td className="table-cell text-center">{totalMesTanq}</td>
                        <td className="table-cell">{totalMesGal.toFixed(1)}</td>
                        <td className="table-cell">{totalMesGal > 0 ? `$${(totalMesVal / totalMesGal).toFixed(0)}` : '-'}</td>
                        <td className="table-cell">${totalMesVal.toLocaleString('es-CO')}</td>
                        <td className="table-cell"></td>
                        <td className="table-cell"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
