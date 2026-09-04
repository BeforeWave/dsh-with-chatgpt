import type { WorkHistoryBoundConversationIntent, WorkHistoryConversationIntent, WorkHistorySession, WorkHistoryWorkspaceReference } from '@beforewave/agent-helm-ui-contract'

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

function sortWorkHistoryTimelineNewestFirst<T extends { timestamp: string; sequence?: number }>(timeline: readonly T[]): T[] {
  return timeline
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const byTime = workHistoryTimestamp(right.item.timestamp) - workHistoryTimestamp(left.item.timestamp)
      if (byTime) return byTime
      const leftSequence = typeof left.item.sequence === 'number' ? left.item.sequence : left.index
      const rightSequence = typeof right.item.sequence === 'number' ? right.item.sequence : right.index
      return rightSequence - leftSequence
    })
    .map(({ item }) => item)
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
    chatUrls: [...session.chatUrls],
    ...(session.agentLabel ? { agentLabel: session.agentLabel } : {}),
    ...(session.runtimeLabel ? { runtimeLabel: session.runtimeLabel } : {}),
  }
}

export type WorkHistoryActivityFilter = 'all' | 'chatgpt' | 'subagent'

export function filterWorkHistoryTimeline<T extends { actor: string; timestamp: string; sequence?: number }>(timeline: readonly T[], filter: WorkHistoryActivityFilter): T[] {
  const filtered = filter === 'all' ? timeline : timeline.filter((item) => item.actor === filter)
  return sortWorkHistoryTimelineNewestFirst(filtered)
}
