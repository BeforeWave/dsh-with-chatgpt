import assert from 'node:assert/strict'
import test from 'node:test'

import { coreDependencyStatus } from '../lib/runtime/index.js'

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
