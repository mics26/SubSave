import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'SUBSAVE_API_PORT')
  const proxy = {
    '/api': { target: 'http://127.0.0.1:' + (env.SUBSAVE_API_PORT || '3001'), changeOrigin: false },
  }
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
