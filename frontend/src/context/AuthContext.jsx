import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// window.name es per-pestaña REAL: no se hereda al abrir una nueva pestaña con
// Ctrl+Click o target=_blank (a diferencia de sessionStorage). Al montar, si la
// pestaña no tiene marca pero sí hay tokens en sessionStorage, esos tokens fueron
// heredados de otra pestaña y los descartamos para que cada dependencia tenga
// su propia sesión aislada.
const TAB_MARKER_PREFIX = 'sopo-tab-';
function ensureTabIsolation() {
  if (!window.name || !window.name.startsWith(TAB_MARKER_PREFIX)) {
    const heredaTokens = sessionStorage.getItem('accessToken');
    if (heredaTokens) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
    window.name = TAB_MARKER_PREFIX + (crypto.randomUUID?.() || Date.now());
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const { data } = await api.get('/auth/me');
    setUser(data);
    return data;
  }

  useEffect(() => {
    ensureTabIsolation();
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      refreshMe()
        .catch(() => {
          sessionStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    sessionStorage.clear();
    setUser(null);
  }

  // Cambio de contraseña (usuario autenticado). Si debe_cambiar_password=true,
  // el backend no exige la actual.
  async function updatePassword({ nueva_password, password_actual }) {
    await api.post('/auth/change-password', { nueva_password, password_actual });
    // Refresca /me para limpiar el flag debe_cambiar_password.
    try { await refreshMe(); } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updatePassword, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
