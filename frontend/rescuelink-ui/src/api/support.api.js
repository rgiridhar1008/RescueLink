import api from './client';

export async function submitSupportFeedback(payload) {
  const { data } = await api.post('/support', payload);
  return data;
}
