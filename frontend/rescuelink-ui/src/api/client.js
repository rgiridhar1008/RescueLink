import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const authRaw = localStorage.getItem('auth');
  if (authRaw) {
    try {
      const auth = JSON.parse(authRaw);
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch {
      // ignore malformed auth storage
    }
  }
  return config;
});

export default api;
