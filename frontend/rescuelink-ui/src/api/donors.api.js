import api from './client';

export async function fetchDonors(params = {}) {
  const { data } = await api.get('/donors', { params });
  return Array.isArray(data) ? data : [];
}

export async function requestDonorBooking(donorId, userId) {
  const { data } = await api.post(`/donors/${donorId}/request`, null, { params: { userId } });
  return data;
}

export async function cancelDonorBooking(donorId, userId) {
  const { data } = await api.post(`/donors/${donorId}/cancel`, null, { params: { userId } });
  return data;
}
