import type { ChatSessionSummary, ChatSessionSummaryPage, ChatSessionTimelineItem, DelegatedSession } from '@beforewave/agent-helm'
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
  getSessionDelegations(sessionId: string): Promise<DelegatedSession[]>
}

export interface HelmUiAdapter extends HelmStatusAdapter, HelmSessionAdapter {}

const STATUS_PATH = '/api/dsh-with-chatgpt/status'
const SESSION_PATH = '/api/dsh-with-chatgpt/sessions'

async function requestJson<T>(url: string, init?: RequestInit, extraHeaders: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { accept: 'application/json', ...(init?.body ? { 'content-type': 'application/json' } : {}), ...extraHeaders, ...(init?.headers ?? {}) },
  })
  const value = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(value.error ?? `request failed (${response.status})`)
  return value
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
      return await request<HelmUiStatus>(statusUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'configureTunnel', input }),
      })
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
    async getSessionDelegations(sessionId) {
      return (await request<{ delegations: DelegatedSession[] }>(`${sessionUrl}/${encodeURIComponent(sessionId)}/delegations`)).delegations
    },
    openUrl(url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    },
  }
}

export const browserHelmUiAdapter = createHttpHelmUiAdapter()
