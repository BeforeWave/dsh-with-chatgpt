import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatSessionTimelineItem } from '@beforewave/agent-helm'
import { IntentRow, WorkHistoryActivityTimeline, WorkHistoryIntentDetail, WorkHistoryIntentList, WorkHistoryRow, installWorkHistoryUiStyles, workHistoryIntentTitle, type WorkHistoryActivityRowData } from '../../__shared/work-history-ui/index.js'
import { createWorkHistoryIntentActivityScopes, filterWorkHistoryTimelineByIntentScope, mergeWorkHistorySessionPage } from '../../__shared/work-history-ui/model.js'
import { normalizeWorkHistorySessions, normalizeWorkHistoryTimelinePresentation, type WorkHistoryPresentationLabel, type WorkHistorySession } from '../../ui-contract.js'
import { createWorkHistorySessionDetailModel, createWorkHistorySessionListModel, loadWorkHistoryConversationTimeline, mergeWorkHistoryConversationTimelineUpdates } from '../work-history.js'
import type { HelmSessionAdapter } from '../adapter.js'

const CSS_ID = '@beforewave/dsh-with-chatgpt/session-activity'
const DETAIL_CACHE_LIMIT = 5

type SessionDetailCacheEntry = {
  timeline: ChatSessionTimelineItem[]
  memberSessionIds: string[]
  grouped: boolean
  cursors: Record<string, number>
}

export interface SessionActivityLabels {
  panelTitle: string
  close: string
  sessionList: string
  sessionCount: string
  allWorkspaces: string
  all: string
  chatgpt: string
  subagent: string
  workspace: string
  created: string
  updated: string
  chatSessions: string
  workContext: string
  unboundContext: string
  openChat: string
  sessionId: string
  copyId: string
  copied: string
  refresh: string
  loadMore: string
  actionGeneric: string
  actionRead: string
  actionSearch: string
  actionInspect: string
  actionDiagnostic: string
  actionEdit: string
  actionVerify: string
  actionCommand: string
  statusSuccess: string
  statusError: string
  delegationCreated: string
  delegationAttached: string
  delegationPrompted: string
  delegationResumed: string
  delegationStatus: string
  statusIdle: string
  statusRunning: string
  statusWaiting: string
  statusFailed: string
  statusCancelled: string
  statusUnknown: string
  subagentSessionId: string
  noSessions: string
  noTimeline: string
  loading: string
  loadError: string
  unassignedWorkspace: string
  linked: string
  unlinked: string
  expand: string
  collapse: string
  intents: string
  conversation: string
}

