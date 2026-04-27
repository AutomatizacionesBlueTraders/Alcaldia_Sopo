import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si debe cambiar contraseña, forzar redirección a /cambiar-password
  // (salvo que ya estemos allí, para evitar bucles).
  if (user.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}
