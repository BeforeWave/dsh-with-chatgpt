import { homedir } from 'node:os'
import {
  AdapterRpcClient,
  defaultDaemonEndpoint,
  coreRuntimeEnvironment,
  loadCoreConfig,
  probeDaemon,
  type ChatSessionActivity,
  type ChatSessionSummary,
  type ChatSessionSummaryPage,
  type ChatSessionTimelineItem,
  type CoreConfigOverride,
  type DelegatedSession,
  type ExternalUserAccess,
  type TunnelSetupInput,
} from '@beforewave/agent-helm'
import { normalizeWorkHistorySession } from '@beforewave/agent-helm-ui-contract'

const WORK_HISTORY_PAGE_SIZE = 10
import type { ChatGPTHelmHostAdapter, ChatGPTHelmRuntimeLogger, LocalMcpRuntime } from './contracts.js'
import { ManagedDaemon, resolveDaemonLaunchPlan, type DaemonMode } from './daemon.js'
import {
  resolveHelmUiStatus,
  type HelmUiDependencyName,
  type HelmUiStatus,
} from './status.js'

function defaultCoreDaemonSocket(): string { return process.env.AGENT_HELM_DAEMON_SOCKET?.trim() || defaultDaemonEndpoint(homedir()) }

export interface ChatGPTHelmRuntimeOptions {
  daemonMode: DaemonMode
  launcherOverride: CoreConfigOverride
  host: ChatGPTHelmHostAdapter
  logger?: ChatGPTHelmRuntimeLogger
}

export interface ChatGPTHelmRuntimeStatus extends HelmUiStatus {
  running: boolean
  lifecycleManaged: boolean
  coreSocket?: string
}

export class ChatGPTHelmRuntime {
  #managed: ManagedDaemon | undefined
  #rpc: AdapterRpcClient | undefined
  #localMcp: LocalMcpRuntime | undefined
  #started = false
  #coreSocket: string | undefined
  #tunnelClientReady = false
  #startupError: string | undefined
  constructor(readonly options: ChatGPTHelmRuntimeOptions) {}

