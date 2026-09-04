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
