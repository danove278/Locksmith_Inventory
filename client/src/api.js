const BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sesion expirada');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// Accessories
export const getAccessories = () => request('/accessories');
export const searchAccessories = (q) => request(`/accessories/search?q=${encodeURIComponent(q)}`);
export const getAlerts = () => request('/accessories/alerts');
export const addAccessory = (body) => request('/accessories', { method: 'POST', body: JSON.stringify(body) });
export const updateAccessory = (id, body) => request(`/accessories/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteAccessory = (id) => request(`/accessories/${id}`, { method: 'DELETE' });

// Usage
export const registerUsage = (body) => request('/usage', { method: 'POST', body: JSON.stringify(body) });
export const getUsageHistory = (date) => request(`/usage${date ? `?date=${date}` : ''}`);
export const updateUsageRecord = (id, body) => request(`/usage/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteUsageRecord = (id) => request(`/usage/${id}`, { method: 'DELETE' });
export const toggleFlag = (id) => request(`/usage/${id}/flag`, { method: 'PATCH' });

// Users
export const getUsers = () => request('/users');
export const createUser = (body) => request('/users', { method: 'POST', body: JSON.stringify(body) });
export const updateUser = (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' });
