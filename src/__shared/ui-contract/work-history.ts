export interface WorkHistoryConversationIntent {
  message: string
  task: string
}

export interface WorkHistoryBoundConversationIntent {
  intent: WorkHistoryConversationIntent
  boundAt: string
}

export interface WorkHistoryWorkspaceReference {
  id: string
  title?: string
  path?: string
}

export type WorkHistoryPresentationLabel =
  | 'activity'
  | 'action.read'
  | 'action.search'
  | 'action.inspect'
  | 'action.diagnostic'
  | 'action.edit'
  | 'action.verify'
  | 'action.command'
  | 'delegation.created'
  | 'delegation.attached'
  | 'delegation.prompted'
  | 'delegation.resumed'
  | 'delegation.status'

export type WorkHistoryPresentationTitle =
  | { kind: 'text'; text: string }
  | { kind: 'label'; label: WorkHistoryPresentationLabel }

export type WorkHistoryPresentationDetail =
  | { kind: 'text'; text: string }
  | { kind: 'tool'; text: string }
  | { kind: 'workspace'; text: string }
  | { kind: 'status'; text: string }
  | { kind: 'duration'; durationMs: number }
  | { kind: 'subagent-session'; id: string }
  | { kind: 'error'; text: string }

export type WorkHistoryPresentationSection =
  | { kind: 'task'; text: string }
  | { kind: 'follow-up-prompts'; items: string[] }

export interface WorkHistorySessionPresentation {
  title: string
  workspaceLabel?: string
}

export interface WorkHistoryTimelinePresentation {
  title: WorkHistoryPresentationTitle
  primary?: string
  details: WorkHistoryPresentationDetail[]
  expanded?: WorkHistoryPresentationSection[]
}

export interface WorkHistorySession {
  id: string
  memberSessionIds?: string[]
  originIntent?: WorkHistoryConversationIntent
  boundIntents: WorkHistoryBoundConversationIntent[]
  chatUrls: string[]
  activeWorkspaceId?: string
  workspace?: WorkHistoryWorkspaceReference
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  eventCount: number
  chatCount: number
  delegationCount: number
  agentLabel?: string
  runtimeLabel?: string
  presentation: WorkHistorySessionPresentation
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized || undefined
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function conversationIntent(value: unknown): WorkHistoryConversationIntent | undefined {
  const raw = record(value)
  const message = text(raw.message)
  const task = text(raw.task)
  return message && task ? { message, task } : undefined
}

function workspaceReference(value: unknown): WorkHistoryWorkspaceReference | undefined {
  const raw = record(value)
  const id = text(raw.id)
  if (!id) return undefined
  const title = text(raw.title)
  const path = text(raw.path)
  return { id, ...(title ? { title } : {}), ...(path ? { path } : {}) }
}

function addUniqueText(target: string[], value: unknown): void {
  const normalized = text(value)
  if (normalized && !target.includes(normalized)) target.push(normalized)
}

/**
 * Canonicalize a Core Work History summary at the UI boundary. This is the one
 * compatibility path for current originIntent/boundIntents/chatUrls and the
 * older originChat/boundChats shape.
 */
export function normalizeWorkHistorySession(value: unknown): WorkHistorySession | undefined {
  const raw = record(value)
  const id = text(raw.id) ?? text(raw.session_id)
  if (!id) return undefined

  const legacyOrigin = record(raw.originChat)
  const legacyBound = Array.isArray(raw.boundChats) ? raw.boundChats : []
  const canonicalBound = Array.isArray(raw.boundIntents) ? raw.boundIntents : undefined
  const originIntent = conversationIntent(raw.originIntent) ?? conversationIntent(legacyOrigin)
  const boundIntents = (canonicalBound ?? legacyBound).flatMap((value) => {
    const entry = record(value)
    const intent = canonicalBound ? conversationIntent(entry.intent) : conversationIntent(entry)
    const boundAt = text(entry.boundAt)
    return intent && boundAt ? [{ intent, boundAt }] : []
  })

  const memberSessionIds: string[] = []
  if (Array.isArray(raw.memberSessionIds)) raw.memberSessionIds.forEach((id) => addUniqueText(memberSessionIds, id))

  const chatUrls: string[] = []
  if (Array.isArray(raw.chatUrls)) raw.chatUrls.forEach((url) => addUniqueText(chatUrls, url))
  addUniqueText(chatUrls, legacyOrigin.url)
  legacyBound.forEach((entry) => addUniqueText(chatUrls, record(entry).url))

  const workspace = workspaceReference(raw.workspace)
  const activeWorkspaceId = text(raw.activeWorkspaceId) ?? workspace?.id
  const createdAt = text(raw.createdAt) ?? ''
  const updatedAt = text(raw.updatedAt) ?? createdAt
  const lastActivityAt = text(raw.lastActivityAt) ?? updatedAt
  const agentLabel = text(raw.agentLabel)
  const runtimeLabel = text(raw.runtimeLabel)
  const presentationRaw = record(raw.presentation)
  const presentationTitle = text(presentationRaw.title) ?? id
  const workspaceLabel = text(presentationRaw.workspaceLabel)
  const presentation: WorkHistorySessionPresentation = {
    title: presentationTitle,
    ...(workspaceLabel ? { workspaceLabel } : {}),
  }
  const {
    originChat: _originChat,
    boundChats: _boundChats,
    originIntent: _originIntent,
    boundIntents: _boundIntents,
    memberSessionIds: _memberSessionIds,
    chatUrls: _chatUrls,
    workspace: _workspace,
    ...rest
  } = raw

  return {
    ...rest,
    id,
    ...(originIntent ? { originIntent } : {}),
    boundIntents,
    ...(memberSessionIds.length ? { memberSessionIds } : {}),
    chatUrls,
    ...(activeWorkspaceId ? { activeWorkspaceId } : {}),
    ...(workspace ? { workspace } : {}),
    createdAt,
    updatedAt,
    lastActivityAt,
    eventCount: count(raw.eventCount),
    chatCount: count(raw.chatCount),
    delegationCount: count(raw.delegationCount),
    ...(agentLabel ? { agentLabel } : {}),
    ...(runtimeLabel ? { runtimeLabel } : {}),
    presentation,
  } as WorkHistorySession
}

export function normalizeWorkHistorySessions(value: unknown): WorkHistorySession[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeWorkHistorySession).filter((session): session is WorkHistorySession => Boolean(session))
}

