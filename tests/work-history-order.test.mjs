import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/app/work-history.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText
const workHistory = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

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


test('DSH Work History renders the origin context before bound contexts', () => {
  const component = readFileSync(new URL('../src/app/components/session-activity.tsx', import.meta.url), 'utf8')
  const originContext = component.indexOf('{labels.originChat}')
  const boundContexts = component.indexOf('{sortedBoundIntents.map', originContext)

  assert.ok(originContext >= 0)
  assert.ok(boundContexts > originContext)
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
