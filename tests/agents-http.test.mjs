import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { handleHelmStatusRequest } from '../lib/runtime/index.js'

test('DSH status HTTP endpoint relays per-Agent delegation to Core (not Code Sense)', async () => {
  const changes = []
  const runtime = {
    async setAgentDelegationEnabled(id, enabled) {
      changes.push([id, enabled])
      return { agents: [{ id, name: id, enabled }] }
    },
    async setNativeAgentEnabled() { throw new Error('must not modify Code Sense') },
  }
  const server = createServer((req, res) => {
    void handleHelmStatusRequest(runtime, req, res)
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const port = server.address().port
  const request = async (body) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/dsh-with-chatgpt/status`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    })
    return { status: response.status, json: await response.json() }
  }
  try {
    const success = await request({ target: 'agentDelegation', agentId: 'codex', enabled: false })
    assert.equal(success.status, 200)
    assert.equal(success.json.agents[0].enabled, false)
    assert.deepEqual(changes, [['codex', false]])
    const badAgent = await request({ target: 'agentDelegation', agentId: '', enabled: true })
    assert.equal(badAgent.status, 400)
    const badFlag = await request({ target: 'agentDelegation', agentId: 'codex', enabled: 'true' })
    assert.equal(badFlag.status, 400)
    assert.deepEqual(changes, [['codex', false]])
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
