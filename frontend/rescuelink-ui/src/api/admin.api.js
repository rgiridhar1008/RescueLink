import api from './client';

export async function fetchUsers() {
  const { data } = await api.get('/admin/users');
  return Array.isArray(data) ? data : [];
}

export async function fetchPendingDonors() {
  const { data } = await api.get('/admin/donors/pending');
  return Array.isArray(data) ? data : [];
}

export async function fetchAllDonors() {
  const { data } = await api.get('/admin/donors');
  return Array.isArray(data) ? data : [];
}

export async function verifyDonor(id) {
  const { data } = await api.put(`/admin/donors/${id}/verify`, null, { params: { verified: true } });
  return data;
}

export async function addHospital(payload) {
  const { data } = await api.post('/admin/hospitals', payload);
  return data;
}

export async function updateHospital(id, payload) {
  const { data } = await api.put(`/admin/hospitals/${id}`, payload);
  return data;
}

export async function removeHospital(id) {
  const { data } = await api.delete(`/admin/hospitals/${id}`);
  return data;
}

export async function updateSOSStatus(id, status) {
  const { data } = await api.put(`/admin/alerts/${id}/status`, null, { params: { status } });
  return data;
}

export async function deleteSOSAlert(id) {
  const { data } = await api.delete(`/admin/alerts/${id}`);
  return data;
}

export async function fetchAdminSummary() {
  const { data } = await api.get('/admin/summary');
  return data || {};
}

export async function updateUserRole(id, role) {
  const { data } = await api.put(`/admin/users/${id}/role`, null, { params: { role } });
  return data;
}

export async function updateUserActive(id, active) {
  const { data } = await api.put(`/admin/users/${id}/active`, null, { params: { active } });
  return data;
}

export async function fetchSystemHealth() {
  const { data } = await api.get('/admin/system-health');
  return data || {};
}

export async function sendBroadcast(message) {
  const { data } = await api.post('/admin/broadcast', { message });
  return data;
}

export async function fetchLatestBroadcast() {
  const { data } = await api.get('/admin/broadcast/latest');
  return data || {};
}

export async function clearBroadcast() {
  const { data } = await api.delete('/admin/broadcast');
  return data || {};
}

export async function fetchActivityLog() {
  const { data } = await api.get('/admin/activity-log');
  return Array.isArray(data) ? data : [];
}
