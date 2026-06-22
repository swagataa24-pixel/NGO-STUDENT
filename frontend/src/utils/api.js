import { config } from '../config.js';

export async function apiRequest(path, options = {}) {
  const base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  const url = String(path).startsWith('http') ? path : `${base}${String(path).startsWith('/') ? '' : '/'}${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
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
