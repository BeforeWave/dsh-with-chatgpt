import type { WorkHistoryBoundConversationIntent, WorkHistoryConversationIntent, WorkHistorySession, WorkHistoryWorkspaceReference } from '../ui-contract.js'
import { filterWorkHistoryActivityItems, mergeGroupedWorkHistoryTimeline, type WorkHistoryActivityFilter } from '../__shared/work-history-ui/model.js'

export const WORK_HISTORY_ALL_WORKSPACES = 'all' as const
export const WORK_HISTORY_PAGE_SIZE = 10

export interface WorkHistoryWorkspaceOption {
  id: string
  label: string
}

export interface WorkHistoryWorkspaceSelectionModel {
  value: string
  options: WorkHistoryWorkspaceOption[]
}

export interface WorkHistoryListRecord {
  id: string
  title: string
  workspaceId?: string
  workspaceLabel?: string
  lastActivityAt: string
  eventCount: number
  chatCount: number
  delegationCount: number
}

export interface WorkHistorySessionListItem extends WorkHistoryListRecord {
  session: WorkHistorySession
}

export interface WorkHistorySessionListModel {
  workspace: WorkHistoryWorkspaceSelectionModel
  items: WorkHistorySessionListItem[]
  selectedId?: string
  selected?: WorkHistorySession
}

export interface WorkHistoryIntentHistoryEntry {
  kind: 'origin' | 'bound'
  intent: WorkHistoryConversationIntent
  effectiveAt: string
  ordinal?: number
}

export interface WorkHistorySessionDetailModel {
  id: string
  title: string
  workspaceId?: string
  workspaceLabel?: string
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  eventCount: number
  chatCount: number
  delegationCount: number
  originIntent?: WorkHistoryConversationIntent
  boundIntents: WorkHistoryBoundConversationIntent[]
  intentHistory: WorkHistoryIntentHistoryEntry[]
  chatUrls: string[]
  agentLabel?: string
  runtimeLabel?: string
}

function workHistoryTimestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

function sortWorkHistoryBoundIntentsNewestFirst(entries: readonly WorkHistoryBoundConversationIntent[]): WorkHistoryBoundConversationIntent[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => workHistoryTimestamp(right.entry.boundAt) - workHistoryTimestamp(left.entry.boundAt) || right.index - left.index)
    .map(({ entry }) => entry)
}

export function createWorkHistoryIntentHistory(session: WorkHistorySession): WorkHistoryIntentHistoryEntry[] {
  const entries: WorkHistoryIntentHistoryEntry[] = session.boundIntents.map((entry, index) => ({
    kind: 'bound',
    intent: entry.intent,
    effectiveAt: entry.boundAt,
    ordinal: index + 1,
  }))
  if (session.originIntent) entries.push({
    kind: 'origin',
    intent: session.originIntent,
    effectiveAt: session.createdAt,
  })
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => workHistoryTimestamp(right.entry.effectiveAt) - workHistoryTimestamp(left.entry.effectiveAt) || right.index - left.index)
    .map(({ entry }) => entry)
}

export function mergeWorkHistoryTimeline<T extends { id: string; timestamp: string; sequence?: number }>(
  current: readonly T[],
  updates: readonly T[],
): T[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const update of updates) byId.set(update.id, update)
  return [...byId.values()]
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftSequence = typeof left.item.sequence === 'number' ? left.item.sequence : Number.MAX_SAFE_INTEGER
      const rightSequence = typeof right.item.sequence === 'number' ? right.item.sequence : Number.MAX_SAFE_INTEGER
      if (leftSequence !== rightSequence) return leftSequence - rightSequence
      const byTime = workHistoryTimestamp(left.item.timestamp) - workHistoryTimestamp(right.item.timestamp)
      if (byTime) return byTime
      return left.item.id.localeCompare(right.item.id) || left.index - right.index
    })
    .map(({ item }) => item)
}


