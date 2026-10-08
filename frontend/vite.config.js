import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Optional: proxy /api requests to FastAPI during dev
      // Axios uses absolute URL (http://localhost:8000) so CORS headers handle it.
    },
  },
})
