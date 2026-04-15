const DEFAULT_API = 'http://192.168.137.1:5000';

const raw = (import.meta.env?.VITE_API_URL || DEFAULT_API).trim();

const normalized = raw.replace(/\/+$/, '');

export const API_BASE_URL = normalized;
export const API_REST_BASE = `${API_BASE_URL}/api`;

export function buildApiUrl(path = '') {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
