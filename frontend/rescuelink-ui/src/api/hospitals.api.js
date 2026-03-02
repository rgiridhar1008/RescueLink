import api from './client';

export async function fetchHospitals(params = {}) {
  const { data } = await api.get('/hospitals', { params });
  return Array.isArray(data) ? data : [];
}