function presentationLabel(value: unknown): WorkHistoryPresentationLabel | undefined {
  const candidate = text(value)
  return candidate && [
    'activity', 'action.read', 'action.search', 'action.inspect', 'action.diagnostic', 'action.edit', 'action.verify', 'action.command',
    'delegation.created', 'delegation.attached', 'delegation.prompted', 'delegation.resumed', 'delegation.status',
  ].includes(candidate) ? candidate as WorkHistoryPresentationLabel : undefined
}

function normalizePresentationTitle(value: unknown): WorkHistoryPresentationTitle | undefined {
  const raw = record(value)
  if (raw.kind === 'text') {
    const valueText = text(raw.text)
    return valueText ? { kind: 'text', text: valueText } : undefined
  }
  if (raw.kind === 'label') {
    const label = presentationLabel(raw.label)
    return label ? { kind: 'label', label } : undefined
  }
  return undefined
}

function normalizePresentationDetail(value: unknown): WorkHistoryPresentationDetail | undefined {
  const raw = record(value)
  if (raw.kind === 'duration') return typeof raw.durationMs === 'number' && Number.isFinite(raw.durationMs) ? { kind: 'duration', durationMs: raw.durationMs } : undefined
  if (raw.kind === 'subagent-session') {
    const id = text(raw.id)
    return id ? { kind: 'subagent-session', id } : undefined
  }
  if (raw.kind === 'text' || raw.kind === 'tool' || raw.kind === 'workspace' || raw.kind === 'status' || raw.kind === 'error') {
    const detailText = text(raw.text)
    return detailText ? { kind: raw.kind, text: detailText } as WorkHistoryPresentationDetail : undefined
  }
  return undefined
}

function normalizePresentationSection(value: unknown): WorkHistoryPresentationSection | undefined {
  const raw = record(value)
  if (raw.kind === 'task') {
    const sectionText = text(raw.text)
    return sectionText ? { kind: 'task', text: sectionText } : undefined
  }
  if (raw.kind === 'follow-up-prompts' && Array.isArray(raw.items)) {
    const items = raw.items.map(text).filter((item): item is string => Boolean(item))
    return items.length ? { kind: 'follow-up-prompts', items } : undefined
  }
  return undefined
}

/** Compatibility normalizer. Current Core should always provide presentation. */
export function normalizeWorkHistoryTimelinePresentation(value: unknown): WorkHistoryTimelinePresentation {
  const raw = record(value)
  const presentationRaw = record(raw.presentation)
  const title = normalizePresentationTitle(presentationRaw.title)
  const primary = text(presentationRaw.primary)
  const details = Array.isArray(presentationRaw.details)
    ? presentationRaw.details.map(normalizePresentationDetail).filter((detail): detail is WorkHistoryPresentationDetail => Boolean(detail))
    : []
  const expanded = Array.isArray(presentationRaw.expanded)
    ? presentationRaw.expanded.map(normalizePresentationSection).filter((section): section is WorkHistoryPresentationSection => Boolean(section))
    : []
  if (title) return { title, ...(primary ? { primary } : {}), details, ...(expanded.length ? { expanded } : {}) }

  return { title: { kind: 'label', label: 'activity' }, details: [] }
}

/** Compatibility accessor retained for older consumers. New UI should consume Core presentation. */
export function workHistoryTimelinePurpose(value: unknown): string | undefined {
  const raw = record(value)
  const args = record(raw.arguments)
  return text(args.purpose)
}

export function isWorkHistoryConversationBound(chatUrls: readonly string[], conversationUrl: string | null | undefined): boolean {
  return Boolean(conversationUrl && chatUrls.includes(conversationUrl))
}
