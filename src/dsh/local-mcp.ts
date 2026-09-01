import type { Context, Plugin } from '@deepseek-ai/cordis'
import * as dshMcpClient from '@deepseek-ai/dsh-mcp-client'
import { type AdapterRpcClient, type LocalMcpConnection } from '@beforewave/agent-helm'
import { installDshLocalMcpAgentInstructions } from '../dsh-local-mcp-instructions.js'

const LOCAL_MCP_SERVER_NAME = 'agent_helm_local'

export interface LocalMcpClientConfig {
  transport: 'streamable-http'
  serverName: string
  url: string
  headers: Record<string, string>
  toolCallTimeoutMs: number
  failOnStartupError: boolean
  reconnect: {
    enabled: boolean
    initialDelayMs: number
    maxDelayMs: number
    maxAttempts: number
  }
}

export function localMcpClientConfig(connection: LocalMcpConnection): LocalMcpClientConfig {
  return {
    transport: 'streamable-http',
    serverName: LOCAL_MCP_SERVER_NAME,
    url: connection.url,
    headers: { Authorization: `Bearer ${connection.token}` },
    toolCallTimeoutMs: 60_000,
    failOnStartupError: true,
    reconnect: {
      enabled: true,
      initialDelayMs: 500,
      maxDelayMs: 30_000,
      maxAttempts: 10,
    },
  }
}

export interface LocalMcpBridgeStatus {
  active: boolean
  error?: string
}

export class LocalMcpBridge {
  #fiber: { dispose(): Promise<void> } | undefined
  #disposeAgentInstructions: (() => void) | undefined
  #error: string | undefined

  constructor(readonly ctx: Context, readonly rpc: AdapterRpcClient) {}

  get status(): LocalMcpBridgeStatus {
    return {
      active: this.#fiber !== undefined,
      ...(this.#error ? { error: this.#error } : {}),
    }
  }

  async enable(): Promise<void> {
    if (this.#fiber) return
    const connection = await this.rpc.getLocalMcpConnection()
    const fiber = this.ctx.plugin(
      dshMcpClient as unknown as Plugin,
      localMcpClientConfig(connection),
    )
    try {
      await fiber
      const disposeAgentInstructions = installDshLocalMcpAgentInstructions(this.ctx)
      this.#fiber = fiber
      this.#disposeAgentInstructions = disposeAgentInstructions
      this.#error = undefined
    } catch (error) {
      this.#disposeAgentInstructions?.()
      this.#disposeAgentInstructions = undefined
      await fiber?.dispose().catch(() => {})
      this.#error = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  async disable(): Promise<void> {
    const fiber = this.#fiber
    const disposeAgentInstructions = this.#disposeAgentInstructions
    this.#fiber = undefined
    this.#disposeAgentInstructions = undefined
    this.#error = undefined
    disposeAgentInstructions?.()
    await fiber?.dispose()
  }

  async syncFromCore(): Promise<void> {
    const health = await this.rpc.supervisorHealth()
    const local = health.localMcp && typeof health.localMcp === 'object'
      ? health.localMcp as Record<string, unknown>
      : {}
    if (health.status === 'disabled' || local.enabled !== true) {
      await this.disable()
      return
    }
    try {
      await this.enable()
    } catch {
      // Keep the Core switch enabled. The UI reports the DSH-side bridge fault,
      // while the next explicit enable or Core restart retries discovery.
    }
  }
}
