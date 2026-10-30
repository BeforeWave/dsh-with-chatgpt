import { homedir } from 'node:os'
import { defaultDaemonEndpoint, probeDaemon } from '@beforewave/agent-helm'
import type { DaemonMode } from '../runtime/daemon.js'

/**
 * Standalone runs under an isolated dev HOME but should reuse an already
 * running Host Core, as the Chrome standalone preview does. A successful
 * control-protocol probe is required; an occupied HTTP port is not evidence.
 * Installed DSH plugin Core lifecycle/ownership is intentionally unchanged.
 */
export async function selectStandaloneCoreSocket(
  mode: DaemonMode,
  explicitSocket: string,
  options: {
    env?: NodeJS.ProcessEnv
    home?: string
    probe?: (socket: string) => Promise<boolean>
  } = {},
): Promise<string> {
  if (explicitSocket.trim() || mode === 'managed') return explicitSocket
  const env = options.env ?? process.env
  const currentSocket = env.AGENT_HELM_DAEMON_SOCKET?.trim() || defaultDaemonEndpoint(options.home ?? homedir())
  const probe = options.probe ?? probeDaemon
  if (await probe(currentSocket)) return currentSocket
  const hostHome = env.AGENT_HELM_HOST_HOME?.trim()
  if (hostHome) {
    const hostSocket = defaultDaemonEndpoint(hostHome)
    if (hostSocket !== currentSocket && await probe(hostSocket)) return hostSocket
  }
  // No live compatible Core: keep the original mode semantics. In auto mode
  // the plugin may start a managed dev Core; external mode reports unavailable.
  return explicitSocket
}
