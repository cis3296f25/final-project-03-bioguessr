import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    base: mode === "production" ? "/final-project-03-bioguessr/" : "/",
    server: {
      proxy: {
        "/api": {
          target: env.AWS_URL || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
