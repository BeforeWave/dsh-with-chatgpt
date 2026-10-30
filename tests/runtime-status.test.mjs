import assert from 'node:assert/strict'
import test from 'node:test'

import { coreDependencyStatus, resolveHelmUiStatus } from '../lib/runtime/index.js'

test('dependency status distinguishes disabled and ready dependencies', () => {
  assert.deepEqual(
    coreDependencyStatus({
      dependencies: {
        serena: { configured: false, available: false, command: 'serena' },
        tunnelClient: { configured: true, available: true, command: 'tunnel-client' },
      },
    }),
    {
      serena: { state: 'disabled', command: 'serena' },
      tunnelClient: { state: 'ready', command: 'tunnel-client' },
    },
  )
})

test('dependency status exposes install guidance only when unavailable', () => {
  assert.deepEqual(
    coreDependencyStatus({
      dependencies: {
        serena: {
          configured: true,
          available: false,
          command: 'serena',
          install: { automatic: true, command: 'install-serena', url: 'https://example.invalid/serena' },
        },
        tunnelClient: { configured: false, available: false, command: 'tunnel-client' },
      },
    }),
    {
      serena: {
        state: 'unavailable',
        command: 'serena',
        installUrl: 'https://example.invalid/serena',
        installCommand: 'install-serena',
      },
      tunnelClient: { state: 'disabled', command: 'tunnel-client' },
    },
  )
})


test('runtime status echoes the saved Tunnel proxy', async () => {
  const rpc = {
    connected: true,
    async supervisorHealth() {
      return {
        status: 'ok',
        daemon: { lifecycleOwner: 'control:dsh' },
        dependencies: {
          serena: { configured: false, available: false, command: 'serena' },
          tunnelClient: { configured: true, available: true, command: 'tunnel-client' },
        },
        tunnel: {
          running: true, configured: true, tunnelId: 'tunnel_proxy', apiKeyConfigured: true, proxyConfigured: true, proxyUrl: 'http://127.0.0.1:7890',
        },
        localMcp: { enabled: false },
        externalCapabilities: { command: true, semantic: true, read_only: false, delegate: false },
        externalUserAccess: { enabled: true, mutations: true, delegation: false },
      }
    },
  }
  const status = await resolveHelmUiStatus(rpc, undefined, 'control:dsh')
  assert.equal(status.tunnel.proxyConfigured, true)
  assert.equal(status.tunnel.proxyUrl, 'http://127.0.0.1:7890')
})

test('legacy Core health keeps ChatGPT Code Sense default-on while the new runtime toggle is unavailable', async () => {
  const rpc = {
    connected: true,
    async supervisorHealth() {
      return {
        status: 'ok',
        daemon: { lifecycleOwner: 'control:dsh' },
        dependencies: {
          serena: { configured: true, available: true, command: 'serena' },
          tunnelClient: { configured: false, available: false, command: 'tunnel-client' },
        },
        serena: { connected: true },
        tunnel: { running: false },
        localMcp: { enabled: false },
        externalCapabilities: { command: true, semantic: true, read_only: false, delegate: false },
        externalUserAccess: { enabled: true, mutations: true, delegation: false },
      }
    },
  }
  const status = await resolveHelmUiStatus(rpc, undefined, 'control:dsh')
  assert.equal(status.externalAgentLsp.enabled, true)
  assert.equal(status.externalAgentLsp.configurable, false)
  assert.equal(status.externalAgentLsp.state, 'unavailable')
  assert.equal(status.nativeAgents.codex.installed, undefined, 'older Core provides no installation evidence')
  assert.equal(status.nativeAgents.claude.installed, undefined, 'older Core provides no installation evidence')
  assert.equal(status.nativeAgents.codex.enabled, false)
})


test('DSH UI receives native Code Sense Agent icon hints without altering their enabled state', async () => {
  const iconDataUrl = 'data:image/png;base64,iVBORw0KGgo='
  const rpc = {
    connected: true,
    async supervisorHealth() {
      return {
        status: 'ok', daemon: { lifecycleOwner: 'control:dsh' },
        dependencies: { serena: { configured: true, available: true, command: 'serena' }, tunnelClient: { configured: false, available: false, command: 'tunnel-client' } },
        serena: { connected: true }, tunnel: { running: false }, localMcp: { enabled: false },
        nativeAgents: { codex: { installed: true, configured: true, enabled: true, iconDataUrl }, claude: { installed: false, configured: false, enabled: false } },
        externalCapabilities: { command: true, semantic: true, read_only: false, delegate: false },
        externalUserAccess: { enabled: true, mutations: true, delegation: false },
      }
    },
  }
  const status = await resolveHelmUiStatus(rpc, undefined, 'control:dsh')
  assert.equal(status.nativeAgents.codex.iconDataUrl, iconDataUrl)
  assert.equal(status.nativeAgents.codex.enabled, true)
  assert.equal(status.nativeAgents.claude.iconDataUrl, undefined)
  assert.equal(status.nativeAgents.claude.enabled, false)
})

test('DSH Agents lists the exact Core registered adapters, icon and delegation state, independent of Code Sense', async () => {
  const iconDataUrl = 'data:image/png;base64,iVBORw0KGgo='
  const rpc = {
    connected: true,
    async supervisorHealth() {
      return {
        status: 'ok',
        daemon: { lifecycleOwner: 'control:dsh' },
        dependencies: { serena: { configured: true, available: true, command: 'serena' }, tunnelClient: { configured: false, available: false, command: 'tunnel-client' } },
        serena: { connected: true }, tunnel: { running: false }, localMcp: { enabled: false },
        adapters: [
          { id: 'codex', displayName: 'Codex', delegationEnabled: false, health: { status: 'ok', installed: true }, iconDataUrl },
          { id: 'dsh', displayName: 'DSH', delegationEnabled: true, health: { status: 'ok', installed: true } },
        ],
        nativeAgents: { codex: { enabled: true, installed: true, configured: true } },
        externalCapabilities: { command: true, semantic: true, read_only: false, delegate: true },
        externalUserAccess: { enabled: true, mutations: true, delegation: true },
      }
    },
  }
  const result = await resolveHelmUiStatus(rpc, undefined, 'control:dsh')
  assert.deepEqual(result.agents.map(({ id, enabled }) => ({ id, enabled })), [
    { id: 'codex', enabled: false }, { id: 'dsh', enabled: true },
  ])
  assert.equal(result.agents[0].iconDataUrl, iconDataUrl)
  assert.equal(result.nativeAgents.codex.enabled, true, 'Codex Code Sense is not coupled to delegation switch')
  assert.equal(result.effectiveExternalAccess.delegation, true, 'overall permission is a separate switch')
})

test('legacy Core without adapters produces an empty Agents list without crashing UI', async () => {
  const status = await resolveHelmUiStatus({
    connected: true,
    async supervisorHealth() { return { status: 'ok' } },
  })
  assert.deepEqual(status.agents, [])
})