const css = `
.dshHelmSessionScrim{position:fixed;inset:0;z-index:45;background:rgba(15,18,22,.32);display:flex;align-items:center;justify-content:center;padding:28px}
.dshHelmSessionPanel{--helm-border:var(--dsw-alias-border-l2);--helm-hover:var(--dsw-alias-interactive-bg-hover);--helm-secondary:var(--dsw-alias-label-secondary);--helm-business:var(--dsw-alias-state-business-primary);--helm-surface:var(--dsw-specific-menu);--helm-primary:var(--dsw-alias-label-primary);--helm-badge-bg:var(--dsw-alias-interactive-bg-hover);width:min(1180px,calc(100vw - 56px));height:min(780px,calc(100vh - 56px));border:1px solid var(--dsw-alias-border-inverted);border-radius:16px;background:var(--dsw-specific-menu);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;overflow:hidden}
.dshHelmSessionHeader{height:64px;flex:none;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;gap:12px}.dshHelmSessionHeaderTitle{font-size:17px;font-weight:650;flex:1}.dshHelmSessionClose{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:20px;cursor:pointer}.dshHelmSessionClose:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmHistoryBody{min-height:0;flex:1;display:flex}.dshHelmSessionNav{width:292px;flex:none;border-right:1px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;min-height:0}.dshHelmSessionNavHead{height:48px;flex:none;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:12px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionWorkspaceFilter{flex:none;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l2);display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionWorkspaceFilter select{min-width:0;height:30px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:0 8px;font:inherit}.dshHelmSessionList{min-height:0;overflow:auto;padding:0}.dshHelmSessionLoadMore{width:calc(100% - 16px);margin:8px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);padding:7px 8px;font:12px/18px inherit;cursor:pointer}.dshHelmSessionLoadMore:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dshHelmSessionLoadMore:disabled{opacity:.55;cursor:default}
.dshHelmSessionDetail{min-width:0;flex:1;display:flex;flex-direction:column}.dshHelmSessionSummary{box-sizing:border-box;flex:none;padding:14px 20px 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshHelmSessionSummaryTop{display:flex;align-items:flex-start;gap:16px}.dshHelmSessionSummaryMain{min-width:0;flex:1}.dshHelmSessionWorkspaceTitle{min-width:0;overflow-wrap:anywhere;font-size:18px;line-height:25px;font-weight:650}.dshHelmSessionIdWrap{min-width:0;max-width:310px;display:flex;align-items:center;gap:6px;font:11px/18px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary)}.dshHelmSessionIdText{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshHelmSessionCopy{flex:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;padding:2px 4px;border-radius:5px;cursor:pointer}.dshHelmSessionCopy:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshHelmSessionFacts{margin-top:12px;display:grid;grid-template-columns:minmax(68px,90px) minmax(0,1fr);grid-auto-rows:minmax(22px,auto);align-items:center;column-gap:10px;row-gap:4px;font-size:12px;line-height:18px}.dshHelmSessionFactLabel{color:var(--dsw-alias-label-secondary)}.dshHelmSessionFacts time{color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dshHelmSessionContext{flex:none;padding:0;background:var(--dsw-specific-menu)}.dshHelmSessionContext[data-expanded=false]{border-bottom:1px solid var(--dsw-alias-border-l2)}.dshHelmIntentToolbar{height:44px;flex:none;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshHelmIntentBack{border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);padding:5px 7px;font:12px/18px inherit;cursor:pointer}.dshHelmIntentBack:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshHelmSessionContextTitleRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 20px}.dshHelmSessionContextToggle{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:5px;background:transparent;color:inherit;padding:2px 4px;font:inherit;cursor:pointer}.dshHelmSessionContextToggle:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshHelmSessionContextChevron{font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionContextTitle{font-size:12px;font-weight:650}.dshHelmSessionContextChats{min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}.dshHelmSessionContextChatsLabel{font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmContextChat{max-width:220px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);padding:3px 7px;font:11px/17px inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.dshHelmContextChat:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmSessionDetail>.timeline-section{min-height:0;flex:1;display:flex;flex-direction:column}.dshHelmSessionDetail>.timeline-section .timeline{min-height:0;flex:1;overflow:auto}.dshHelmTimelineEmpty{padding:56px 20px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px}.dshHelmSessionError{margin:12px 20px 0;padding:8px 10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;color:var(--dsw-alias-state-error-primary);font-size:12px}
@media(max-width:820px){.dshHelmSessionPanel{width:calc(100vw - 28px);height:calc(100vh - 28px)}.dshHelmSessionNav{width:224px}.dshHelmSessionFacts{grid-template-columns:72px minmax(0,1fr)}.dshHelmSessionContextTitleRow{align-items:flex-start;flex-direction:column}.dshHelmSessionContextChats{justify-content:flex-start}}
`

export function installSessionActivityStyles(): () => void {
  const removeSharedStyles = installWorkHistoryUiStyles()
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${CSS_ID}"]`)
  if (existing) return removeSharedStyles
  const tag = document.createElement('style')
  tag.dataset.pluginCss = CSS_ID
  tag.textContent = css
  document.head.appendChild(tag)
  return () => { tag.remove(); removeSharedStyles() }
}

function timeLabel(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}


function sessionContextFallback(labels: SessionActivityLabels): string {
  return labels.unboundContext
}


function presentationLabel(label: WorkHistoryPresentationLabel, labels: SessionActivityLabels): string {
  if (label === 'activity') return labels.actionGeneric
  if (label === 'delegation.created') return labels.delegationCreated
  if (label === 'delegation.attached') return labels.delegationAttached
  if (label === 'delegation.prompted') return labels.delegationPrompted
  if (label === 'delegation.resumed') return labels.delegationResumed
  if (label === 'delegation.status') return labels.delegationStatus
  if (label === 'action.read') return labels.actionRead
  if (label === 'action.search') return labels.actionSearch
  if (label === 'action.inspect') return labels.actionInspect
  if (label === 'action.diagnostic') return labels.actionDiagnostic
  if (label === 'action.verify') return labels.actionVerify
  if (label === 'action.command') return labels.actionCommand
  return labels.actionEdit
}

