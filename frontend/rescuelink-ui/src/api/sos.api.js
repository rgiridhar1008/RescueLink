import api from './client';

export async function triggerSOS(payload) {
  const { data } = await api.post('/sos/trigger', payload);
  return data;
}

export async function fetchMySOSHistory(userId) {
  if (!userId) return [];
  const { data } = await api.get('/sos/my', { params: { userId } });
  return Array.isArray(data) ? data : [];
}

export async function fetchUserSOSHistory(userId) {
  const { data } = await api.get(`/sos/user/${userId}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminAlerts() {
  const { data } = await api.get('/admin/alerts');
  return Array.isArray(data) ? data : [];
}
