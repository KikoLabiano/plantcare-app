import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Plugin } from 'vite'

// ─── Mock API plugin for local development ────────────────────────────────────
// Simulates the Vercel /api/data endpoint using an in-memory store
// so the app can be developed without Vercel CLI.
function mockApiPlugin(): Plugin {
  let store = JSON.stringify({ plants: [], wateringRecords: [], pushSubscriptions: [] })

  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/api/data', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (req.method === 'GET') {
          res.end(store)
        } else if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            store = body
            res.end(JSON.stringify({ ok: true }))
          })
        } else {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
})
