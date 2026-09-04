import type { ChatSessionSummary, ChatSessionSummaryPage, ChatSessionTimelineItem } from '@beforewave/agent-helm'
import type { TunnelSetupValues } from '@beforewave/agent-helm-ui-contract'
import type { HelmUiDependencyName, HelmUiStatus } from '../runtime/status.js'

export type HelmExternalCapability = 'enabled' | 'mutations' | 'delegation'

export interface HelmStatusAdapter {
  getStatus(): Promise<HelmUiStatus>
  installDependency(dependency: HelmUiDependencyName): Promise<HelmUiStatus>
  configureTunnel(input: TunnelSetupValues): Promise<HelmUiStatus>
  setCoreEnabled(enabled: boolean): Promise<HelmUiStatus>
  setLocalMcpEnabled(enabled: boolean): Promise<HelmUiStatus>
  setExternalUserAccess(capability: HelmExternalCapability, enabled: boolean): Promise<HelmUiStatus>
  openUrl(url: string): void
}

export interface HelmSessionAdapter {
  listSessionPage(cursor?: string): Promise<ChatSessionSummaryPage>
  getSession(sessionId: string): Promise<ChatSessionSummary>
  openUrl(url: string): void
  getSessionTimeline(sessionId: string): Promise<ChatSessionTimelineItem[]>
}

export interface HelmUiAdapter extends HelmStatusAdapter, HelmSessionAdapter {}

const STATUS_PATH = '/api/dsh-with-chatgpt/status'
const SESSION_PATH = '/api/dsh-with-chatgpt/sessions'

export type HelmUiRequestFailureKind = 'http-error' | 'invalid-response' | 'transport-interrupted' | 'service-unreachable'

export class HelmUiRequestError extends Error {
  readonly kind: HelmUiRequestFailureKind
  readonly retryable: boolean
  readonly statusCode: number | undefined
  readonly recoveredStatus: HelmUiStatus | undefined

  constructor(
    kind: HelmUiRequestFailureKind,
    message: string,
    options: { retryable: boolean; statusCode?: number; recoveredStatus?: HelmUiStatus; cause?: unknown },
  ) {
    super(message)
    this.name = 'HelmUiRequestError'
    this.kind = kind
    this.retryable = options.retryable
    this.statusCode = options.statusCode
    this.recoveredStatus = options.recoveredStatus
    if (options.cause !== undefined) (this as Error & { cause?: unknown }).cause = options.cause
  }
}

export function isHelmUiRequestError(error: unknown): error is HelmUiRequestError {
  return error instanceof HelmUiRequestError
}

async function requestJson<T>(url: string, init?: RequestInit, extraHeaders: Record<string, string> = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      cache: 'no-store',
      ...init,
      headers: { accept: 'application/json', ...(init?.body ? { 'content-type': 'application/json' } : {}), ...extraHeaders, ...(init?.headers ?? {}) },
    })
  } catch (cause) {
    throw new HelmUiRequestError(
      'transport-interrupted',
      'The browser did not receive an HTTP response from the local DSH Web service.',
      { retryable: true, cause },
    )
  }

  let text: string
  try {
    text = await response.text()
  } catch (cause) {
    throw new HelmUiRequestError(
      'transport-interrupted',
      'The browser received the local service response headers but the HTTP response body was interrupted.',
      { retryable: true, statusCode: response.status, cause },
    )
  }
  let value: T & { error?: string }
  try {
    value = (text ? JSON.parse(text) : {}) as T & { error?: string }
  } catch (cause) {
    throw new HelmUiRequestError(
      'invalid-response',
      `The local DSH Web service returned a response that is not valid JSON (HTTP ${response.status}).`,
      { retryable: false, statusCode: response.status, cause },
    )
  }

  if (!response.ok) {
    throw new HelmUiRequestError(
      'http-error',
      value.error ?? `request failed (HTTP ${response.status})`,
      { retryable: response.status >= 500, statusCode: response.status },
    )
  }
  return value
}