export interface WorkHistoryConversationTimelineSnapshot<T> {
  memberSessionIds: string[]
  grouped: boolean
  cursors: Record<string, number>
  timeline: T[]
}

export async function loadWorkHistoryConversationTimeline<T extends { id: string; timestamp: string; sequence?: number }>(
  session: Pick<WorkHistorySession, 'id' | 'memberSessionIds'>,
  loadTimeline: (sessionId: string) => Promise<T[]>,
): Promise<WorkHistoryConversationTimelineSnapshot<T>> {
  const memberSessionIds = session.memberSessionIds?.length ? [...session.memberSessionIds] : [session.id]
  const grouped = memberSessionIds.length > 1
  const members = await Promise.all(memberSessionIds.map(async (memberSessionId) => ({
    memberSessionId,
    timeline: await loadTimeline(memberSessionId),
  })))
  const cursors: Record<string, number> = {}
  let timeline: T[] = []
  for (const member of members) {
    cursors[member.memberSessionId] = member.timeline.reduce((cursor, item) => Math.max(cursor, item.sequence ?? 0), 0)
    timeline = grouped
      ? mergeGroupedWorkHistoryTimeline(timeline, member.memberSessionId, member.timeline)
      : [...member.timeline]
  }
  return { memberSessionIds, grouped, cursors, timeline }
}

export function mergeWorkHistoryConversationTimelineUpdates<T extends { id: string; timestamp: string; sequence?: number }>(
  current: readonly T[],
  grouped: boolean,
  memberSessionId: string,
  updates: readonly T[],
): T[] {
  return grouped
    ? mergeGroupedWorkHistoryTimeline(current, memberSessionId, updates)
    : mergeWorkHistoryTimeline(current, updates)
}

export function workHistorySessionWorkspaceId(session: WorkHistorySession): string | undefined {
  return session.workspace?.id ?? session.activeWorkspaceId
}

export function workHistorySessionWorkspaceLabel(session: WorkHistorySession): string | undefined {
  return session.presentation.workspaceLabel
}

