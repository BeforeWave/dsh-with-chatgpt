import assert from 'node:assert/strict'
import test from 'node:test'
import { AdapterRpcServer, AgentRegistry, defaultDaemonEndpoint } from '@beforewave/agent-helm'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { selectStandaloneCoreSocket } from '../src/standalone/core-selection.ts'

const devSocket = '/dev/core.sock'
const hostHome = '/host/user'
const hostSocket = defaultDaemonEndpoint(hostHome)
const env = { AGENT_HELM_DAEMON_SOCKET: devSocket, AGENT_HELM_HOST_HOME: hostHome }

test('reuse existing dev Core first (no Host probing)', async () => {
  const calls = []
  const result = await selectStandaloneCoreSocket('auto', '', {
    env, probe: async socket => { calls.push(socket); return socket === devSocket },
  })
  assert.equal(result, devSocket)
  assert.deepEqual(calls, [devSocket])
})

test('auto attaches to verified Host Core if isolated dev Core is missing', async () => {
  const calls = []
  const result = await selectStandaloneCoreSocket('auto', '', {
    env, probe: async socket => { calls.push(socket); return socket === hostSocket },
  })
  assert.equal(result, hostSocket)
  assert.deepEqual(calls, [devSocket, hostSocket])
})

test('external can attach existing Host Core without spawning', async () => {
  const result = await selectStandaloneCoreSocket('external', '', {
    env, probe: async socket => socket === hostSocket,
  })
  assert.equal(result, hostSocket)
})

test('an explicit socket is authoritative, including if not running', async () => {
  const result = await selectStandaloneCoreSocket('auto', '/chosen/socket', {
    env, probe: async () => { throw new Error('must not probe unspecified socket') },
  })
  assert.equal(result, '/chosen/socket')
})

test('managed mode never attaches to an unrelated Host Core', async () => {
  const result = await selectStandaloneCoreSocket('managed', '', {
    env, probe: async () => { throw new Error('must not probe') },
  })
  assert.equal(result, '')
})

test('unavailable Core preserves existing launch behavior', async () => {
  const probes = []
  const result = await selectStandaloneCoreSocket('auto', '', {
    env, probe: async socket => { probes.push(socket); return false },
  })
  assert.equal(result, '')
  assert.deepEqual(probes, [devSocket, hostSocket])
})

test('Host socket is not fabricated without Host HOME', async () => {
  const probes = []
  const result = await selectStandaloneCoreSocket('auto', '', {
    env: { AGENT_HELM_DAEMON_SOCKET: devSocket },
    probe: async socket => { probes.push(socket); return false },
  })
  assert.equal(result, '')
  assert.deepEqual(probes, [devSocket])
})

test('real Core protocol ping attaches a live Host Core rather than spawning a competing dev Core', { skip: process.platform === 'win32' }, async () => {
  const home = await mkdtemp(process.platform === 'darwin' ? './h' : join(tmpdir(), 'h'))
  const socket = defaultDaemonEndpoint(home)
  await mkdir(dirname(socket), { recursive: true })
  const server = new AdapterRpcServer({ socket, agents: new AgentRegistry() })
  try {
    await server.start()
    const selected = await selectStandaloneCoreSocket('auto', '', {
      env: { AGENT_HELM_DAEMON_SOCKET: join(home, 'missing-dev.sock'), AGENT_HELM_HOST_HOME: home },
    })
    assert.equal(selected, socket, 'DSH standalone selected the existing protocol-compatible Host Core')
  } finally {
    await server.stop().catch(() => {})
    await rm(home, { recursive: true, force: true })
  }
})
