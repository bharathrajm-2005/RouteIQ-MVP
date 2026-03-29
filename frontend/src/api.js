import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('routeiq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('routeiq_token');
      localStorage.removeItem('routeiq_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

// ─── SHIPMENTS ──────────────────────────────────────
export const shipmentApi = {
  create: (data) => api.post('/api/shipments', data),
  list: () => api.get('/api/shipments'),
  recent: () => api.get('/api/shipments/recent'),
  summary: () => api.get('/api/shipments/summary'),
};

// ─── ALERTS ─────────────────────────────────────────
export const alertApi = {
  list: () => api.get('/api/alerts'),
  unread: () => api.get('/api/alerts/unread'),
  count: () => api.get('/api/alerts/count'),
  markRead: (id) => api.put(`/api/alerts/${id}/read`),
};

// ─── RECOMMENDATIONS ────────────────────────────────
export const recommendApi = {
  get: (originPin, destPin, weightKg) =>
    api.get('/api/recommend', { params: { originPin, destPin, weightKg } }),
};

// ─── CARBON ─────────────────────────────────────────
export const carbonApi = {
  calculate: (data) => api.post('/api/carbon/calculate', data),
  report: (month, year) => api.get('/api/carbon/report', { params: { month, year } }),
};

// ─── NL QUERY ───────────────────────────────────────
export const queryApi = {
  ask: (question, pageContext) =>
    api.post('/api/query', { question, pageContext }),
};

export default api;
