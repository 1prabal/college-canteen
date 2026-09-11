// Centralized API and WebSocket URL configuration

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

/**
 * Returns full HTTP API endpoint URL given a path.
 * @param {string} path - e.g. '/api/canteens' or 'api/canteens'
 */
export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Returns full WebSocket URL given a path.
 * @param {string} path - e.g. '/ws/order/1'
 */
export function wsUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${WS_BASE_URL}${cleanPath}`;
}

export default {
  API_BASE_URL,
  WS_BASE_URL,
  apiUrl,
  wsUrl
};
