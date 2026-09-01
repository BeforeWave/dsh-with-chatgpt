import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-session-title'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import { Config as BaseConfig, createDshRuntime, type Config as BaseDshConfig } from '../hosts/dsh.js'
import { createStandaloneHost } from '../hosts/standalone.js'

export const name = 'dsh-with-chatgpt-standalone-host'
export const inject = [
  'agents',
  'agentDefaultModel',
  'sessionPersistence',
  'systemPrompt',
  'tools',
]

export interface Config extends BaseDshConfig {
  standaloneHost: string
  standalonePort: number
}

export const Config: z<Config> = z.intersect([
  BaseConfig,
  z.object({
    standaloneHost: z.string().default('127.0.0.1'),
    standalonePort: z.number().min(0).max(65535).default(3460),
  }),
]) as z<Config>

function standaloneAssetRoot(): string {
  return fileURLToPath(new URL('../lib/standalone/', import.meta.url))
}

export async function apply(ctx: Context, config: Config): Promise<void> {
  await ctx.effect(async function* () {
    const runtime = createDshRuntime(ctx, config)
    const host = createStandaloneHost(runtime, {
      host: config.standaloneHost,
      port: config.standalonePort,
      assetRoot: standaloneAssetRoot(),
    })
    try {
      await runtime.start()
      const status = await host.start()
      if (status.url) {
        process.stdout.write(`\nDSH with ChatGPT standalone UI:\n${status.url}\n\n`)
        ctx.logger.info(`dsh-with-chatgpt: standalone UI ${status.url}`)
      }
    } catch (error) {
      await host.stop().catch(() => {})
      await runtime.stop().catch(() => {})
      throw error
    }
    yield async () => {
      await host.stop()
      await runtime.stop()
    }
  }, 'dsh-with-chatgpt.standalone')
}