const STATUS_RECOVERY_DELAYS_MS = [0, 250, 750] as const

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms))
}

async function probeRecoveredStatus(
  request: <T>(url: string, init?: RequestInit) => Promise<T>,
  statusUrl: string,
): Promise<HelmUiStatus> {
  let lastTransportError: HelmUiRequestError | undefined
  for (const delay of STATUS_RECOVERY_DELAYS_MS) {
    await sleep(delay)
    try {
      return await request<HelmUiStatus>(statusUrl)
    } catch (error) {
      if (!isHelmUiRequestError(error) || error.kind !== 'transport-interrupted') throw error
      lastTransportError = error
    }
  }
  throw new HelmUiRequestError(
    'service-unreachable',
    'The local DSH Web service is still unreachable after follow-up status probes.',
    { retryable: true, cause: lastTransportError },
  )
}

export function createHttpHelmUiAdapter(baseUrl = '', accessToken?: string): HelmUiAdapter {
  const statusUrl = `${baseUrl}${STATUS_PATH}`
  const sessionUrl = `${baseUrl}${SESSION_PATH}`
  const extraHeaders = accessToken ? { 'x-agent-helm-standalone-token': accessToken } : {}
  const request = async <T,>(url: string, init?: RequestInit): Promise<T> => await requestJson<T>(url, init, extraHeaders)
  return {
    async getStatus() {
      return await request<HelmUiStatus>(statusUrl)
    },
    async installDependency(dependency) {
      return await request<HelmUiStatus>(statusUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'installDependency', dependency }),
      })
    },
    async configureTunnel(input) {
      try {
        return await request<HelmUiStatus>(statusUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'configureTunnel', input }),
        })
      } catch (error) {
        if (!isHelmUiRequestError(error) || error.kind !== 'transport-interrupted') throw error

        let recoveredStatus: HelmUiStatus
        try {
          recoveredStatus = await probeRecoveredStatus(request, statusUrl)
        } catch (probeError) {
          if (isHelmUiRequestError(probeError) && probeError.kind === 'service-unreachable') throw probeError
          throw probeError
        }

        if (recoveredStatus.tunnel.state === 'running' && recoveredStatus.tunnel.tunnelId === input.tunnelId.trim()) {
          return recoveredStatus
        }

        throw new HelmUiRequestError(
          'transport-interrupted',
          'The Tunnel configuration request lost its HTTP response, but the local service is reachable again. The request outcome cannot be determined from the browser transport alone.',
          { retryable: true, recoveredStatus, cause: error },
        )
      }
    },
    async setCoreEnabled(enabled) {
      return await request<HelmUiStatus>(statusUrl, {
        method: 'POST',
        body: JSON.stringify({ target: 'core', enabled }),
      })
    },
    async setLocalMcpEnabled(enabled) {
      return await request<HelmUiStatus>(statusUrl, {
        method: 'POST',
        body: JSON.stringify({ target: 'localMcp', enabled }),
      })
    },
    async setExternalUserAccess(capability, enabled) {
      return await request<HelmUiStatus>(statusUrl, {
        method: 'POST',
        body: JSON.stringify({ target: 'externalUserAccess', capability, enabled }),
      })
    },
    async listSessionPage(cursor) {
      const url = new URL(sessionUrl, window.location.href)
      if (cursor) url.searchParams.set('cursor', cursor)
      return await request<ChatSessionSummaryPage>(url.toString())
    },
    async getSession(sessionId) {
      return (await request<{ session: ChatSessionSummary }>(`${sessionUrl}/${encodeURIComponent(sessionId)}`)).session
    },
    async getSessionTimeline(sessionId) {
      return (await request<{ timeline: ChatSessionTimelineItem[] }>(`${sessionUrl}/${encodeURIComponent(sessionId)}/timeline`)).timeline
    },
    openUrl(url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    },
  }
}

export const browserHelmUiAdapter = createHttpHelmUiAdapter()
