import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        //target: 'https://gym-tracker-backend-357760170579.europe-central2.run.app/api/v1',
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
