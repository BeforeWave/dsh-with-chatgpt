import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import type { ChatGPTHelmRuntime } from '../runtime/runtime.js'
import { HELM_SESSION_API_PATH, HELM_UI_STATUS_PATH, handleHelmApiRequest } from '../runtime/http.js'

export interface StandaloneHostOptions {
  host?: string
  port?: number
  assetRoot: string
}

export interface StandaloneHostStatus {
  running: boolean
  host: string
  port?: number
  url?: string
}

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function secureEquals(a: string, b: string): boolean {
  const aa = Buffer.from(a)
  const bb = Buffer.from(b)
  return aa.length === bb.length && timingSafeEqual(aa, bb)
}

function requestOriginAllowed(req: IncomingMessage): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined
  if (!origin) return true
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined
  if (!host) return false
  try {
    const value = new URL(origin)
    return value.protocol === 'http:' && value.host === host
  } catch {
    return false
  }
}

export class StandaloneHost {
  #server: Server | undefined
  #port: number | undefined
  readonly #accessToken = randomBytes(32).toString('base64url')

  constructor(readonly runtime: ChatGPTHelmRuntime, readonly options: StandaloneHostOptions) {}

  get status(): StandaloneHostStatus {
    const host = this.options.host ?? '127.0.0.1'
    const url = this.#port !== undefined ? `http://${host}:${String(this.#port)}/#token=${encodeURIComponent(this.#accessToken)}` : undefined
    return { running: this.#server !== undefined, host, ...(this.#port !== undefined ? { port: this.#port } : {}), ...(url ? { url } : {}) }
  }

  async start(): Promise<StandaloneHostStatus> {
    if (this.#server) return this.status
    const server = createServer(async (req, res) => {
      try {
        const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
        const isHelmApi = pathname === HELM_UI_STATUS_PATH || pathname === HELM_SESSION_API_PATH || pathname.startsWith(`${HELM_SESSION_API_PATH}/`)
        if (isHelmApi) {
          const token = typeof req.headers['x-agent-helm-standalone-token'] === 'string' ? req.headers['x-agent-helm-standalone-token'] : ''
          if (!secureEquals(token, this.#accessToken)) {
            res.writeHead(401, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
            res.end(JSON.stringify({ error: 'unauthorized' }))
            return
          }
          if (!requestOriginAllowed(req)) {
            res.writeHead(403, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
            res.end(JSON.stringify({ error: 'cross-origin request denied' }))
            return
          }
          if (req.method === 'POST' && !String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
            res.writeHead(415, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
            res.end(JSON.stringify({ error: 'application/json required' }))
            return
          }
        }
        if (await handleHelmApiRequest(this.runtime, req, res)) return
        const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
        const normalized = normalize(relative).replace(/^(\.\.[/\\])+/, '')
        const target = join(this.options.assetRoot, normalized)
        try {
          const body = await readFile(target)
          res.writeHead(200, {
            'content-type': MIME[extname(target)] ?? 'application/octet-stream',
            'cache-control': 'no-store',
          })
          res.end(body)
        } catch {
          if (!pathname.includes('.')) {
            const body = await readFile(join(this.options.assetRoot, 'index.html'))
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
            res.end(body)
            return
          }
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('Not found')
        }
      } catch (error) {
        if (res.headersSent) {
          res.end()
          return
        }
        res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
      }
    })
    this.#server = server
    const host = this.options.host ?? '127.0.0.1'
    const port = this.options.port ?? 3460
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => resolve())
      })
      const address = server.address()
      this.#port = typeof address === 'object' && address ? address.port : port
      return this.status
    } catch (error) {
      this.#server = undefined
      this.#port = undefined
      server.close()
      throw error
    }
  }

  async stop(): Promise<void> {
    const server = this.#server
    this.#server = undefined
    this.#port = undefined
    if (!server) return
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

export function createStandaloneHost(runtime: ChatGPTHelmRuntime, options: StandaloneHostOptions): StandaloneHost {
  return new StandaloneHost(runtime, options)
}