function statusLabel(status: string, labels: SessionActivityLabels): string {
  if (status === 'success') return labels.statusSuccess
  if (status === 'error') return labels.statusError
  if (status === 'idle') return labels.statusIdle
  if (status === 'running') return labels.statusRunning
  if (status === 'waiting') return labels.statusWaiting
  if (status === 'failed') return labels.statusFailed
  if (status === 'cancelled') return labels.statusCancelled
  return labels.statusUnknown
}

function rememberSessionDetail(cache: Map<string, SessionDetailCacheEntry>, sessionId: string, entry: SessionDetailCacheEntry): void {
  cache.delete(sessionId)
  cache.set(sessionId, entry)
  while (cache.size > DETAIL_CACHE_LIMIT) {
    const oldest = cache.keys().next().value as string | undefined
    if (!oldest) break
    cache.delete(oldest)
  }
}

export function SessionActivityPanel({ labels, onClose, adapter }: { labels: SessionActivityLabels; onClose: () => void; adapter: HelmSessionAdapter }): JSX.Element {
  const [sessions, setSessions] = useState<WorkHistorySession[]>([])
  const [workspaceFilter, setWorkspaceFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string>()
  const [timeline, setTimeline] = useState<ChatSessionTimelineItem[]>([])
  const [contextExpanded, setContextExpanded] = useState(false)
  const [selectedIntentRef, setSelectedIntentRef] = useState<{ sessionId: string; scopeId: string }>()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string>()
  const [loadingPage, setLoadingPage] = useState(false)
  const [error, setError] = useState<string>()
  const detailCache = useRef(new Map<string, SessionDetailCacheEntry>())
  const detailGeneration = useRef(0)
  const refreshGeneration = useRef(0)
  const sessionList = useMemo(() => createWorkHistorySessionListModel({
    sessions,
    workspaceId: workspaceFilter,
    ...(selectedId ? { selectedId: selectedId } : {}),
  }), [sessions, workspaceFilter, selectedId])
  const workspaceOptions = sessionList.workspace.options
  const selected = sessionList.selected
  const selectedMemberIds = selected ? (selected.memberSessionIds?.length ? selected.memberSessionIds : [selected.id]) : []
  const selectedMembersKey = selectedMemberIds.join('\u0000')
  const selectedDetail = useMemo(() => selected ? createWorkHistorySessionDetailModel(selected) : undefined, [selected])
  const intentHistory = selectedDetail?.intentHistory ?? []
  const intentScopes = useMemo(() => selectedDetail ? createWorkHistoryIntentActivityScopes([selectedDetail]) : [], [selectedDetail])
  const selectedIntentScopeId = selectedIntentRef && selectedIntentRef.sessionId === selectedId ? selectedIntentRef.scopeId : undefined
  const selectedIntent = selectedIntentScopeId ? intentScopes.find((scope) => scope.id === selectedIntentScopeId) : undefined
  const chatUrls = selectedDetail?.chatUrls ?? []
  const visibleTimeline = useMemo(() => selectedIntent ? filterWorkHistoryTimelineByIntentScope(timeline, selectedIntent) : timeline, [selectedIntent, timeline])
  useEffect(() => { setContextExpanded(false); setSelectedIntentRef(undefined) }, [selectedId])

  const activityItems = useMemo<WorkHistoryActivityRowData[]>(() => visibleTimeline.map((item) => ({
    id: `${item.sequence}:${item.id}`,
    timestamp: item.timestamp,
    sequence: item.sequence,
    actor: item.actor,
    actorLabel: item.actor === 'chatgpt' ? labels.chatgpt : item.actorName ?? labels.subagent,
    presentation: normalizeWorkHistoryTimelinePresentation(item),
  })), [labels.chatgpt, labels.subagent, visibleTimeline])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await adapter.listSessionPage()
        if (cancelled) return
        const normalized = normalizeWorkHistorySessions(page.sessions)
        setSessions(normalized)
        setNextCursor(page.nextCursor)
        setSelectedId((current) => current && normalized.some((item) => item.id === current) ? current : normalized[0]?.id)
        setError(undefined)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [adapter])

  useEffect(() => {
    let cancelled = false
    let refreshing = false
    let pending = false
    const refreshFirstPage = (): void => {
      if (refreshing) { pending = true; return }
      refreshing = true
      void adapter.listSessionPage().then((page) => {
        if (cancelled) return
        const normalized = normalizeWorkHistorySessions(page.sessions)
        setSessions((current) => {
          const merged = page.nextCursor ? mergeWorkHistorySessionPage(current, normalized) : normalized
          setNextCursor(page.nextCursor ? String(merged.length) : undefined)
          return merged
        })
        setError(undefined)
      }).catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }).finally(() => {
        refreshing = false
        if (!cancelled && pending) { pending = false; refreshFirstPage() }
      })
    }
    const unsubscribe = adapter.subscribeWorkHistoryChanges(refreshFirstPage, (cause) => {
      if (!cancelled) setError(cause.message)
    })
    return () => { cancelled = true; unsubscribe() }
  }, [adapter])

  useEffect(() => {
    if (selectedId === sessionList.selectedId) return
    setSelectedId(sessionList.selectedId)
  }, [sessionList.selectedId, selectedId])

  useEffect(() => {
    const generation = ++detailGeneration.current
    refreshGeneration.current += 1
    let cancelled = false
    const unsubscribes: Array<() => void> = []
    setContextExpanded(true)
    setSelectedIntentRef(undefined)
    setCopied(false)
    setRefreshing(false)
    if (!selectedId || !selected) {
      setTimeline([])
      setLoading(false)
      return () => { cancelled = true }
    }

    const startLive = (entry: SessionDetailCacheEntry) => {
      if (cancelled || generation !== detailGeneration.current) return
      try {
        for (const memberSessionId of entry.memberSessionIds) {
          const afterSequence = entry.cursors[memberSessionId] ?? 0
          unsubscribes.push(adapter.subscribeSessionTimeline(memberSessionId, afterSequence, (updates) => {
            if (cancelled || generation !== detailGeneration.current) return
            setTimeline((current) => {
              const next = mergeWorkHistoryConversationTimelineUpdates(current, entry.grouped, memberSessionId, updates)
              const cachedEntry = detailCache.current.get(selectedId)
              const nextCursor = updates.reduce((cursor, item) => Math.max(cursor, item.sequence ?? 0), cachedEntry?.cursors[memberSessionId] ?? afterSequence)
              rememberSessionDetail(detailCache.current, selectedId, {
                timeline: next,
                memberSessionIds: entry.memberSessionIds,
                grouped: entry.grouped,
                cursors: { ...(cachedEntry?.cursors ?? entry.cursors), [memberSessionId]: nextCursor },
              })
              return next
            })
          }, (cause) => {
            if (!cancelled && generation === detailGeneration.current) setError(cause.message)
          }))
        }
      } catch (cause) {
        if (!cancelled && generation === detailGeneration.current) setError(cause instanceof Error ? cause.message : String(cause))
      }
    }

    const cached = detailCache.current.get(selectedId)
    if (cached && cached.memberSessionIds.join('\u0000') === selectedMembersKey) {
      rememberSessionDetail(detailCache.current, selectedId, cached)
      setTimeline(cached.timeline)
      setLoading(false)
      setError(undefined)
      startLive(cached)
      return () => {
        cancelled = true
        for (const unsubscribe of unsubscribes) unsubscribe()
      }
    }

    if (cached) detailCache.current.delete(selectedId)
    setTimeline([])
    setLoading(true)
    void loadWorkHistoryConversationTimeline(selected, (memberSessionId) => adapter.getSessionTimeline(memberSessionId)).then((entry) => {
      if (cancelled) return
      rememberSessionDetail(detailCache.current, selectedId, entry)
      if (generation !== detailGeneration.current) return
      setTimeline(entry.timeline)
      setError(undefined)
      startLive(entry)
    }).catch((cause) => {
      if (!cancelled && generation === detailGeneration.current) setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => {
      if (!cancelled && generation === detailGeneration.current) setLoading(false)
    })
    return () => {
      cancelled = true
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [adapter, selectedId, selectedMembersKey])

  const copySessionId = () => {
    if (!selected) return
    void navigator.clipboard?.writeText(selected.id)
    setCopied(true)
  }

  const refreshSelected = () => {
    if (!selectedId || refreshing) return
    const refreshSessionId = selectedId
    const generation = ++refreshGeneration.current
    setRefreshing(true)
    void (async () => {
      let cursor: string | undefined
      do {
        const page = await adapter.listSessionPage(cursor)
        const normalized = normalizeWorkHistorySessions(page.sessions)
        const match = normalized.find((session) => session.id === refreshSessionId)
        if (match) return match
        cursor = page.nextCursor
      } while (cursor)
      throw new Error(`Work History session not found: ${refreshSessionId}`)
    })().then((normalized) => {
      if (generation !== refreshGeneration.current) return
      setSessions((current) => current.map((session) => session.id === refreshSessionId ? normalized : session))
      setError(undefined)
    }).catch((cause) => {
      if (generation === refreshGeneration.current) setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => {
      if (generation === refreshGeneration.current) setRefreshing(false)
    })
  }

  const loadNextPage = () => {
    if (!nextCursor || loadingPage) return
    setLoadingPage(true)
    void adapter.listSessionPage(nextCursor).then((page) => {
      const normalized = normalizeWorkHistorySessions(page.sessions)
      setSessions((current) => {
        const byId = new Map(current.map((session) => [session.id, session]))
        for (const session of normalized) byId.set(session.id, session)
        return [...byId.values()]
      })
      setNextCursor(page.nextCursor)
      setError(undefined)
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => setLoadingPage(false))
  }

  return (
    <div className="dshHelmSessionScrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dshHelmSessionPanel" role="dialog" aria-modal="true" aria-label={labels.panelTitle}>
        <header className="dshHelmSessionHeader">
          <div className="dshHelmSessionHeaderTitle">{labels.panelTitle}</div>
          <button type="button" className="dshHelmSessionClose" aria-label={labels.close} onClick={onClose}>×</button>
        </header>
        <div className="dshHelmHistoryBody">
          <aside className="dshHelmSessionNav">
            <div className="dshHelmSessionNavHead"><span>{labels.sessionList}</span><span>{sessionList.items.length} {labels.sessionCount}</span></div>
            <label className="dshHelmSessionWorkspaceFilter">
              <span>{labels.workspace}</span>
              <select value={workspaceFilter} onChange={(event) => setWorkspaceFilter(event.target.value)}>
                <option value="all">{labels.allWorkspaces}</option>
                {workspaceOptions.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.label}</option>)}
              </select>
            </label>
            <div className="dshHelmSessionList">
              {sessionList.items.map((item) => (
                <WorkHistoryRow
                  key={item.id}
                  item={{ id: item.id, title: item.title, timestamp: item.lastActivityAt, linked: item.session.chatUrls.length > 0 }}
                  current={item.id === selectedId}
                  linkedLabel={labels.linked}
                  unlinkedLabel={labels.unlinked}
                  formatTimestamp={timeLabel}
                  onSelect={setSelectedId}
                />
              ))}
              {nextCursor ? <button type="button" className="dshHelmSessionLoadMore" disabled={loadingPage} onClick={loadNextPage}>{labels.loadMore}</button> : null}
              {!sessionList.items.length && !loading ? <div className="dshHelmTimelineEmpty">{labels.noSessions}</div> : null}
            </div>
          </aside>
          <main className="dshHelmSessionDetail">
            {selected ? (selectedIntent ? (
              <>
                <div className="dshHelmIntentToolbar">
                  <button type="button" className="dshHelmIntentBack" onClick={() => setSelectedIntentRef(undefined)}>← {labels.conversation}</button>
                </div>
                <WorkHistoryIntentDetail intent={selectedIntent.intent} timestamp={selectedIntent.startedAt} formatTimestamp={timeLabel} />
                {error ? <div className="dshHelmSessionError">{labels.loadError}: {error}</div> : null}
                <WorkHistoryActivityTimeline
                  items={activityItems}
                  labels={{
                    all: labels.all,
                    chatgpt: labels.chatgpt,
                    subagent: labels.subagent,
                    expand: labels.expand,
                    collapse: labels.collapse,
                    empty: loading ? labels.loading : labels.noTimeline,
                    filterAriaLabel: workHistoryIntentTitle(selectedIntent.intent),
                    subagentSessionId: labels.subagentSessionId,
                    presentationLabel: (label) => presentationLabel(label, labels),
                    statusLabel: (status) => statusLabel(status, labels),
                  }}
                  formatTimestamp={timeLabel}
                />
              </>
            ) : (
              <>
                <section className="dshHelmSessionSummary">
                  <div className="dshHelmSessionSummaryTop">
                    <div className="dshHelmSessionSummaryMain">
                      <div className="dshHelmSessionWorkspaceTitle">{selectedDetail?.title}</div>
                    </div>
                    <div className="dshHelmSessionIdWrap"><button type="button" className="dshHelmSessionCopy" onClick={refreshSelected} disabled={refreshing}>↻ {labels.refresh}</button><span className="dshHelmSessionIdText">{labels.sessionId} {selected.id}</span><button type="button" className="dshHelmSessionCopy" onClick={copySessionId}>{copied ? labels.copied : labels.copyId}</button></div>
                  </div>
                  <div className="dshHelmSessionFacts">
                    <div className="dshHelmSessionFactLabel">{labels.created}</div><div><time>{timeLabel(selected.createdAt)}</time></div>
                    <div className="dshHelmSessionFactLabel">{labels.updated}</div><div><time>{timeLabel(selected.lastActivityAt)}</time></div>
                    <div className="dshHelmSessionFactLabel">{labels.workspace}</div><div>{selectedDetail?.workspaceLabel ?? labels.unassignedWorkspace}</div>
                  </div>
                </section>
                <section className="dshHelmSessionContext" data-expanded={contextExpanded} aria-label={labels.workContext}>
                  <div className="dshHelmSessionContextTitleRow">
                    <button type="button" className="dshHelmSessionContextToggle" aria-expanded={contextExpanded} onClick={() => setContextExpanded((value) => !value)}>
                      <span className="dshHelmSessionContextTitle">{labels.intents} · {intentScopes.length || intentHistory.length}</span>
                      <span className="dshHelmSessionContextChevron" aria-hidden="true">{contextExpanded ? labels.collapse : labels.expand}</span>
                    </button>
                    {contextExpanded && chatUrls.length ? <div className="dshHelmSessionContextChats">
                      <span className="dshHelmSessionContextChatsLabel">{labels.chatSessions}</span>
                      {chatUrls.map((url, index) => <button type="button" key={url} className="dshHelmContextChat" title={url} onClick={() => adapter.openUrl(url)}>{labels.openChat}{chatUrls.length > 1 ? ` ${index + 1}` : ''} ↗</button>)}
                    </div> : null}
                  </div>
                  {contextExpanded ? <WorkHistoryIntentList>
                    {!intentHistory.length ? <IntentRow intent={{ task: selectedDetail?.title ?? '', message: sessionContextFallback(labels) }} /> : null}
                    {intentScopes.length ? intentScopes.map((scope) => <IntentRow
                      key={scope.id}
                      intent={scope.intent}
                      onOpen={() => setSelectedIntentRef({ sessionId: selected.id, scopeId: scope.id })}
                    />) : intentHistory.map((entry, index) => <IntentRow
                      key={`${entry.kind}:${entry.effectiveAt}:${index}`}
                      intent={entry.intent}
                    />)}
                  </WorkHistoryIntentList> : null}
                </section>
                {error ? <div className="dshHelmSessionError">{labels.loadError}: {error}</div> : null}
                <WorkHistoryActivityTimeline
                  items={activityItems}
                  labels={{
                    all: labels.all,
                    chatgpt: labels.chatgpt,
                    subagent: labels.subagent,
                    expand: labels.expand,
                    collapse: labels.collapse,
                    empty: loading ? labels.loading : labels.noTimeline,
                    filterAriaLabel: labels.panelTitle,
                    subagentSessionId: labels.subagentSessionId,
                    presentationLabel: (label) => presentationLabel(label, labels),
                    statusLabel: (status) => statusLabel(status, labels),
                  }}
                  formatTimestamp={timeLabel}
                />
              </>
            )) : <div className="dshHelmTimelineEmpty">{loading ? labels.loading : labels.noSessions}</div>}
          </main>
        </div>
      </section>
    </div>
  )
}
