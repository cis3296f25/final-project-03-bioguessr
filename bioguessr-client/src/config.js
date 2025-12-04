import { loadEnv } from "vite";

const env = loadEnv('.', '');

export const API_BASE_URL = import.meta.env.PROD 
  ? env.AWS_URL // 👈 PUT REAL AWS URL HERE
  : ''; 

export const ENDPOINTS = {
  DAILY_CHALLENGE: `${API_BASE_URL}/api/daily-challenge`,
  // Add other endpoints here
};