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

test('DSH Work History consumes the Core-selected Session title', () => {
  const value = session({
    originIntent: { message: 'Oldest context', task: 'Initial task' },
    boundIntents: [
      { intent: { message: 'Middle context', task: 'Middle task' }, boundAt: '2026-09-02T01:00:00.000Z' },
      { intent: { message: 'Newest context', task: 'Latest task' }, boundAt: '2026-09-02T02:00:00.000Z' },
    ],
    presentation: { title: 'Core-selected title' },
  })

  assert.equal(workHistory.createWorkHistorySessionDetailModel(value).title, 'Core-selected title')
  assert.deepEqual(
    workHistory.createWorkHistorySessionDetailModel(value).boundIntents.map((entry) => entry.intent.message),
    ['Newest context', 'Middle context'],
  )
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


test('DSH Work History renders bound contexts before the origin context', () => {
  const component = readFileSync(new URL('../src/app/components/session-activity.tsx', import.meta.url), 'utf8')
  const boundContexts = component.indexOf('{sortedBoundIntents.map')
  const originContext = component.indexOf('{labels.originChat}', boundContexts)

  assert.ok(boundContexts >= 0)
  assert.ok(originContext > boundContexts)
})
