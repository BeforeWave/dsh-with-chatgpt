import type { WorkHistoryBoundConversationIntent, WorkHistoryConversationIntent } from '../ui-contract/index.js'

export type WorkHistoryActivityFilter = 'all' | 'chatgpt' | 'subagent'

function workHistoryActivityTimestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function sortWorkHistoryActivityItemsNewestFirst<T extends { timestamp: string; sequence?: number }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftSequence = typeof left.item.sequence === 'number' ? left.item.sequence : undefined
      const rightSequence = typeof right.item.sequence === 'number' ? right.item.sequence : undefined
      if (leftSequence !== undefined && rightSequence !== undefined && leftSequence !== rightSequence) return rightSequence - leftSequence
      const byTime = workHistoryActivityTimestamp(right.item.timestamp) - workHistoryActivityTimestamp(left.item.timestamp)
      if (byTime) return byTime
      return (rightSequence ?? right.index) - (leftSequence ?? left.index)
    })
    .map(({ item }) => item)
}

export function filterWorkHistoryActivityItems<T extends { actor: string; timestamp: string; sequence?: number }>(items: readonly T[], filter: WorkHistoryActivityFilter): T[] {
  const filtered = filter === 'all' ? items : items.filter((item) => item.actor === filter)
  return sortWorkHistoryActivityItemsNewestFirst(filtered)
}


export function mergeGroupedWorkHistoryTimeline<T extends { id: string; timestamp: string; sequence?: number }>(
  current: readonly T[],
  workId: string,
  updates: readonly T[],
): T[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const update of updates) {
    const id = `${workId}:${update.id}`
    byId.set(id, { ...update, id, workId } as T)
  }
  return [...byId.values()]
    .sort((left, right) => workHistoryActivityTimestamp(left.timestamp) - workHistoryActivityTimestamp(right.timestamp) || left.id.localeCompare(right.id))
    .map((item, index) => ({ ...item, sequence: index + 1 })) as T[]
}


export interface WorkHistoryIntentScopeSource {
  createdAt: string
  originIntent?: WorkHistoryConversationIntent
  boundIntents: readonly WorkHistoryBoundConversationIntent[]
  timelineError?: string
}

export interface WorkHistoryIntentActivityScope {
  id: string
  intent: WorkHistoryConversationIntent
  kind: 'origin' | 'bound'
  startedAt: string
  endedAt?: string
  boundAt?: string
  timelineError?: string
}

export function createWorkHistoryIntentActivityScopes(sources: readonly WorkHistoryIntentScopeSource[]): WorkHistoryIntentActivityScope[] {
  const boundaries: Array<{
    kind: 'origin' | 'bound'
    intent: WorkHistoryConversationIntent
    startedAt: string
    timelineError?: string
  }> = []

  for (const source of sources) {
    if (!source.originIntent && !source.boundIntents.length) continue
    if (source.originIntent) {
      if (!Number.isFinite(Date.parse(source.createdAt))) return []
      boundaries.push({
        kind: 'origin',
        intent: source.originIntent,
        startedAt: source.createdAt,
        ...(source.timelineError ? { timelineError: source.timelineError } : {}),
      })
    }
    for (const entry of source.boundIntents) {
      if (!Number.isFinite(Date.parse(entry.boundAt))) return []
      boundaries.push({
        kind: 'bound',
        intent: entry.intent,
        startedAt: entry.boundAt,
        ...(source.timelineError ? { timelineError: source.timelineError } : {}),
      })
    }
  }
  if (!boundaries.length) return []

  boundaries.sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt))
  const sameIntent = (left: WorkHistoryConversationIntent, right: WorkHistoryConversationIntent) =>
    left.message === right.message && left.task === right.task

  const logicalBoundaries: typeof boundaries = []
  for (const boundary of boundaries) {
    const previous = logicalBoundaries[logicalBoundaries.length - 1]
    if (previous && previous.startedAt === boundary.startedAt && !sameIntent(previous.intent, boundary.intent)) return []
    if (previous && sameIntent(previous.intent, boundary.intent)) {
      if (!previous.timelineError && boundary.timelineError) previous.timelineError = boundary.timelineError
      continue
    }
    logicalBoundaries.push({ ...boundary })
  }

  return logicalBoundaries.map((entry, index) => {
    const next = logicalBoundaries[index + 1]
    const kind: 'origin' | 'bound' = index === 0 ? entry.kind : 'bound'
    return {
      id: `intent:${entry.startedAt}:${index}`,
      intent: entry.intent,
      kind,
      startedAt: entry.startedAt,
      ...(next ? { endedAt: next.startedAt } : {}),
      ...(kind === 'bound' ? { boundAt: entry.startedAt } : {}),
      ...(entry.timelineError ? { timelineError: entry.timelineError } : {}),
    }
  }).sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt) || right.id.localeCompare(left.id))
}

export function filterWorkHistoryTimelineByIntentScope<T extends { timestamp: string }>(
  timeline: readonly T[],
  scope: WorkHistoryIntentActivityScope,
): T[] {
  const startedAt = Date.parse(scope.startedAt)
  const endedAt = scope.endedAt ? Date.parse(scope.endedAt) : Number.POSITIVE_INFINITY
  if (!Number.isFinite(startedAt) || (scope.endedAt && !Number.isFinite(endedAt))) return []
  return timeline.filter((item) => {
    const timestamp = Date.parse(item.timestamp)
    return Number.isFinite(timestamp) && timestamp >= startedAt && timestamp < endedAt
  })
}

export function mergeWorkHistorySessionPage<T extends { id: string }>(current: readonly T[], latestPage: readonly T[]): T[] {
  const latestIds = new Set(latestPage.map((item) => item.id))
  return [...latestPage, ...current.filter((item) => !latestIds.has(item.id))]
}
