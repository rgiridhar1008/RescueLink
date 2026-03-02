import api from './client';

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post('/auth/change-password', payload);
  return data;
}

export async function forgotPassword(payload) {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
}
