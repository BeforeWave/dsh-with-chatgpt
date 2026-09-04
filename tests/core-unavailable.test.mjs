import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { apply } from '../lib/index.js'
import { ChatGPTHelmRuntime, HELM_SESSION_API_PATH, HELM_UI_STATUS_PATH } from '../lib/runtime/index.js'

function deadSocket() {
  return join(tmpdir(), `agent-helm-dsh-unavailable-${randomUUID()}.sock`)
}

function externalConfig(socket) {
  return {
    daemonMode: 'external',
    daemonSocket: socket,
    adapterId: 'dsh-test',
    host: '127.0.0.1',
    port: 3457,
    tokenFile: '',
    tokenEnv: 'AGENT_HELM_TOKEN',
    tunnelEnabled: true,
    tunnelIdEnv: 'CONTROL_PLANE_TUNNEL_ID',
    tunnelApiKeyEnv: 'CONTROL_PLANE_API_KEY',
    tunnelProxyEnv: 'HTTPS_PROXY',
    tunnelPollTimeoutMs: 30000,
    tunnelPollDeadlineGuardrailMs: 3000,
    tunnelHealthListenAddr: '127.0.0.1:3458',
  }
}

test('runtime reports Core startup failure as unavailable instead of losing status', async () => {
  const runtime = new ChatGPTHelmRuntime({
    daemonMode: 'external',
    launcherOverride: { daemon: { socket: deadSocket() } },
    host: { adapter: { id: 'dsh-test' } },
  })

  await assert.rejects(runtime.start(), /requires an existing Agent Helm daemon/)
  const status = await runtime.getStatus()
  assert.equal(status.core.state, 'unavailable')
  assert.equal(status.core.enabled, false)
  assert.equal(status.core.configurable, false)
  assert.match(status.core.message ?? '', /requires an existing Agent Helm daemon/)
  await runtime.stop()
})

test('DSH keeps Agent Helm status routes registered when external Core is unavailable', async () => {
  const routes = []
  const warnings = []
  let cleanup
  const ctx = {
    logger: {
      info() {},
      warn(message) { warnings.push(String(message)) },
    },
    webServer: {
      register(route) {
        routes.push(route)
        return () => {}
      },
    },
    async effect(factory) {
      const iterator = factory()
      const first = await iterator.next()
      cleanup = first.value
    },
  }

  await apply(ctx, externalConfig(deadSocket()))

  assert.deepEqual(routes.map((route) => route.path).sort(), [HELM_SESSION_API_PATH, HELM_UI_STATUS_PATH].sort())
  assert.ok(warnings.some((message) => message.includes('Agent Helm Core is unavailable during startup')))
  assert.equal(typeof cleanup, 'function')
  await cleanup()
})

test('DSH popup source renders a visible unavailable body when status fetch fails', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/app/app.tsx', import.meta.url), 'utf8')
  assert.match(source, /!status && error\?\.target === 'status'/)
  assert.match(source, /state="unavailable"/)
  assert.match(source, /\{error\.detail\}/)
})
