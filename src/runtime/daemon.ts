import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { probeDaemon, type CoreConfigOverride } from '@beforewave/agent-helm'

export type DaemonMode = 'auto' | 'external' | 'managed'
export type DaemonLaunchPlan = 'attach' | 'spawn' | 'idle'

export function resolveDaemonLaunchPlan(mode: DaemonMode, available: boolean): DaemonLaunchPlan {
  if (mode === 'external') {
    if (!available) throw new Error('daemonMode=external requires an existing Agent Helm daemon')
    return 'attach'
  }
  if (mode === 'managed') {
    if (available) throw new Error('daemonMode=managed cannot replace an existing Agent Helm daemon')
    return 'spawn'
  }
  return available ? 'attach' : 'spawn'
}

function coreCliPath(): string {
  const packageUrl = import.meta.resolve('@beforewave/agent-helm/package.json')
  return fileURLToPath(new URL('./lib/cli.js', packageUrl))
}

export interface ManagedDaemonOptions {
  socket: string
  override: CoreConfigOverride
  lifecycleOwner?: string
  startupTimeoutMs?: number
  env?: NodeJS.ProcessEnv
  onStdout?: (chunk: string) => void
  onStderr?: (chunk: string) => void
}

export class ManagedDaemon {
  #child: ChildProcess | undefined
  #childError: Error | undefined

  constructor(readonly options: ManagedDaemonOptions) {}
  get pid(): number | undefined { return this.#child?.pid }

  get running(): boolean { return Boolean(this.#child && this.#child.exitCode === null) }
  #currentChildError(): Error | undefined { return this.#childError }

  async start(): Promise<void> {
    if (this.#child) return
    this.#childError = undefined
    const lifecycleArgs = this.options.lifecycleOwner
      ? ['--lifecycle-owner', this.options.lifecycleOwner]
      : []
    const child = spawn(process.execPath, [coreCliPath(), 'daemon', ...lifecycleArgs], {
      env: {
        ...(this.options.env ?? {}),
        AGENT_HELM_LAUNCHER_CONFIG_JSON: JSON.stringify(this.options.override),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.#child = child
    child.on('error', (error) => { this.#childError = error })
    child.stdout?.on('data', (chunk: Buffer) => this.options.onStdout?.(chunk.toString('utf8')))
    child.stderr?.on('data', (chunk: Buffer) => this.options.onStderr?.(chunk.toString('utf8')))

    const deadline = Date.now() + (this.options.startupTimeoutMs ?? 20_000)
    while (Date.now() < deadline) {
      const childError = this.#currentChildError()
      if (childError) {
        this.#child = undefined
        throw new Error(`managed Agent Helm daemon process failed: ${childError.message}`)
      }
      if (await probeDaemon(this.options.socket)) return
      if (child.exitCode !== null) {
        this.#child = undefined
        throw new Error(`managed Agent Helm daemon exited with code ${String(child.exitCode)}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await this.stop()
    throw new Error(`managed Agent Helm daemon did not become ready at ${this.options.socket}`)
  }

  async stop(): Promise<void> {
    const child = this.#child
    if (!child || child.exitCode !== null) {
      this.#child = undefined
      this.#childError = undefined
      return
    }

    const signalAndWait = async (signal: NodeJS.Signals, timeoutMs: number): Promise<boolean> => await new Promise<boolean>((resolve, reject) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const finish = (result: boolean, error?: Error) => {
        if (settled) return
        settled = true
        if (timer) clearTimeout(timer)
        child.off('exit', onExit)
        child.off('error', onError)
        if (error) reject(new Error(`failed to stop managed Agent Helm daemon: ${error.message}`))
        else resolve(result)
      }
      const onExit = () => finish(true)
      const onError = (error: Error) => finish(false, error)
      child.once('exit', onExit)
      child.once('error', onError)
      if (child.exitCode !== null) { finish(true); return }
      try {
        if (!child.kill(signal) && child.exitCode === null) {
          finish(false, new Error(`unable to deliver ${signal}`))
          return
        }
      } catch (cause) {
        finish(false, cause instanceof Error ? cause : new Error(String(cause)))
        return
      }
      timer = setTimeout(() => finish(false), timeoutMs)
    })

    try {
      if (await signalAndWait('SIGTERM', 5_000)) return
      if (child.exitCode !== null) return
      if (await signalAndWait('SIGKILL', 1_000)) return
      if (child.exitCode === null) throw new Error('failed to stop managed Agent Helm daemon: process did not exit after SIGKILL')
    } finally {
      if (child.exitCode !== null) {
        this.#child = undefined
        this.#childError = undefined
      }
    }
  }
}
