import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    proxy: {
      "/api": {
        target: process.env.AWS_URL,
        changeOrigin: true,
      },
    },
  },
});
