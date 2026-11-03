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

/**
 * VITE_NOINDEX=true keeps the site out of search engines: a robots meta tag
 * in index.html plus an X-Robots-Tag header (via .htaccess) for every URL.
 */
function noindex(enabled) {
  const directive = 'noindex, nofollow'
  return {
    name: 'upl-noindex',
    transformIndexHtml(html) {
      return enabled ? html.replace('</head>', `    <meta name="robots" content="${directive}" />\n  </head>`) : html
    },
    closeBundle() {
      const file = 'dist/.htaccess'
      if (!enabled || !fs.existsSync(file)) return
      fs.appendFileSync(
        file,
        `\n# Added by the build because VITE_NOINDEX=true: keep every URL out of search engines.\n<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "${directive}"\n</IfModule>\n`,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const wpUrl = env.VITE_WP_URL || 'https://wp.upperlatives.com'
  if (env.VITE_GTM_ID && !/^GTM-[A-Z0-9]+$/.test(env.VITE_GTM_ID)) {
    throw new Error(`VITE_GTM_ID must look like GTM-XXXXXXX, got "${env.VITE_GTM_ID}"`)
  }

  return {
    plugins: [react(), tailwindcss(), noindex(env.VITE_NOINDEX === 'true')],
    server: {
      https,
      // In dev the app calls /wp-json and /wp-content on its own origin; Vite forwards
      // them to WordPress (also avoids certificate trouble with a local copy like upper.test).
      proxy: {
        '/wp-json': { target: wpUrl, changeOrigin: true, secure: false },
        '/wp-content': { target: wpUrl, changeOrigin: true, secure: false },
      },
    },
  }
})
