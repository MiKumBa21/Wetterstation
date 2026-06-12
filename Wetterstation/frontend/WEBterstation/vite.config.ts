import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite-Konfiguration für das React-Frontend
// Der Proxy leitet alle /api-Anfragen an den Backend-Server weiter.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
