import { config } from '../config.js';

function clearStoredSession() {
  window.localStorage.removeItem('upay.authToken');
  window.localStorage.removeItem('upay.activeUser');
}

export async function apiRequest(path, options = {}) {
  const base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  const url = String(path).startsWith('http') ? path : `${base}${String(path).startsWith('/') ? '' : '/'}${path}`;

  let response;
  try {
    const token = window.localStorage.getItem('upay.authToken');
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (err) {
    throw new Error(`Network request failed: ${err.message}`);
  }

  // If 401 Unauthorized, clear session
  if (response.status === 401) {
    clearStoredSession();
    window.location.href = '/login';
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status} ${response.statusText}`);
  }
  return data;
}

export function mongoId(item) {
  return item?._id || item?.id;
}
