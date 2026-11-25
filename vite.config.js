import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const proxy = { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } }

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
