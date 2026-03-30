import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import NoAutorizado from './pages/NoAutorizado';
import AdminDashboard from './pages/admin/Dashboard';
import DependenciaDashboard from './pages/dependencia/Dashboard';
import ConductorDashboard from './pages/conductor/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/* Admin */}
          <Route path="/admin/*" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Dependencia */}
          <Route path="/solicitudes/*" element={
            <ProtectedRoute roles={['dependencia']}>
              <DependenciaDashboard />
            </ProtectedRoute>
          } />

          {/* Conductor */}
          <Route path="/servicios/*" element={
            <ProtectedRoute roles={['conductor']}>
              <ConductorDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
