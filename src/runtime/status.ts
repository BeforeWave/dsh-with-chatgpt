import {
  DEFAULT_EXTERNAL_CAPABILITIES,
  DEFAULT_EXTERNAL_USER_ACCESS,
  type AdapterRpcClient,
  type ExternalCapabilityPolicy,
  type ExternalUserAccess,
} from '@beforewave/agent-helm'
import type { LocalMcpRuntime } from './contracts.js'

export type HelmUiDependencyName = 'serena' | 'tunnelClient'
export type HelmUiRuntimeState = 'running' | 'ready' | 'stopped' | 'missing-config' | 'disabled' | 'unavailable'

export interface HelmUiStatus {
  core: { state: HelmUiRuntimeState; enabled?: boolean; configurable?: boolean; message?: string }
  dependencies: {
    serena: { state: HelmUiRuntimeState; command: string; installUrl?: string; installCommand?: string }
    tunnelClient: { state: HelmUiRuntimeState; command: string; installUrl?: string; installCommand?: string }
  }
  tunnel: {
    state: HelmUiRuntimeState
    enabled?: boolean
    configured?: boolean
    tunnelId?: string
    organizationId?: string
    apiKeyConfigured?: boolean
    error?: { code: string; message: string }
    missingEnvironment?: string[]
    adminUrl?: string
    logsUrl?: string
  }
  localMcp: {
    state: HelmUiRuntimeState
    url?: string
    message?: string
  }
  externalCapabilities: ExternalCapabilityPolicy
  externalUserAccess: ExternalUserAccess
  effectiveExternalAccess: ExternalUserAccess
}

