export type HelmCapabilityId = 'understand' | 'coding' | 'command'
export type HelmCapabilityEnabledState = Record<HelmCapabilityId, boolean>

export type HelmConnectionHealthState = 'connected' | 'disconnected' | 'error'
export type HelmRuntimeState = 'running' | 'ready' | 'available' | 'stopped' | 'missing-config' | 'disabled' | 'unavailable' | 'error'
export type HelmTransportConnectionState = 'connected' | 'unavailable' | 'error' | 'install-required'

export interface HelmHealthNode {
  state: HelmRuntimeState
  enabled?: boolean
  message?: string
  name?: string
}

export interface HelmConnectionHealthInput {
  requestError?: string | null
  connection?: {
    state: HelmTransportConnectionState
    message?: string
  }
  core?: HelmHealthNode
  tunnel?: HelmHealthNode
  localMcp?: HelmHealthNode
  dependencies?: readonly HelmHealthNode[]
  agents?: readonly HelmHealthNode[]
}

export type HelmConnectionIssueSource = 'request' | 'connection' | 'core' | 'tunnel' | 'localMcp' | 'dependency' | 'agent'

export interface HelmConnectionIssue {
  source: HelmConnectionIssueSource
  state?: string
  name?: string
  message?: string
}

export interface HelmConnectionHealth {
  state: HelmConnectionHealthState
  issue?: HelmConnectionIssue
}

function runtimeIssue(node: HelmHealthNode | undefined): boolean {
  return Boolean(node && (node.state === 'error' || node.state === 'unavailable' || node.message))
}

export function deriveHelmConnectionHealth(input: HelmConnectionHealthInput | null | undefined): HelmConnectionHealth {
  if (!input) return { state: 'disconnected' }
  if (input.requestError) return { state: 'error', issue: { source: 'request', message: input.requestError } }

  if (input.connection && input.connection.state !== 'connected') {
    return {
      state: 'error',
      issue: {
        source: 'connection',
        state: input.connection.state,
        ...(input.connection.message ? { message: input.connection.message } : {}),
      },
    }
  }

  if (runtimeIssue(input.core)) {
    return {
      state: 'error',
      issue: {
        source: 'core',
        ...(input.core?.state ? { state: input.core.state } : {}),
        ...(input.core?.message ? { message: input.core.message } : {}),
      },
    }
  }

  if (input.core?.enabled === false || input.core?.state === 'stopped') return { state: 'disconnected' }

  const dependencyIssue = input.dependencies?.find((item) => item.enabled !== false && runtimeIssue(item))
  if (dependencyIssue) {
    return {
      state: 'error',
      issue: {
        source: 'dependency',
        ...(dependencyIssue.name ? { name: dependencyIssue.name } : {}),
        state: dependencyIssue.state,
        ...(dependencyIssue.message ? { message: dependencyIssue.message } : {}),
      },
    }
  }

  if (input.tunnel && input.tunnel.enabled !== false && (
    input.tunnel.state === 'stopped'
    || input.tunnel.state === 'missing-config'
    || runtimeIssue(input.tunnel)
  )) {
    return {
      state: 'error',
      issue: {
        source: 'tunnel',
        state: input.tunnel.state,
        ...(input.tunnel.message ? { message: input.tunnel.message } : {}),
      },
    }
  }

  if (input.localMcp && input.localMcp.enabled !== false && runtimeIssue(input.localMcp)) {
    return {
      state: 'error',
      issue: {
        source: 'localMcp',
        state: input.localMcp.state,
        ...(input.localMcp.message ? { message: input.localMcp.message } : {}),
      },
    }
  }

  const agentIssue = input.agents?.find((item) => item.enabled !== false && runtimeIssue(item))
  if (agentIssue) {
    return {
      state: 'error',
      issue: {
        source: 'agent',
        ...(agentIssue.name ? { name: agentIssue.name } : {}),
        state: agentIssue.state,
        ...(agentIssue.message ? { message: agentIssue.message } : {}),
      },
    }
  }

  return { state: 'connected' }
}

export * from './work-history.js'

export { tunnelOnboardingRequired, tunnelOnboardingSource, tunnelSetupCanSubmit, tunnelSetupLinks } from './tunnel-setup.js'
export type { TunnelOnboardingLinkAction, TunnelOnboardingLinkId, TunnelOnboardingText, TunnelOnboardingTextKey, TunnelSetupProjection, TunnelSetupValues } from './tunnel-setup.js'
export { agentHelmInstallerSourceForRelease, agentHelmMacosInstallerFilename } from './installer.js'
