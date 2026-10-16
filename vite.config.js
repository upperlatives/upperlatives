import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// Reuse the local mkcert certificate if it exists (same as the other React projects).
const certDir = `${process.env.HOME}/.local-ssl`
const https = fs.existsSync(`${certDir}/localhost+2.pem`)
  ? {
      key: fs.readFileSync(`${certDir}/localhost+2-key.pem`),
      cert: fs.readFileSync(`${certDir}/localhost+2.pem`),
    }
  : undefined

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const wpUrl = env.VITE_WP_URL || 'https://upper.test'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      https,
      // In dev the app calls /wp-json and /wp-content on its own origin; Vite forwards
      // them to WordPress, so the self-signed upper.test certificate never matters.
      proxy: {
        '/wp-json': { target: wpUrl, changeOrigin: true, secure: false },
        '/wp-content': { target: wpUrl, changeOrigin: true, secure: false },
      },
    },
  }
})
