import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': process.env.GATEWAY_URL || 'http://localhost:8080',
      '/auth': process.env.GATEWAY_URL || 'http://localhost:8080',
      '/login': process.env.GATEWAY_URL || 'http://localhost:8080'
    }
  }
})
