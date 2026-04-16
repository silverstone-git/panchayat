import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth': process.env.GATEWAY_URL || 'http://localhost:8080',
      '/login': process.env.GATEWAY_URL || 'http://localhost:8080',
      '/api/v1/threads': process.env.THREADS_URL || 'http://localhost:8002',
      '/api/v1/votes': process.env.VOTING_URL || 'http://localhost:8003'
    }
  }
})
