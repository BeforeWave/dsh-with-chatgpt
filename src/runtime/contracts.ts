import type { AdapterRpcClient, AgentAdapter } from '@beforewave/agent-helm'

export interface ChatGPTHelmRuntimeLogger {
  info(message: string): void
  warn?(message: string): void
}

export interface LocalMcpRuntimeStatus {
  active: boolean
  error?: string
}

export interface LocalMcpRuntime {
  readonly status: LocalMcpRuntimeStatus
  enable(): Promise<void>
  disable(): Promise<void>
  syncFromCore(): Promise<void>
}

export interface ChatGPTHelmHostAdapter {
  readonly adapter: AgentAdapter
  createLocalMcp?(rpc: AdapterRpcClient): LocalMcpRuntime
  dispose?(): Promise<void>
}