export function createWorkHistoryWorkspaceSelectionModel(
  sessions: readonly WorkHistorySession[],
  value: string = WORK_HISTORY_ALL_WORKSPACES,
  workspaces: readonly WorkHistoryWorkspaceReference[] = [],
): WorkHistoryWorkspaceSelectionModel {
  const byId = new Map<string, string>()
  for (const workspace of workspaces) {
    if (!workspace.id) continue
    byId.set(workspace.id, workspace.title ?? workspace.path ?? workspace.id)
  }
  for (const session of sessions) {
    const id = workHistorySessionWorkspaceId(session)
    if (!id) continue
    if (!byId.has(id)) byId.set(id, workHistorySessionWorkspaceLabel(session) ?? id)
  }
  return {
    value,
    options: [...byId].map(([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label)),
  }
}

export function filterWorkHistorySessions(
  sessions: readonly WorkHistorySession[],
  workspaceId: string = WORK_HISTORY_ALL_WORKSPACES,
): WorkHistorySession[] {
  return workspaceId === WORK_HISTORY_ALL_WORKSPACES
    ? [...sessions]
    : sessions.filter((session) => workHistorySessionWorkspaceId(session) === workspaceId)
}

export function createWorkHistorySessionListItem(session: WorkHistorySession): WorkHistorySessionListItem {
  const workspaceId = workHistorySessionWorkspaceId(session)
  const workspaceLabel = workHistorySessionWorkspaceLabel(session)
  return {
    id: session.id,
    title: session.presentation.title,
    ...(workspaceId ? { workspaceId } : {}),
    ...(workspaceLabel ? { workspaceLabel } : {}),
    lastActivityAt: session.lastActivityAt,
    eventCount: session.eventCount,
    chatCount: session.chatCount,
    delegationCount: session.delegationCount,
    session,
  }
}


export interface WorkHistoryListModel<T extends WorkHistoryListRecord = WorkHistoryListRecord> {
  workspace: WorkHistoryWorkspaceSelectionModel
  items: T[]
  selectedId?: string
  selected?: T
}

export function createWorkHistoryListModel<T extends WorkHistoryListRecord>(input: {
  items: readonly T[]
  workspaceId?: string
  selectedId?: string | null
  workspaces?: readonly WorkHistoryWorkspaceReference[]
  autoSelectFirst?: boolean
}): WorkHistoryListModel<T> {
  const workspaceId = input.workspaceId ?? WORK_HISTORY_ALL_WORKSPACES
  const byId = new Map<string, string>()
  for (const workspace of input.workspaces ?? []) {
    if (!workspace.id) continue
    byId.set(workspace.id, workspace.title ?? workspace.path ?? workspace.id)
  }
  for (const item of input.items) {
    if (!item.workspaceId) continue
    if (!byId.has(item.workspaceId)) byId.set(item.workspaceId, item.workspaceLabel ?? item.workspaceId)
  }
  const visible = workspaceId === WORK_HISTORY_ALL_WORKSPACES
    ? [...input.items]
    : input.items.filter((item) => item.workspaceId === workspaceId)
  const selectedId = input.selectedId && visible.some((item) => item.id === input.selectedId)
    ? input.selectedId
    : input.autoSelectFirst === false ? undefined : visible[0]?.id
  const selected = selectedId ? visible.find((item) => item.id === selectedId) : undefined
  return {
    workspace: {
      value: workspaceId,
      options: [...byId].map(([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label)),
    },
    items: visible,
    ...(selectedId ? { selectedId } : {}),
    ...(selected ? { selected } : {}),
  }
}

export function createWorkHistorySessionListModel(input: {
  sessions: readonly WorkHistorySession[]
  workspaceId?: string
  selectedId?: string | null
  workspaces?: readonly WorkHistoryWorkspaceReference[]
}): WorkHistorySessionListModel {
  const records = input.sessions.map(createWorkHistorySessionListItem)
  const list = createWorkHistoryListModel({
    items: records,
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    ...(input.selectedId !== undefined ? { selectedId: input.selectedId } : {}),
    ...(input.workspaces ? { workspaces: input.workspaces } : {}),
  })
  return {
    workspace: list.workspace,
    items: list.items,
    ...(list.selectedId ? { selectedId: list.selectedId } : {}),
    ...(list.selected ? { selected: list.selected.session } : {}),
  }
}

export function createWorkHistorySessionDetailModel(session: WorkHistorySession): WorkHistorySessionDetailModel {
  const workspaceId = workHistorySessionWorkspaceId(session)
  const workspaceLabel = workHistorySessionWorkspaceLabel(session)
  return {
    id: session.id,
    title: session.presentation.title,
    ...(workspaceId ? { workspaceId } : {}),
    ...(workspaceLabel ? { workspaceLabel } : {}),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastActivityAt: session.lastActivityAt,
    eventCount: session.eventCount,
    chatCount: session.chatCount,
    delegationCount: session.delegationCount,
    ...(session.originIntent ? { originIntent: session.originIntent } : {}),
    boundIntents: sortWorkHistoryBoundIntentsNewestFirst(session.boundIntents),
    intentHistory: createWorkHistoryIntentHistory(session),
    chatUrls: [...session.chatUrls],
    ...(session.agentLabel ? { agentLabel: session.agentLabel } : {}),
    ...(session.runtimeLabel ? { runtimeLabel: session.runtimeLabel } : {}),
  }
}

export type { WorkHistoryActivityFilter }

export function filterWorkHistoryTimeline<T extends { actor: string; timestamp: string; sequence?: number }>(timeline: readonly T[], filter: WorkHistoryActivityFilter): T[] {
  return filterWorkHistoryActivityItems(timeline, filter)
}
