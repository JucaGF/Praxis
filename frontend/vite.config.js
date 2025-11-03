import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // Permite acesso de qualquer IP na rede
    port: 5173, // Porta fixa
    strictPort: true, // Não tenta outras portas
    open: false, // Não abre navegador automaticamente
    watch: {
      usePolling: true, // Necessário para hot-reload funcionar no Docker (especialmente Windows)
      interval: 1000, // Verifica mudanças a cada 1 segundo
    },
  },
  preview: {
    host: "0.0.0.0", // Também para preview
    port: 5173,
  },
});
