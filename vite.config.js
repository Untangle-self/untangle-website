import { defineConfig } from 'vite'
import { createReadStream, cpSync, existsSync, mkdirSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const publicDir = resolve(rootDir, 'public')

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
}

function copyMarketingAssets(outDir) {
  mkdirSync(join(outDir, 'public'), { recursive: true })
  cpSync(publicDir, join(outDir, 'public'), { recursive: true })
  cpSync(resolve(rootDir, 'me.png'), join(outDir, 'me.png'))

  for (const file of ['CNAME', '.nojekyll']) {
    const source = resolve(rootDir, file)
    if (existsSync(source)) {
      cpSync(source, join(outDir, file))
    }
  }
}

function marketingStaticAssets() {
  return {
    name: 'marketing-static-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        if (url === '/me.png') {
          res.setHeader('Content-Type', MIME_TYPES['.png'])
          createReadStream(resolve(rootDir, 'me.png')).pipe(res)
          return
        }

        if (url.startsWith('/public/')) {
          const rel = url.slice('/public/'.length)
          const file = normalize(join(publicDir, rel))
          if (!file.startsWith(publicDir) || !existsSync(file)) {
            next()
            return
          }
          res.setHeader('Content-Type', MIME_TYPES[extname(file)] ?? 'application/octet-stream')
          createReadStream(file).pipe(res)
          return
        }

        next()
      })
    },
    closeBundle() {
      copyMarketingAssets(resolve(rootDir, 'dist'))
    },
  }
}

export default defineConfig({
  publicDir: false,
  envPrefix: ['VITE_', 'TURNSTILE_'],
  plugins: [marketingStaticAssets()],
  server: {
    host: true,
  },
})