  get running(): boolean { return this.#started }
  get rpc(): AdapterRpcClient {
    if (!this.#rpc) throw new Error('dsh-with-chatgpt runtime is not started')
    return this.#rpc
  }

  async #attachRpc(): Promise<void> {
    if (this.#rpc?.connected) return
    if (!this.#coreSocket) throw new Error('dsh-with-chatgpt Core socket is not initialized')
    const rpc = new AdapterRpcClient({ socket: this.#coreSocket, adapter: this.options.host.adapter })
    try {
      await rpc.start()
      this.#rpc = rpc
      this.#localMcp = this.options.host.createLocalMcp?.(rpc)
      await this.#localMcp?.syncFromCore().catch(() => {})
      this.options.logger?.info(`dsh-with-chatgpt: adapter ${this.options.host.adapter.id} registered with Core`)
    } catch (error) {
      await this.#localMcp?.disable().catch(() => {})
      this.#localMcp = undefined
      await rpc.stop().catch(() => {})
      this.#rpc = undefined
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes(`agent adapter already registered: ${this.options.host.adapter.id}`)) {
        throw new Error(
          `dsh-with-chatgpt: adapter ${this.options.host.adapter.id} is already registered with Core; another DSH host is still connected. Stop the existing DSH process or configure a different adapterId before starting this profile.`,
          { cause: error },
        )
      }
      throw error
    }
  }

  async #detachRpc(): Promise<void> {
    const localMcp = this.#localMcp
    const rpc = this.#rpc
    this.#localMcp = undefined
    this.#rpc = undefined
    this.#tunnelClientReady = false
    await localMcp?.disable().catch(() => {})
    await rpc?.stop().catch(() => {})
  }

  #ensureCoreSocket(): string {
    const socket = (this.#coreSocket ?? this.options.launcherOverride.daemon?.socket?.trim()) || defaultCoreDaemonSocket()
    this.#coreSocket = socket
    return socket
  }

  async #loadManagedConfig() {
    const socket = this.#ensureCoreSocket()
    return await loadCoreConfig({
      launcherOverride: {
        ...this.options.launcherOverride,
        daemon: { ...this.options.launcherOverride.daemon, socket },
      },
    })
  }

  async #spawnManaged(env: NodeJS.ProcessEnv): Promise<void> {
    if (this.#managed) return
    if (!this.#coreSocket) throw new Error('dsh-with-chatgpt Core socket is not initialized')
    const override: CoreConfigOverride = {
      ...this.options.launcherOverride,
      daemon: { ...this.options.launcherOverride.daemon, socket: this.#coreSocket },
    }
    const managed = new ManagedDaemon({
      socket: this.#coreSocket,
      override,
      lifecycleOwner: `adapter:${this.options.host.adapter.id}`,
      env,
      onStdout: (chunk) => { const line = chunk.trim(); if (line) this.options.logger?.info(`dsh-with-chatgpt:core ${line}`) },
      onStderr: (chunk) => { const line = chunk.trim(); if (line) this.options.logger?.info(`dsh-with-chatgpt:core ${line}`) },
    })
    await managed.start()
    this.#managed = managed
    this.options.logger?.info(`dsh-with-chatgpt: managed Core daemon started (pid=${String(managed.pid)})`)
  }

  async #waitForDaemonExit(): Promise<void> {
    if (!this.#coreSocket) return
    const deadline = Date.now() + 10_000
    while (Date.now() < deadline) {
      if (!await probeDaemon(this.#coreSocket, 250)) return
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('Agent Helm daemon did not exit after shutdown request.')
  }

  async start(): Promise<void> {
    if (this.#started) return
    try {
      const socket = this.#ensureCoreSocket()
      const plan = resolveDaemonLaunchPlan(this.options.daemonMode, await probeDaemon(socket))
      if (plan === 'spawn') {
        const loaded = await this.#loadManagedConfig()
        await this.#spawnManaged(coreRuntimeEnvironment(loaded))
      } else {
        this.options.logger?.info(`dsh-with-chatgpt: attached to external Core daemon at ${socket}`)
      }
      await this.#attachRpc()
      if (plan === 'spawn') {
        await this.rpc.setCoreEnabled(true)
        await this.#localMcp?.syncFromCore().catch(() => {})
      }
      this.#startupError = undefined
      this.#started = true
    } catch (error) {
      this.#startupError = error instanceof Error ? error.message : String(error)
      await this.#detachRpc()
      await this.options.host.dispose?.().catch(() => {})
      await this.#managed?.stop().catch(() => {})
      this.#managed = undefined
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.#rpc && !this.#managed && !this.#started) return
    this.#started = false
    this.#tunnelClientReady = false
    const localMcp = this.#localMcp
    const rpc = this.#rpc
    const managed = this.#managed
    this.#localMcp = undefined
    this.#rpc = undefined
    this.#managed = undefined
    await localMcp?.disable().catch(() => {})
    await rpc?.stop().catch(() => {})
    await this.options.host.dispose?.().catch(() => {})
    await managed?.stop().catch(() => {})
  }

  async getStatus(): Promise<ChatGPTHelmRuntimeStatus> {
    const rpc = this.#rpc
    const lifecycleOwner = `adapter:${this.options.host.adapter.id}`
    if (!rpc?.connected) {
      const status = await resolveHelmUiStatus(
        { connected: false } as AdapterRpcClient,
        undefined,
        lifecycleOwner,
      )
      const configurable = this.options.daemonMode !== 'external'
      return {
        ...status,
        core: {
          state: this.#startupError ? 'unavailable' : 'stopped',
          enabled: false,
          configurable,
          ...(this.#startupError ? { message: this.#startupError } : {}),
        },
        running: false,
        lifecycleManaged: false,
        ...(this.#coreSocket ? { coreSocket: this.#coreSocket } : {}),
      }
    }
    let status = await resolveHelmUiStatus(rpc, this.#localMcp, lifecycleOwner)
    const ready = status.dependencies.tunnelClient.state === 'ready' || status.dependencies.tunnelClient.state === 'running'
    const shouldReconcile = ready && rpc.connected && !this.#tunnelClientReady
    this.#tunnelClientReady = ready
    if (shouldReconcile) {
      try {
        await rpc.reconcile()
        status = await resolveHelmUiStatus(rpc, this.#localMcp, lifecycleOwner)
      } catch {
        this.#tunnelClientReady = false
      }
    }
    return {
      ...status,
      running: true,
      lifecycleManaged: status.core.configurable === true,
      ...(this.#coreSocket ? { coreSocket: this.#coreSocket } : {}),
    }
  }

  async installDependency(name: HelmUiDependencyName): Promise<ChatGPTHelmRuntimeStatus> {
    await this.rpc.installDependency(name, name === 'tunnelClient' ? 'dsh' : undefined)
    this.#tunnelClientReady = false
    return await this.getStatus()
  }

  async configureTunnel(input: TunnelSetupInput): Promise<ChatGPTHelmRuntimeStatus> {
    await this.rpc.configureTunnel(input)
    this.#tunnelClientReady = false
    return await this.getStatus()
  }

  async setCoreEnabled(enabled: boolean): Promise<ChatGPTHelmRuntimeStatus> {
    if (!enabled) {
      const rpc = this.#rpc
      if (!rpc?.connected) return await this.getStatus()
      await rpc.shutdownDaemon()
      await this.#detachRpc()
      this.#managed = undefined
      await this.#waitForDaemonExit()
      return await this.getStatus()
    }

    if (this.#rpc?.connected) return await this.getStatus()
    try {
      const socket = this.#ensureCoreSocket()
      const plan = resolveDaemonLaunchPlan(this.options.daemonMode, await probeDaemon(socket))
      if (plan === 'spawn') {
        const loaded = await this.#loadManagedConfig()
        await this.#spawnManaged(coreRuntimeEnvironment(loaded))
      } else {
        this.options.logger?.info(`dsh-with-chatgpt: attached to external Core daemon at ${socket}`)
      }
      await this.#attachRpc()
      if (plan === 'spawn') {
        await this.rpc.setCoreEnabled(true)
        await this.#localMcp?.syncFromCore().catch(() => {})
      }
      this.#startupError = undefined
      return await this.getStatus()
    } catch (error) {
      this.#startupError = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  async setLocalMcpEnabled(enabled: boolean): Promise<ChatGPTHelmRuntimeStatus> {
    await this.rpc.setLocalMcpEnabled(enabled)
    if (!enabled) await this.#localMcp?.disable()
    else {
      try {
        await this.#localMcp?.enable()
      } catch (error) {
        await this.rpc.setLocalMcpEnabled(false).catch(() => {})
        throw new Error(`local MCP client could not connect: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    return await this.getStatus()
  }

  async setExternalUserAccess(access: Partial<ExternalUserAccess>): Promise<ChatGPTHelmRuntimeStatus> {
    await this.rpc.setExternalUserAccess(access)
    return await this.getStatus()
  }

  async getSessionPage(cursor?: string, limit = WORK_HISTORY_PAGE_SIZE): Promise<ChatSessionSummaryPage> {
    const page = await this.rpc.listChatSessionSummaryPage(cursor, limit)
    return {
      sessions: page.sessions.map((session) => normalizeWorkHistorySession(session)).filter((session): session is NonNullable<ReturnType<typeof normalizeWorkHistorySession>> => Boolean(session)) as unknown as ChatSessionSummary[],
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    }
  }
  async getSession(id: string): Promise<ChatSessionSummary | undefined> {
    const session = await this.rpc.getChatSessionSummary(id)
    return session ? normalizeWorkHistorySession(session) as unknown as ChatSessionSummary : undefined
  }
  async getSessionTimeline(id: string): Promise<ChatSessionTimelineItem[]> { return await this.rpc.getChatSessionTimeline(id) }
  async getSessionActivity(id: string): Promise<ChatSessionActivity[]> { return await this.rpc.getChatSessionActivity(id) }
  async getSessionDelegations(id: string): Promise<DelegatedSession[]> { return await this.rpc.getChatSessionDelegations(id) }
}
