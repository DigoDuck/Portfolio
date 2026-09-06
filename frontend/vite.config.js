import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, mode }) => {
  // Em produção a URL da API é injetada pela Vercel. Sem ela o bundle sai
  // apontando para localhost e o site sobe quebrado, então o build para aqui.
  // Em `serve` o fallback de desenvolvimento em api/client.js continua valendo.
  if (command === "build" && !loadEnv(mode, process.cwd(), "").VITE_API_URL) {
    throw new Error(
      "VITE_API_URL não definida: o build de produção precisa da URL da API. " +
        "Defina a variável no ambiente de build (Vercel) ou em frontend/.env.",
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.js",
      restoreMocks: true,
    },
  };
});
