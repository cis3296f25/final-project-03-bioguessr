import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: '/final-project-03-bioguessr/',
    server: {
      cors: {
        origin: env.AWS_URL,
      },
      proxy: {
        '/api': {
          target: env.AWS_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      manifest: true,
    },
  };
});
