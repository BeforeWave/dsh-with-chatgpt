import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AdapterRpcClient, AdapterRpcServer, AgentRegistry, ControlRpcClient } from '@beforewave/agent-helm'

test('DSH and Chrome clients mutate and observe the same Core delegation authority', { skip: process.platform === 'win32' }, async () => {
  const home = await mkdtemp(join(tmpdir(), 'da'))
  const socket = join(home, 'rpc.sock')
  const agents = new AgentRegistry()
  agents.register({ id: 'codex', displayName: 'Codex', capabilities: {}, async health() { return { status: 'ok' } } })
  const snapshot = async () => ({
    status: 'ok',
    adapters: agents.list().map((adapter) => ({ id: adapter.id, displayName: adapter.displayName, delegationEnabled: agents.delegationEnabled(adapter.id) })),
  })
  const server = new AdapterRpcServer({
    socket, agents, supervisorHealth: snapshot,
    async setAgentDelegationEnabled(id, enabled) {
      agents.get(id)
      agents.setDelegationEnabled(id, enabled)
      return await snapshot()
    },
  })
  const dsh = new AdapterRpcClient({ socket, controlClientId: 'dsh-ui:test', adapter: { id: 'dsh-test', displayName: 'DSH', capabilities: {} } })
  const chrome = new ControlRpcClient({ socket, clientId: 'chrome-test' })
  try {
    await server.start()
    await dsh.start()
    await chrome.start()
    assert.equal(agents.delegationEnabled('codex'), true)
    await dsh.setAgentDelegationEnabled('codex', false)
    assert.equal((await chrome.supervisorHealth()).adapters[0].delegationEnabled, false)
    await chrome.setAgentDelegationEnabled('codex', true)
    assert.equal((await dsh.supervisorHealth()).adapters[0].delegationEnabled, true)
    await assert.rejects(dsh.setAgentDelegationEnabled('unknown', true), /unknown agent adapter/)
  } finally {
    await dsh.stop().catch(() => {})
    await chrome.stop().catch(() => {})
    await server.stop().catch(() => {})
    await rm(home, { recursive: true, force: true })
  }
})
