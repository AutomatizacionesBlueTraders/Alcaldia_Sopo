import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import NoAutorizado from './pages/NoAutorizado';

// Dependencia
import DepDashboard from './pages/dependencia/Dashboard';
import NuevaSolicitud from './pages/dependencia/NuevaSolicitud';
import ListaSolicitudes from './pages/dependencia/ListaSolicitudes';
import DetalleSolicitud from './pages/dependencia/DetalleSolicitud';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminSolicitudes from './pages/admin/Solicitudes';
import DetalleSolicitudAdmin from './pages/admin/DetalleSolicitudAdmin';
import Vehiculos from './pages/admin/Vehiculos';
import Conductores from './pages/admin/Conductores';
import Documentos from './pages/admin/Documentos';
import AdminNovedades from './pages/admin/Novedades';
import AdminCombustible from './pages/admin/Combustible';

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
            <Route path="conductores" element={<Conductores />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="novedades" element={<AdminNovedades />} />
            <Route path="combustible" element={<AdminCombustible />} />
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
