import axios from 'axios';

// En dev o EasyPanel se usa el proxy /api (vite.config.js o nginx).
// En Vercel se setea VITE_API_BASE_URL con la URL absoluta del backend.
const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
