import http from './http';

export async function fetchSystemState() {
  const { data } = await http.get('/system/state'); // auth required
  return data;
}

export async function adminSetSystem(running, reason = '') {
  const { data } = await http.put('/admin/system', { running, reason });
  return data;
}

export async function adminFetchUsers() {
  const { data } = await http.get('/admin/users');
  return data;
}

export async function adminCreateUser(payload) {
  const { data } = await http.post('/admin/users', payload);
  return data;
}

export async function adminDeleteUser(userId) {
  const { data } = await http.delete(`/admin/users/${userId}`);
  return data;
}

export async function adminResetPassword(payload) {
  const { data } = await http.post('/admin/users/reset-password', payload);
  return data;
}
