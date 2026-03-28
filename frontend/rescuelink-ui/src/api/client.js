import axios from 'axios';

const defaultBaseUrl = process.env.REACT_APP_API_BASE_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : '/api');

const api = axios.create({
  baseURL: defaultBaseUrl,
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
