import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ChatGPTHelmRuntime } from './runtime.js'

export const HELM_UI_STATUS_PATH = '/api/dsh-with-chatgpt/status'
export const HELM_SESSION_API_PATH = '/api/dsh-with-chatgpt/sessions'

function json(res: ServerResponse, code: number, value: unknown): void {
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(value))
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  if (!chunks.length) return {}
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function sessionRouteParts(req: IncomingMessage): string[] {
  const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
  if (pathname === HELM_SESSION_API_PATH) return []
  if (!pathname.startsWith(`${HELM_SESSION_API_PATH}/`)) return ['__invalid__']
  return pathname.slice(HELM_SESSION_API_PATH.length + 1).split('/').filter(Boolean).map((part) => decodeURIComponent(part))
}

export async function handleHelmStatusRequest(runtime: ChatGPTHelmRuntime, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'GET') {
    json(res, 200, await runtime.getStatus())
    return
  }
  if (req.method === 'POST') {
    try {
      const body = await readJson(req)
      if (body.action === 'installDependency') {
        if (body.dependency !== 'serena' && body.dependency !== 'tunnelClient') throw new Error('dependency must be serena or tunnelClient')
        json(res, 200, await runtime.installDependency(body.dependency))
        return
      }
      if (body.action === 'configureTunnel') {
        const input = body.input
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('input must be a Tunnel setup object')
        const values = input as Record<string, unknown>
        if (typeof values.tunnelId !== 'string' || !values.tunnelId.trim()) throw new Error('Tunnel ID is required')
        if (values.organizationId !== undefined && typeof values.organizationId !== 'string') throw new Error('Organization ID must be a string')
        if (values.apiKey !== undefined && typeof values.apiKey !== 'string') throw new Error('Runtime API Key must be a string')
        json(res, 200, await runtime.configureTunnel({
          tunnelId: values.tunnelId,
          ...(typeof values.organizationId === 'string' ? { organizationId: values.organizationId } : {}),
          ...(typeof values.apiKey === 'string' ? { apiKey: values.apiKey } : {}),
        }))
        return
      }
      if (body.target === 'externalUserAccess') {
        if (body.capability !== 'enabled' && body.capability !== 'mutations' && body.capability !== 'delegation') throw new Error('capability must be enabled, mutations, or delegation')
        if (typeof body.enabled !== 'boolean') throw new Error('enabled must be a boolean')
        json(res, 200, await runtime.setExternalUserAccess({ [body.capability]: body.enabled }))
        return
      }
      if (body.target !== 'core' && body.target !== 'localMcp') throw new Error('target must be core or localMcp')
      if (typeof body.enabled !== 'boolean') throw new Error('enabled must be a boolean')
      json(res, 200, body.target === 'core' ? await runtime.setCoreEnabled(body.enabled) : await runtime.setLocalMcpEnabled(body.enabled))
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : String(error) })
    }
    return
  }
  res.setHeader('allow', 'GET, POST')
  json(res, 405, { error: 'method not allowed' })
}

export async function handleHelmSessionRequest(runtime: ChatGPTHelmRuntime, req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const parts = sessionRouteParts(req)
    if (parts[0] === '__invalid__') return json(res, 404, { error: 'not found' })
    if (parts.length === 0) {
      if (req.method === 'GET') {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        const cursor = url.searchParams.get('cursor') ?? undefined
        const rawLimit = url.searchParams.get('limit')
        const limit = rawLimit === null ? undefined : Number.parseInt(rawLimit, 10)
        if (rawLimit !== null && (!Number.isInteger(limit) || limit! < 1 || limit! > 50)) return json(res, 400, { error: 'limit must be an integer from 1 to 50' })
        return json(res, 200, await runtime.getSessionPage(cursor, limit))
      }
      res.setHeader('allow', 'GET')
      return json(res, 405, { error: 'method not allowed' })
    }
    if (req.method !== 'GET') {
      res.setHeader('allow', 'GET')
      return json(res, 405, { error: 'method not allowed' })
    }
    const [sessionId, child] = parts
    if (!sessionId || parts.length > 2) return json(res, 404, { error: 'not found' })
    if (!child) {
      const session = await runtime.getSession(sessionId)
      return session ? json(res, 200, { session }) : json(res, 404, { error: 'ChatGPT session not found' })
    }
    if (child === 'timeline') return json(res, 200, { timeline: await runtime.getSessionTimeline(sessionId) })
    if (child === 'activity') return json(res, 200, { activity: await runtime.getSessionActivity(sessionId) })
    if (child === 'delegations') return json(res, 200, { delegations: await runtime.getSessionDelegations(sessionId) })
    return json(res, 404, { error: 'not found' })
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}

export async function handleHelmApiRequest(runtime: ChatGPTHelmRuntime, req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
  if (pathname === HELM_UI_STATUS_PATH) {
    await handleHelmStatusRequest(runtime, req, res)
    return true
  }
  if (pathname === HELM_SESSION_API_PATH || pathname.startsWith(`${HELM_SESSION_API_PATH}/`)) {
    await handleHelmSessionRequest(runtime, req, res)
    return true
  }
  return false
}
