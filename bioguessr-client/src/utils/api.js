// In development, Vite proxy handles /api/* requests
// In production, use the full AWS URL
const API_BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

