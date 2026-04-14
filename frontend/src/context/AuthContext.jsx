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

  useEffect(() => {
    ensureTabIsolation();
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
