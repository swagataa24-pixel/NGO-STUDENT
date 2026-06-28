import { config } from '../config.js';

function clearStoredSession() {
  window.sessionStorage.removeItem('upayinfoPVT.authToken');
  window.sessionStorage.removeItem('upayinfoPVT.activeUser');
  window.localStorage.removeItem('upayinfoPVT.authToken');
  window.localStorage.removeItem('upayinfoPVT.activeUser');
}

export async function apiRequest(path, options = {}) {
  const base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  const url = String(path).startsWith('http') ? path : `${base}${String(path).startsWith('/') ? '' : '/'}${path}`;

  let response;
  try {
    const token = window.sessionStorage.getItem('upayinfoPVT.authToken');
    const { skipAuthRedirect = false, headers: optionHeaders = {}, ...fetchOptions } = options;
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...optionHeaders
      },
      credentials: 'include',
      ...fetchOptions
    });

    if (response.status === 401 && !skipAuthRedirect) {
      clearStoredSession();
      window.location.href = '/login';
    }
  } catch (err) {
    throw new Error(`Network request failed: ${err.message}`);
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
