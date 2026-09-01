import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-agent-presets'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-session-title'
import type {} from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import type { CoreConfigOverride } from '@beforewave/agent-helm'
import { DshAdapter } from '../dsh/adapter.js'
import { LocalMcpBridge } from '../dsh/local-mcp.js'
import {
  ChatGPTHelmRuntime,
  HELM_SESSION_API_PATH,
  HELM_UI_STATUS_PATH,
  handleHelmSessionRequest,
  handleHelmStatusRequest,
  type DaemonMode,
} from '../runtime/index.js'

export interface Config {
  daemonMode: string
  daemonSocket: string
  adapterId: string
  host: string
  port: number
  tokenFile: string
  tokenEnv: string
  provider?: string
  model?: string
  tunnelEnabled: boolean
  tunnelIdEnv: string
  tunnelApiKeyEnv: string
  tunnelProxyEnv: string
  tunnelPollTimeoutMs: number
  tunnelPollDeadlineGuardrailMs: number
  tunnelHealthListenAddr: string
}

export const Config: z<Config> = z.object({
  daemonMode: z.string().default('auto').description('auto attaches or starts Core; external only attaches; managed only starts Core.'),
  daemonSocket: z.string().default('').description('Local Core adapter socket. Empty uses the Core default.'),
  adapterId: z.string().default('dsh').description('Unique adapter id registered with Core.'),
  host: z.string().default('127.0.0.1'),
  port: z.number().min(1).max(65535).default(3457),
  tokenFile: z.string().default(''),
  tokenEnv: z.string().default('AGENT_HELM_TOKEN'),
  provider: z.string(),
  model: z.string(),
  tunnelEnabled: z.boolean().default(true),
  tunnelIdEnv: z.string().default('CONTROL_PLANE_TUNNEL_ID'),
  tunnelApiKeyEnv: z.string().default('CONTROL_PLANE_API_KEY'),
  tunnelProxyEnv: z.string().default('HTTPS_PROXY'),
  tunnelPollTimeoutMs: z.number().min(1000).default(30000),
  tunnelPollDeadlineGuardrailMs: z.number().min(0).default(3000),
  tunnelHealthListenAddr: z.string().default('127.0.0.1:3458'),
})

export function parseDaemonMode(value: string): DaemonMode {
  if (value === 'auto' || value === 'external' || value === 'managed') return value
  throw new Error(`dsh-with-chatgpt: invalid daemonMode ${value}; expected auto, external, or managed`)
}

export function launcherOverride(config: Config): CoreConfigOverride {
  return {
    ...(config.daemonSocket ? { daemon: { socket: config.daemonSocket } } : {}),
    http: {
      host: config.host,
      port: config.port,
      tokenFile: config.tokenFile,
      tokenEnv: config.tokenEnv,
    },
    tunnel: {
      enabled: config.tunnelEnabled,
      idEnv: config.tunnelIdEnv,
      apiKeyEnv: config.tunnelApiKeyEnv,
      proxyEnv: config.tunnelProxyEnv,
      pollTimeoutMs: config.tunnelPollTimeoutMs,
      pollDeadlineGuardrailMs: config.tunnelPollDeadlineGuardrailMs,
      healthListenAddr: config.tunnelHealthListenAddr,
    },
  }
}

export function createDshRuntime(ctx: Context, config: Config): ChatGPTHelmRuntime {
  if ((config.provider && !config.model) || (!config.provider && config.model)) {
    throw new Error('dsh-with-chatgpt: provider and model must be configured together')
  }
  const adapter = new DshAdapter(ctx, {
    id: config.adapterId,
    ...(config.provider ? { provider: config.provider } : {}),
    ...(config.model ? { model: config.model } : {}),
  })
  return new ChatGPTHelmRuntime({
    daemonMode: parseDaemonMode(config.daemonMode),
    launcherOverride: launcherOverride(config),
    host: {
      adapter,
      createLocalMcp: (rpc) => new LocalMcpBridge(ctx, rpc),
      dispose: async () => await adapter.disposeOwned(),
    },
    logger: { info: (message) => ctx.logger.info(message) },
  })
}

export function registerDshRuntimeRoutes(ctx: Context, runtime: ChatGPTHelmRuntime): () => void {
  const disposeStatus = ctx.webServer.register({
    kind: 'exact',
    path: HELM_UI_STATUS_PATH,
    handler: async (req, res) => await handleHelmStatusRequest(runtime, req, res),
  })
  const disposeSessions = ctx.webServer.register({
    kind: 'prefix',
    path: HELM_SESSION_API_PATH,
    handler: async (req, res) => await handleHelmSessionRequest(runtime, req, res),
  })
  return () => {
    disposeSessions()
    disposeStatus()
  }
}

export async function registerDshPlugin(ctx: Context, config: Config): Promise<void> {
  await ctx.effect(async function* () {
    const runtime = createDshRuntime(ctx, config)
    let disposeRoutes: (() => void) | undefined
    try {
      await runtime.start()
      disposeRoutes = registerDshRuntimeRoutes(ctx, runtime)
    } catch (error) {
      disposeRoutes?.()
      await runtime.stop()
      throw error
    }
    yield async () => {
      disposeRoutes?.()
      await runtime.stop()
    }
  }, 'dsh-with-chatgpt.runtime')
}
