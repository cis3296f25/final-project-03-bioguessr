// In development, Vite proxy handles /api/* requests
// In production (GitHub Pages), use the full AWS URL
const isProduction = import.meta.env.PROD;

const PRODUCTION_API_URL = "https://zir0g22ha0.execute-api.us-east-1.amazonaws.com";

const API_BASE = isProduction ? PRODUCTION_API_URL : "";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

