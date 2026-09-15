import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/runtime/session-timeline-stream.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText
const { SessionTimelineSubscriptionHub } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

function item(id, sequence, overrides = {}) {
  return {
    id,
    sequence,
    sessionId: 'session-1',
    timestamp: `2026-09-14T00:00:0${sequence}.000Z`,
    actor: 'chatgpt',
    kind: 'work',
    tool: 'command_execute',
    actionType: 'command',
    arguments: {},
    ...overrides,
  }
}

async function waitFor(predicate, timeoutMs = 250) {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('condition was not reached before timeout')
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

test('same-session subscribers share one incremental backend poll and release Core only after the last unsubscribe', async () => {
  let resolveLoad
  let loadCalls = 0
  let releaseCalls = 0
  const hub = new SessionTimelineSubscriptionHub((_sessionId, afterSequence) => {
    loadCalls += 1
    assert.equal(afterSequence, 0)
    return new Promise((resolve) => { resolveLoad = resolve })
  }, async () => { releaseCalls += 1 }, { pollIntervalMs: 1000 })
  const first = []
  const second = []

  const unsubscribeFirst = hub.subscribe('session-1', 0, { onUpdates: (updates) => first.push(updates) })
  const unsubscribeSecond = hub.subscribe('session-1', 0, { onUpdates: (updates) => second.push(updates) })
  assert.equal(loadCalls, 1)
  assert.equal(hub.activeSessionCount, 1)

  resolveLoad({ cursorSequence: 1, updates: [item('call-1', 1)] })
  await waitFor(() => first.length === 1 && second.length === 1)
  assert.deepEqual(first[0].map(({ id }) => id), ['call-1'])
  assert.deepEqual(second[0].map(({ id }) => id), ['call-1'])

  unsubscribeFirst()
  assert.equal(hub.activeSessionCount, 1)
  assert.equal(releaseCalls, 0)
  unsubscribeSecond()
  await waitFor(() => releaseCalls === 1)
  assert.equal(hub.activeSessionCount, 0)
})

test('late subscriber rewinds the shared cursor through canonical updates instead of trusting incomplete local history', async () => {
  const cursors = []
  const hub = new SessionTimelineSubscriptionHub(async (_sessionId, afterSequence) => {
    cursors.push(afterSequence)
    return { cursorSequence: 1, updates: [item('call-1', 1)] }
  }, () => {}, { pollIntervalMs: 1000 })
  const first = []
  const second = []
  const unsubscribeFirst = hub.subscribe('session-1', 0, { onUpdates: (updates) => first.push(updates) })
  await waitFor(() => first.length === 1)
  const unsubscribeSecond = hub.subscribe('session-1', 0, { onUpdates: (updates) => second.push(updates) })
  await waitFor(() => second.length === 1)
  assert.deepEqual(cursors.slice(0, 2), [0, 0])
  assert.deepEqual(second[0].map(({ id }) => id), ['call-1'])
  unsubscribeFirst()
  unsubscribeSecond()
})

test('subscriber rewind during an in-flight poll cannot advance the behind subscriber past its missing range', async () => {
  const cursors = []
  let resolveFirst
  const hub = new SessionTimelineSubscriptionHub(async (_sessionId, afterSequence) => {
    cursors.push(afterSequence)
    if (cursors.length === 1) return await new Promise((resolve) => { resolveFirst = resolve })
    return { cursorSequence: 12, updates: [item('call-6', 6), item('call-12', 12)] }
  }, () => {}, { pollIntervalMs: 1000 })
  const first = []
  const second = []
  const unsubscribeFirst = hub.subscribe('session-1', 10, { onUpdates: (updates) => first.push(updates) })
  const unsubscribeSecond = hub.subscribe('session-1', 5, { onUpdates: (updates) => second.push(updates) })
  resolveFirst({ cursorSequence: 12, updates: [item('call-12', 12)] })
  await waitFor(() => cursors.length >= 2 && second.length === 1)
  assert.deepEqual(cursors.slice(0, 2), [10, 5])
  assert.deepEqual(first.flat().map(({ id }) => id), ['call-12'])
  assert.deepEqual(second[0].map(({ id }) => id), ['call-6', 'call-12'])
  unsubscribeFirst()
  unsubscribeSecond()
})

test('steady-state polling advances by cursor and never asks the loader for a full timeline snapshot', async () => {
  const cursors = []
  let call = 0
  const hub = new SessionTimelineSubscriptionHub(async (_sessionId, afterSequence) => {
    cursors.push(afterSequence)
    call += 1
    if (call === 1) return { cursorSequence: 6, updates: [item('call-6', 6)] }
    return { cursorSequence: 6, updates: [] }
  }, () => {}, { pollIntervalMs: 10 })
  const batches = []
  const unsubscribe = hub.subscribe('session-1', 5, { onUpdates: (updates) => batches.push(updates) })
  await waitFor(() => cursors.length >= 2)
  assert.deepEqual(cursors.slice(0, 2), [5, 6])
  assert.deepEqual(batches.flat().map(({ id }) => id), ['call-6'])

  unsubscribe()
  const callsAtCleanup = cursors.length
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(cursors.length, callsAtCleanup)
})

test('history-to-live upsert handoff remains duplicate-free when live updates race with the loaded history', async () => {
  const history = [item('call-1', 1)]
  const hub = new SessionTimelineSubscriptionHub(async (_sessionId, afterSequence) => {
    assert.equal(afterSequence, 1)
    return {
      cursorSequence: 3,
      updates: [item('call-1', 1, { status: 'success' }), item('call-2', 2)],
    }
  }, () => {}, { pollIntervalMs: 1000 })
  let merged = history
  const unsubscribe = hub.subscribe('session-1', 1, {
    onUpdates(updates) {
      const byId = new Map(merged.map((entry) => [entry.id, entry]))
      for (const update of updates) byId.set(update.id, update)
      merged = [...byId.values()].sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
    },
  })
  await waitFor(() => merged.length === 2)
  assert.deepEqual(merged.map(({ id }) => id), ['call-1', 'call-2'])
  assert.equal(merged[0].status, 'success')
  unsubscribe()
})