export function coreDependencyStatus(health: Record<string, unknown>): HelmUiStatus['dependencies'] {
  const dependencies = record(health.dependencies)
  const serena = record(dependencies.serena)
  const tunnelClient = record(dependencies.tunnelClient)

  const project = (value: Record<string, unknown>, fallbackCommand: string) => {
    const command = stringValue(value.command) ?? fallbackCommand
    const configured = value.configured === true
    const available = value.available === true
    const state: HelmUiRuntimeState = !configured ? 'disabled' : available ? 'ready' : 'unavailable'
    if (state !== 'unavailable') return { state, command }

    const install = record(value.install)
    const installUrl = stringValue(install.url)
    const installCommand = install.automatic === true ? stringValue(install.command) : undefined
    return {
      state,
      command,
      ...(installUrl ? { installUrl } : {}),
      ...(installCommand ? { installCommand } : {}),
    }
  }

  return {
    serena: project(serena, 'serena'),
    tunnelClient: project(tunnelClient, 'tunnel-client'),
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function externalCapabilities(value: unknown): ExternalCapabilityPolicy {
  const v = record(value)
  return {
    command: typeof v.command === 'boolean' ? v.command : DEFAULT_EXTERNAL_CAPABILITIES.command,
    semantic: typeof v.semantic === 'boolean' ? v.semantic : DEFAULT_EXTERNAL_CAPABILITIES.semantic,
    read_only: typeof v.read_only === 'boolean' ? v.read_only : DEFAULT_EXTERNAL_CAPABILITIES.read_only,
    delegate: typeof v.delegate === 'boolean' ? v.delegate : DEFAULT_EXTERNAL_CAPABILITIES.delegate,
  }
}

function externalUserAccess(value: unknown): ExternalUserAccess {
  const v = record(value)
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_EXTERNAL_USER_ACCESS.enabled,
    mutations: typeof v.mutations === 'boolean' ? v.mutations : DEFAULT_EXTERNAL_USER_ACCESS.mutations,
    delegation: typeof v.delegation === 'boolean' ? v.delegation : DEFAULT_EXTERNAL_USER_ACCESS.delegation,
  }
}

function effectiveUiAccess(capabilities: ExternalCapabilityPolicy, access: ExternalUserAccess): ExternalUserAccess {
  return {
    enabled: access.enabled,
    mutations: access.enabled && access.mutations && !capabilities.read_only && (capabilities.command || capabilities.semantic),
    delegation: access.enabled && access.delegation && capabilities.delegate,
  }
}

function coreTunnelStatus(health: Record<string, unknown>): HelmUiStatus['tunnel'] {
  const tunnel = record(health.tunnel)
  const enabled = typeof tunnel.enabled === 'boolean' ? tunnel.enabled : undefined
  const configured = typeof tunnel.configured === 'boolean' ? tunnel.configured : undefined
  const tunnelId = stringValue(tunnel.tunnelId)
  const organizationId = stringValue(tunnel.organizationId)
  const apiKeyConfigured = typeof tunnel.apiKeyConfigured === 'boolean' ? tunnel.apiKeyConfigured : undefined
  const adminUrl = stringValue(tunnel.adminUrl)
  const logsUrl = stringValue(tunnel.logsUrl)
  const errorValue = record(tunnel.error)
  const errorCode = stringValue(errorValue.code)
  const errorMessage = stringValue(errorValue.message)
  const error = errorCode && errorMessage ? { code: errorCode, message: errorMessage } : undefined
  const common = {
    ...(enabled !== undefined ? { enabled } : {}),
    ...(configured !== undefined ? { configured } : {}),
    ...(tunnelId ? { tunnelId } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(apiKeyConfigured !== undefined ? { apiKeyConfigured } : {}),
    ...(error ? { error } : {}),
    ...(adminUrl ? { adminUrl } : {}),
    ...(logsUrl ? { logsUrl } : {}),
  }

  if (tunnel.running === true) return { state: 'running', ...common }

  if (tunnel.managed === false) {
    const reason = stringValue(tunnel.reason)
    const missingEnvironment = Array.isArray(tunnel.missingEnvironment)
      ? tunnel.missingEnvironment.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : []
    if (reason === 'disabled' || reason === 'core-disabled') return { state: 'disabled', ...common }
    if (reason === 'missing-env') return { state: 'missing-config', missingEnvironment, ...common }
  }

  if (health.status === 'disabled') return { state: 'disabled', ...common }
  return { state: 'stopped', ...common }
}

function localMcpStatus(health: Record<string, unknown>, bridge?: LocalMcpRuntime): HelmUiStatus['localMcp'] {
  const local = record(health.localMcp)
  const url = stringValue(local.url)
  if (health.status === 'disabled') return { state: 'disabled', ...(url ? { url } : {}) }
  if (local.enabled === true && bridge?.status.active === false) {
    return {
      state: 'unavailable',
      ...(url ? { url } : {}),
      message: bridge.status.error ?? 'Local MCP client is not connected.',
    }
  }
  return {
    state: local.enabled === true ? 'running' : 'disabled',
    ...(url ? { url } : {}),
  }
}

export async function resolveHelmUiStatus(
  rpc: AdapterRpcClient,
  bridge?: LocalMcpRuntime,
  expectedLifecycleOwner?: string,
): Promise<HelmUiStatus> {
  const unavailableDependencies = coreDependencyStatus({
    dependencies: {
      serena: { configured: true, available: false, command: 'serena' },
      tunnelClient: { configured: true, available: false, command: 'tunnel-client' },
    },
  })
  if (!rpc.connected) {
    return {
      core: { state: 'unavailable', enabled: false, configurable: true, message: 'Core adapter RPC is disconnected.' },
      dependencies: unavailableDependencies,
      tunnel: { state: 'unavailable' },
      localMcp: { state: 'unavailable' },
      externalCapabilities: { ...DEFAULT_EXTERNAL_CAPABILITIES },
      externalUserAccess: { enabled: false, mutations: false, delegation: false },
      effectiveExternalAccess: { enabled: false, mutations: false, delegation: false },
    }
  }
  let health: Record<string, unknown>
  try {
    health = await rpc.supervisorHealth()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      core: { state: 'unavailable', enabled: false, configurable: true, message },
      dependencies: unavailableDependencies,
      tunnel: { state: 'unavailable' },
      localMcp: { state: 'unavailable' },
      externalCapabilities: { ...DEFAULT_EXTERNAL_CAPABILITIES },
      externalUserAccess: { enabled: false, mutations: false, delegation: false },
      effectiveExternalAccess: { enabled: false, mutations: false, delegation: false },
    }
  }
  const dependencies = coreDependencyStatus(health)
  const serena = record(health.serena)
  if (serena.connected === true && dependencies.serena.state !== 'disabled') dependencies.serena.state = 'running'
  const tunnel = record(health.tunnel)
  if (tunnel.running === true && dependencies.tunnelClient.state !== 'disabled') dependencies.tunnelClient.state = 'running'
  const capabilities = externalCapabilities(health.externalCapabilities)
  const userAccess = externalUserAccess(health.externalUserAccess)
  const effectiveAccess = effectiveUiAccess(capabilities, userAccess)
  const daemon = record(health.daemon)
  const lifecycleOwner = typeof daemon.lifecycleOwner === 'string' ? daemon.lifecycleOwner : undefined
  const configurable = Boolean(expectedLifecycleOwner && lifecycleOwner === expectedLifecycleOwner)
  return {
    core: { state: health.status === 'disabled' ? 'disabled' : 'running', enabled: health.status !== 'disabled', configurable },
    dependencies,
    tunnel: coreTunnelStatus(health),
    localMcp: localMcpStatus(health, bridge),
    externalCapabilities: capabilities,
    externalUserAccess: userAccess,
    effectiveExternalAccess: effectiveAccess,
  }
}
