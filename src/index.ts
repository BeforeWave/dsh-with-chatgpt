import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-agent-presets'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-session-title'
import type {} from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import { Config, registerDshPlugin, type Config as DshConfig } from './hosts/dsh.js'

export * from './runtime/index.js'
export { Config } from './hosts/dsh.js'
export type { Config as DshConfig } from './hosts/dsh.js'
export { DshAdapter } from './dsh/adapter.js'
export { LocalMcpBridge, localMcpClientConfig } from './dsh/local-mcp.js'
export { localMcpAgentInstructions } from './dsh-local-mcp-instructions.js'

export const name = 'dsh-with-chatgpt'
export const inject = [
  'agents',
  'agentDefaultModel',
  'agentPresets',
  'sessions',
  'sessionPersistence',
  'workspaceRegistry',
  'webServer',
  'systemPrompt',
  'tools',
]

export async function apply(ctx: Context, config: DshConfig): Promise<void> {
  await registerDshPlugin(ctx, config)
}
