import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import IngresarCodigoRecuperacion from './pages/IngresarCodigoRecuperacion';
import CambiarPassword from './pages/CambiarPassword';
import NoAutorizado from './pages/NoAutorizado';

// Dependencia
import DepDashboard from './pages/dependencia/Dashboard';
import NuevaSolicitud from './pages/dependencia/NuevaSolicitud';
import ListaSolicitudes from './pages/dependencia/ListaSolicitudes';
import DetalleSolicitud from './pages/dependencia/DetalleSolicitud';
import BaseConocimiento from './pages/dependencia/BaseConocimiento';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminSolicitudes from './pages/admin/Solicitudes';
import DetalleSolicitudAdmin from './pages/admin/DetalleSolicitudAdmin';
import Vehiculos from './pages/admin/Vehiculos';
import DetalleVehiculo from './pages/admin/DetalleVehiculo';
import Conductores from './pages/admin/Conductores';
import DetalleConductor from './pages/admin/DetalleConductor';
import Documentos from './pages/admin/Documentos';
import AdminNovedades from './pages/admin/Novedades';
import AdminCombustible from './pages/admin/Combustible';
import AdminUsuarios from './pages/admin/Usuarios';

// Conversaciones + Estadísticas (compartidas admin + dependencia)
import Conversaciones from './pages/Conversaciones';
import EstadisticasWhatsapp from './pages/EstadisticasWhatsapp';

// Conductor
import ConductorDashboard from './pages/conductor/Dashboard';
import MisServicios from './pages/conductor/MisServicios';
import DetalleServicio from './pages/conductor/DetalleServicio';
import ConductorCombustible from './pages/conductor/Combustible';
import ConductorNovedades from './pages/conductor/Novedades';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/recuperar-password/codigo" element={<IngresarCodigoRecuperacion />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          <Route path="/cambiar-password" element={<CambiarPassword />} />
          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/* Dependencia */}
          <Route path="/solicitudes" element={
            <ProtectedRoute roles={['dependencia']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DepDashboard />} />
            <Route path="nueva" element={<NuevaSolicitud />} />
            <Route path="lista" element={<ListaSolicitudes />} />
            <Route path=":id" element={<DetalleSolicitud />} />
            <Route path="conocimiento" element={<BaseConocimiento />} />
            <Route path="conversaciones" element={<Conversaciones />} />
            <Route path="estadisticas-wa" element={<EstadisticasWhatsapp />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="solicitudes" element={<AdminSolicitudes />} />
            <Route path="solicitudes/:id" element={<DetalleSolicitudAdmin />} />
            <Route path="vehiculos" element={<Vehiculos />} />
            <Route path="vehiculos/:id" element={<DetalleVehiculo />} />
            <Route path="conductores" element={<Conductores />} />
            <Route path="conductores/:id" element={<DetalleConductor />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="novedades" element={<AdminNovedades />} />
            <Route path="combustible" element={<AdminCombustible />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="conversaciones" element={<Conversaciones />} />
            <Route path="estadisticas-wa" element={<EstadisticasWhatsapp />} />
          </Route>

          {/* Conductor */}
          <Route path="/servicios" element={
            <ProtectedRoute roles={['conductor']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ConductorDashboard />} />
            <Route path="lista" element={<MisServicios />} />
            <Route path=":id" element={<DetalleServicio />} />
            <Route path="combustible" element={<ConductorCombustible />} />
            <Route path="novedades" element={<ConductorNovedades />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
