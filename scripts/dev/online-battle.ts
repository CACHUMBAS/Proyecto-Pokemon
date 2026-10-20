import type { Plugin } from 'vite'
import { configuredHandler } from '../../server/runtime.ts'
import { MAX_BODY, jsonResponse } from '../../server/http.ts'
export function onlineBattlePlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'lumemon-online-battle',
    configureServer(server) {
      const handle = configuredHandler(env)
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/battle') return next()
        try {
          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req) {
            const b = Buffer.from(chunk)
            size += b.length
            if (size > MAX_BODY) {
              res.writeHead(413, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
              })
              res.end('{"error":"invalid_request"}')
              return
            }
            chunks.push(b)
          }
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value)
          }
          const request = new Request('http://localhost/api/battle', {
            method: req.method,
            headers,
            ...(req.method === 'GET' || req.method === 'HEAD'
              ? {}
              : { body: Buffer.concat(chunks) }),
          })
          const response = await handle(request)
          res.writeHead(response.status, Object.fromEntries(response.headers))
          res.end(await response.text())
        } catch {
          const response = jsonResponse({ error: 'unavailable' }, 503)
          res.writeHead(response.status, Object.fromEntries(response.headers))
          res.end(await response.text())
        }
      })
    },
  }
}
