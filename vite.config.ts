import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En dev, on proxie /api et /public vers le backend local pour que le frontend
// utilise des chemins relatifs (cohérent avec le rewrite Vercel en production).
// Conséquence : les cookies sont same-origin partout, sameSite=lax fonctionne.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':    { target: 'http://localhost:3001', changeOrigin: true },
      '/public': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
