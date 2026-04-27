import { useEffect, useMemo, useState } from 'react';
import {
  PlusIcon, EnvelopeIcon, CheckCircleIcon, XCircleIcon,
  MagnifyingGlassIcon, ArrowPathIcon, UserIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/axios';
import Modal from '../../components/Modal';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'dependencia', label: 'Dependencia' },
  { value: 'conductor', label: 'Conductor' },
];

const FORM_VACIO = { email: '', nombre: '', rol: 'dependencia', dependencia_id: '' };

function RolBadge({ rol }) {
  const styles = {
    admin: 'bg-purple-50 text-purple-700 ring-purple-200',
    dependencia: 'bg-blue-50 text-blue-700 ring-blue-200',
    conductor: 'bg-amber-50 text-amber-700 ring-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles[rol] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
      {rol}
    </span>
  );
}

function EstadoBadge({ activo, emailVerificado }) {
  if (!activo) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200">Desactivado</span>;
  }
  if (!emailVerificado) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">Invitación pendiente</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-200">Activo</span>;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [dependencias, setDependencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos'); // 'todos' | 'true' | 'false'
  const [q, setQ] = useState('');

  const [modalCrear, setModalCrear] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  async function cargarTodo() {
    setCargando(true);
    setError('');
    try {
      const [uResp, dResp] = await Promise.all([
        api.get('/auth/users'),
        api.get('/catalogos/dependencias'),
      ]);
      setUsuarios(uResp.data || []);
      setDependencias(dResp.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarTodo(); }, []);

  const filtrados = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRol && u.rol !== filtroRol) return false;
      if (filtroActivo !== 'todos' && String(u.activo) !== filtroActivo) return false;
      if (qLower && !(u.nombre.toLowerCase().includes(qLower) || u.email.toLowerCase().includes(qLower))) return false;
      return true;
    });
  }, [usuarios, filtroRol, filtroActivo, q]);

  async function crearUsuario(e) {
    e.preventDefault();
    setMensaje('');
    setCreando(true);
    try {
      await api.post('/auth/users', {
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        rol: form.rol,
        dependencia_id: Number(form.dependencia_id),
      });
      setMensaje('Usuario creado. Se envió un correo con el enlace para configurar contraseña.');
      setForm(FORM_VACIO);
      setModalCrear(false);
      await cargarTodo();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo crear el usuario';
      setMensaje(`Error: ${msg}`);
    } finally {
      setCreando(false);
    }
  }

  async function reenviarInvitacion(id) {
    if (!confirm('¿Reenviar el correo de invitación? El enlace anterior quedará invalidado.')) return;
    try {
      await api.post(`/auth/users/${id}/resend-invite`);
      setMensaje('Invitación reenviada.');
    } catch (err) {
      setMensaje(`Error: ${err?.response?.data?.error || 'No se pudo reenviar'}`);
    }
  }

  async function toggleActivo(u) {
    const nuevo = !u.activo;
    if (!confirm(nuevo ? '¿Reactivar este usuario?' : '¿Desactivar este usuario? No podrá iniciar sesión.')) return;
    try {
      await api.patch(`/auth/users/${u.id}`, { activo: nuevo });
      await cargarTodo();
      setMensaje(nuevo ? 'Usuario reactivado.' : 'Usuario desactivado.');
    } catch (err) {
      setMensaje(`Error: ${err?.response?.data?.error || 'No se pudo actualizar'}`);
    }
  }

  async function cambiarDependencia(u, nuevaDep) {
    try {
      await api.patch(`/auth/users/${u.id}`, { dependencia_id: Number(nuevaDep) });
      await cargarTodo();
    } catch (err) {
      setMensaje(`Error: ${err?.response?.data?.error || 'No se pudo cambiar la dependencia'}`);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra cuentas del sistema. Al crear un usuario, recibirá un correo para configurar su contraseña.
          </p>
        </div>
        <button onClick={() => setModalCrear(true)} className="btn-primary">
          <PlusIcon className="w-5 h-5" />
          Nuevo usuario
        </button>
      </div>

      {mensaje && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${mensaje.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="input-field pl-9"
          />
        </div>
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="input-field max-w-[180px]">
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)} className="input-field max-w-[180px]">
          <option value="todos">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Desactivados</option>
        </select>
        <button onClick={cargarTodo} className="btn-secondary" title="Refrescar">
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {error && <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>}
        {cargando ? (
          <div className="p-10 text-center text-gray-500 text-sm">Cargando usuarios…</div>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">Sin usuarios para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Dependencia</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Último login</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                          {(u.nombre || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{u.nombre}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                    <td className="px-4 py-3">
                      <select
                        value={u.dependencia_id || ''}
                        onChange={(e) => cambiarDependencia(u, e.target.value)}
                        className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={!u.activo}
                      >
                        <option value="">— sin asignar —</option>
                        {dependencias.map((d) => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={u.activo} emailVerificado={u.email_verificado} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.ultimo_login
                        ? new Date(u.ultimo_login).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {!u.email_verificado && u.activo && (
                          <button
                            onClick={() => reenviarInvitacion(u.id)}
                            title="Reenviar invitación"
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleActivo(u)}
                          title={u.activo ? 'Desactivar' : 'Reactivar'}
                          className={`p-1.5 rounded-md ${u.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {u.activo ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo usuario">
        <form onSubmit={crearUsuario} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="input-field"
              required
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia *</label>
            <select
              value={form.dependencia_id}
              onChange={(e) => setForm({ ...form, dependencia_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">— seleccionar —</option>
              {dependencias.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Todo usuario debe estar asociado a una dependencia.</p>
          </div>

          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs border border-blue-100">
            <EnvelopeIcon className="w-4 h-4 inline mr-1" />
            El usuario recibirá un correo con un enlace para definir su contraseña. El enlace expira en 1 hora.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalCrear(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando} className="btn-primary">
              {creando ? 'Creando…' : 'Crear y enviar invitación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
