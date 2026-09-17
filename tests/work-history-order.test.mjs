import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const scratch = mkdtempSync(join(tmpdir(), 'dsh-work-history-order-'))
const outfile = join(scratch, 'work-history.mjs')
await build({
  entryPoints: [fileURLToPath(new URL('../src/app/work-history.ts', import.meta.url))],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile,
  logLevel: 'silent',
})
const workHistory = await import(pathToFileURL(outfile).href)
process.on('exit', () => rmSync(scratch, { recursive: true, force: true }))

function session(overrides = {}) {
  return {
    id: 'context-1',
    boundIntents: [],
    chatUrls: [],
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    lastActivityAt: '2026-09-02T00:00:00.000Z',
    eventCount: 0,
    chatCount: 0,
    delegationCount: 0,
    presentation: { title: 'context-1' },
    ...overrides,
  }
}

test('DSH Work History list and detail consume the Core-selected latest-intent title while preserving full context history', () => {
  const value = session({
    originIntent: { message: 'Oldest context', task: 'Initial task' },
    boundIntents: [
      { intent: { message: 'Middle context', task: 'Middle task' }, boundAt: '2026-09-02T01:00:00.000Z' },
      { intent: { message: 'Newest context', task: 'Latest task' }, boundAt: '2026-09-02T02:00:00.000Z' },
    ],
    presentation: { title: 'Newest context' },
  })

  const list = workHistory.createWorkHistorySessionListModel({ sessions: [value] })
  const detail = workHistory.createWorkHistorySessionDetailModel(value)
  assert.equal(list.items[0]?.title, 'Newest context')
  assert.equal(detail.title, 'Newest context')
  assert.equal(detail.originIntent?.message, 'Oldest context')
  assert.deepEqual(detail.boundIntents.map((entry) => entry.intent.message), ['Newest context', 'Middle context'])
})

test('DSH Work History timeline is newest first', () => {
  const timeline = [
    { id: 'old', actor: 'chatgpt', timestamp: '2026-09-02T01:00:00.000Z', sequence: 1 },
    { id: 'new', actor: 'chatgpt', timestamp: '2026-09-02T02:00:00.000Z', sequence: 2 },
  ]

  assert.deepEqual(
    workHistory.filterWorkHistoryTimeline(timeline, 'all').map((item) => item.id),
    ['new', 'old'],
  )
  assert.deepEqual(timeline.map((item) => item.id), ['old', 'new'])
})


test('DSH Work History orders origin and bound intents together by effective time newest first', () => {
  const value = session({
    createdAt: '2026-09-02T00:00:00.000Z',
    originIntent: { message: 'Oldest context', task: 'Initial task' },
    boundIntents: [
      { intent: { message: 'Middle context', task: 'Middle task' }, boundAt: '2026-09-02T01:00:00.000Z' },
      { intent: { message: 'Newest context', task: 'Latest task' }, boundAt: '2026-09-02T02:00:00.000Z' },
    ],
  })

  const history = workHistory.createWorkHistoryIntentHistory(value)
  assert.deepEqual(history.map((entry) => entry.intent.message), ['Newest context', 'Middle context', 'Oldest context'])
  assert.deepEqual(history.map((entry) => entry.kind), ['bound', 'bound', 'origin'])
  assert.deepEqual(history.map((entry) => entry.ordinal ?? null), [2, 1, null])
})

test('DSH Work History live merge upserts by id without duplicates and keeps sequence ordering stable', () => {
  const current = [
    { id: 'call-1', actor: 'chatgpt', timestamp: '2026-09-14T00:00:01.000Z', sequence: 1, status: 'running' },
    { id: 'call-2', actor: 'chatgpt', timestamp: '2026-09-14T00:00:02.000Z', sequence: 2 },
  ]
  const updates = [
    { id: 'call-1', actor: 'chatgpt', timestamp: '2026-09-14T00:00:01.000Z', sequence: 1, status: 'success' },
    { id: 'call-3', actor: 'chatgpt', timestamp: '2026-09-14T00:00:00.000Z', sequence: 3 },
  ]

  const merged = workHistory.mergeWorkHistoryTimeline(current, updates)
  assert.deepEqual(merged.map((item) => item.id), ['call-1', 'call-2', 'call-3'])
  assert.equal(merged.find((item) => item.id === 'call-1')?.status, 'success')
  assert.deepEqual(workHistory.filterWorkHistoryTimeline(merged, 'all').map((item) => item.id), ['call-3', 'call-2', 'call-1'])
})

test('DSH grouped Work History loads every member Session timeline before Intent scoping', async () => {
  const calls = []
  const value = session({
    id: 'context-a',
    memberSessionIds: ['context-a', 'context-b'],
  })
  const snapshot = await workHistory.loadWorkHistoryConversationTimeline(value, async (sessionId) => {
    calls.push(sessionId)
    if (sessionId === 'context-a') return [
      { id: 'a-1', actor: 'chatgpt', timestamp: '2026-09-02T01:00:00.000Z', sequence: 1 },
    ]
    return [
      { id: 'b-1', actor: 'chatgpt', timestamp: '2026-09-02T02:00:00.000Z', sequence: 1 },
    ]
  })

  assert.deepEqual(calls, ['context-a', 'context-b'])
  assert.equal(snapshot.grouped, true)
  assert.deepEqual(snapshot.memberSessionIds, ['context-a', 'context-b'])
  assert.deepEqual(snapshot.cursors, { 'context-a': 1, 'context-b': 1 })
  assert.deepEqual(snapshot.timeline.map((item) => item.id), ['context-a:a-1', 'context-b:b-1'])
  assert.deepEqual(snapshot.timeline.map((item) => item.sequence), [1, 2])

  const live = workHistory.mergeWorkHistoryConversationTimelineUpdates(snapshot.timeline, true, 'context-b', [
    { id: 'b-2', actor: 'chatgpt', timestamp: '2026-09-02T03:00:00.000Z', sequence: 2 },
  ])
  assert.deepEqual(live.map((item) => item.id), ['context-a:a-1', 'context-b:b-1', 'context-b:b-2'])
  assert.deepEqual(live.map((item) => item.sequence), [1, 2, 3])
})
