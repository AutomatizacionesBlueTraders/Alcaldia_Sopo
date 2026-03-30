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

// Admin (placeholder por ahora)
import AdminDashboard from './pages/admin/Dashboard';

// Conductor (placeholder por ahora)
import ConductorDashboard from './pages/conductor/Dashboard';

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
          </Route>

          {/* Conductor */}
          <Route path="/servicios" element={
            <ProtectedRoute roles={['conductor']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ConductorDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
