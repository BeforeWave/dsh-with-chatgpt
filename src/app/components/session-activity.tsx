import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatSessionTimelineItem, DelegatedSession } from '@beforewave/agent-helm'
import { normalizeWorkHistorySessions, workHistoryTimelinePurpose, type WorkHistorySession } from '@beforewave/agent-helm-ui-contract'
import { createWorkHistorySessionDetailModel, createWorkHistorySessionListModel, filterWorkHistoryTimeline, workHistoryTimelineExecutionDetail } from '../work-history.js'
import type { HelmSessionAdapter } from '../adapter.js'

const CSS_ID = '@beforewave/dsh-with-chatgpt/session-activity'
const DETAIL_CACHE_LIMIT = 5

type SessionDetailCacheEntry = {
  timeline: ChatSessionTimelineItem[]
  delegations: DelegatedSession[]
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
  recentActivity: string
  activities: string
  chats: string
  workspace: string
  created: string
  updated: string
  chatSessions: string
  viewChats: string
  originChat: string
  boundChats: string
  workContext: string
  task: string
  boundAt: string
  unboundContext: string
  openChat: string
  sessionId: string
  copyId: string
  copied: string
  refresh: string
  loadMore: string
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
  fullTask: string
  followUpPrompts: string
  subagentSessionId: string
  noSessions: string
  noTimeline: string
  loading: string
  loadError: string
  unassignedWorkspace: string
}

const css = `
.dshHelmSessionScrim{position:fixed;inset:0;z-index:45;background:rgba(15,18,22,.32);display:flex;align-items:center;justify-content:center;padding:28px}
.dshHelmSessionPanel{width:min(1180px,calc(100vw - 56px));height:min(780px,calc(100vh - 56px));border:1px solid var(--dsw-alias-border-inverted);border-radius:16px;background:var(--dsw-specific-menu);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;overflow:hidden}
.dshHelmSessionHeader{height:64px;flex:none;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;gap:12px}.dshHelmSessionHeaderTitle{font-size:17px;font-weight:650;flex:1}.dshHelmSessionClose{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:20px;cursor:pointer}.dshHelmSessionClose:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmHistoryBody{min-height:0;flex:1;display:flex}.dshHelmSessionNav{width:292px;flex:none;border-right:1px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;min-height:0}.dshHelmSessionNavHead{height:48px;flex:none;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:12px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionWorkspaceFilter{flex:none;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l2);display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionWorkspaceFilter select{min-width:0;height:30px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:0 8px;font:inherit}.dshHelmSessionList{min-height:0;overflow:auto;padding:8px}.dshHelmSessionCard{width:100%;border:1px solid transparent;border-radius:10px;background:transparent;text-align:left;color:inherit;padding:11px 12px;cursor:pointer}.dshHelmSessionCard:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshHelmSessionCard[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}.dshHelmSessionCardTitle{font-size:13px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshHelmSessionCardTime{margin-top:4px;font-size:12px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionCardMeta{margin-top:6px;display:flex;gap:9px;font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmSessionLoadMore{width:calc(100% - 8px);margin:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);padding:7px 8px;font:12px/18px inherit;cursor:pointer}.dshHelmSessionLoadMore:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dshHelmSessionLoadMore:disabled{opacity:.55;cursor:default}
.dshHelmSessionDetail{min-width:0;flex:1;display:flex;flex-direction:column}.dshHelmSessionSummary{box-sizing:border-box;flex:none;padding:14px 20px 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshHelmSessionSummaryTop{display:flex;align-items:flex-start;gap:16px}.dshHelmSessionSummaryMain{min-width:0;flex:1}.dshHelmSessionWorkspaceTitle{font-size:18px;line-height:25px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshHelmSessionTimes{margin-top:3px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;display:flex;gap:12px;white-space:nowrap;overflow:hidden}.dshHelmSessionIdWrap{min-width:0;max-width:310px;display:flex;align-items:center;gap:6px;font:11px/18px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary)}.dshHelmSessionIdText{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshHelmSessionCopy{flex:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;padding:2px 4px;border-radius:5px;cursor:pointer}.dshHelmSessionCopy:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshHelmSessionFacts{margin-top:8px;display:grid;grid-template-columns:90px minmax(0,1fr);grid-auto-rows:22px;align-items:center;column-gap:10px;font-size:12px}.dshHelmSessionFactLabel{color:var(--dsw-alias-label-secondary)}
.dshHelmSessionContext{flex:none;max-height:300px;overflow:auto;padding:12px 20px 14px;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-menu)}.dshHelmSessionContextTitleRow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.dshHelmSessionContextTitle{font-size:12px;font-weight:650}.dshHelmSessionContextChats{min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}.dshHelmSessionContextChatsLabel{font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmContextChat{max-width:220px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);padding:3px 7px;font:11px/17px inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.dshHelmContextChat:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshHelmContextCard{padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;margin-bottom:8px}.dshHelmContextCard:last-child{margin-bottom:0}.dshHelmContextHead{display:flex;align-items:center;gap:10px}.dshHelmContextRole{font-size:11px;font-weight:650;color:var(--dsw-alias-label-secondary)}.dshHelmContextMessage{min-width:0;flex:1;font-size:13px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshHelmContextMeta{margin-top:5px;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary);min-width:0}.dshHelmContextTask{margin-top:7px}.dshHelmContextTask summary{cursor:pointer;font-size:11px;color:var(--dsw-alias-label-secondary)}.dshHelmContextTaskText{margin-top:6px;padding:8px 10px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover);white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:18px}.dshHelmTimelineFilters{height:48px;flex:none;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;gap:6px}.dshHelmTimelineFilter{border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 9px;font:12px/18px inherit;cursor:pointer}.dshHelmTimelineFilter:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshHelmTimelineFilter[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}
.dshHelmTimeline{min-height:0;flex:1;overflow:auto;padding:6px 20px 22px}.dshHelmTimelineItem{display:grid;grid-template-columns:74px 76px minmax(0,1fr);gap:12px;padding:14px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshHelmTimelineTime{font-size:11px;line-height:18px;color:var(--dsw-alias-label-secondary)}.dshHelmTimelineActor{font-size:11px;line-height:18px}.dshHelmTimelineActorBadge{display:inline-flex;max-width:72px;padding:2px 6px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dshHelmTimelineContent{min-width:0}.dshHelmTimelineTitle{font-size:13px;font-weight:610;line-height:19px}.dshHelmTimelinePrimary{margin-top:2px;font-size:13px;line-height:19px;overflow-wrap:anywhere}.dshHelmTimelineSecondary{margin-top:3px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:17px;display:flex;gap:7px;flex-wrap:wrap}.dshHelmTimelineText{margin-top:7px;max-width:720px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-specific-menu);font:11px/17px ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.dshHelmTimelineToggle{margin-top:6px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:0;font:11px/16px inherit;cursor:pointer}.dshHelmTimelineToggle:hover{color:var(--dsw-alias-label-primary)}.dshHelmTimelineEmpty{padding:56px 20px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px}.dshHelmSessionError{margin:12px 20px 0;padding:8px 10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;color:var(--dsw-alias-state-error-primary);font-size:12px}
@media(max-width:820px){.dshHelmSessionPanel{width:calc(100vw - 28px);height:calc(100vh - 28px)}.dshHelmSessionNav{width:224px}.dshHelmTimelineItem{grid-template-columns:58px 64px minmax(0,1fr)}.dshHelmSessionFacts{grid-template-columns:72px minmax(0,1fr)}.dshHelmSessionContextTitleRow{align-items:flex-start;flex-direction:column}.dshHelmSessionContextChats{justify-content:flex-start}}
`

export function installSessionActivityStyles(): () => void {
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${CSS_ID}"]`)
  if (existing) return () => {}
  const tag = document.createElement('style')
  tag.dataset.pluginCss = CSS_ID
  tag.textContent = css
  document.head.appendChild(tag)
  return () => tag.remove()
}

function timeLabel(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function shortTimeLabel(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sessionContextFallback(labels: SessionActivityLabels): string {
  return labels.unboundContext
}


function actionLabel(item: ChatSessionTimelineItem, labels: SessionActivityLabels): string {
  const purpose = workHistoryTimelinePurpose(item)
  if (purpose) return purpose
  if (item.kind === 'delegation.created') return labels.delegationCreated
  if (item.kind === 'delegation.attached') return labels.delegationAttached
  if (item.kind === 'delegation.prompted') return labels.delegationPrompted
  if (item.kind === 'delegation.resumed') return labels.delegationResumed
  if (item.kind === 'delegation.status') return labels.delegationStatus
  if (item.actionType === 'read') return labels.actionRead
  if (item.actionType === 'search') return labels.actionSearch
  if (item.actionType === 'inspect') return labels.actionInspect
  if (item.actionType === 'diagnostic') return labels.actionDiagnostic
  if (item.actionType === 'verify') return labels.actionVerify
  if (item.actionType === 'command') return labels.actionCommand
  return labels.actionEdit
}

function subagentStatusLabel(status: ChatSessionTimelineItem['status'], labels: SessionActivityLabels): string | undefined {
  if (status === 'idle') return labels.statusIdle
  if (status === 'running') return labels.statusRunning
  if (status === 'waiting') return labels.statusWaiting
  if (status === 'failed') return labels.statusFailed
  if (status === 'cancelled') return labels.statusCancelled
  if (status === 'unknown') return labels.statusUnknown
  return undefined
}

function timelinePrimary(item: ChatSessionTimelineItem, labels: SessionActivityLabels): string | undefined {
  if (item.kind === 'work') return workHistoryTimelineExecutionDetail(item)
  if (item.kind === 'delegation.prompted') return item.message
  if (item.kind === 'delegation.status') return subagentStatusLabel(item.status, labels)
  return item.title ?? item.requirement ?? item.subagentSessionId
}

function delegationFor(item: ChatSessionTimelineItem, delegations: DelegatedSession[]): DelegatedSession | undefined {
  if (!item.subagentId || !item.subagentSessionId) return undefined
  return delegations.find((entry) => entry.subagentId === item.subagentId && entry.subagentSessionId === item.subagentSessionId)
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
  const [delegations, setDelegations] = useState<DelegatedSession[]>([])
  const [filter, setFilter] = useState<'all' | 'chatgpt' | 'subagent'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string>()
  const [loadingPage, setLoadingPage] = useState(false)
  const [error, setError] = useState<string>()
  const detailCache = useRef(new Map<string, SessionDetailCacheEntry>())
  const detailGeneration = useRef(0)
  const sessionList = useMemo(() => createWorkHistorySessionListModel({
    sessions,
    workspaceId: workspaceFilter,
    ...(selectedId ? { selectedId: selectedId } : {}),
  }), [sessions, workspaceFilter, selectedId])
  const workspaceOptions = sessionList.workspace.options
  const selected = sessionList.selected
  const selectedDetail = useMemo(() => selected ? createWorkHistorySessionDetailModel(selected) : undefined, [selected])
  const selectedOrigin = selectedDetail?.originIntent
  const sortedBoundIntents = selectedDetail?.boundIntents ?? []
  const chatUrls = selectedDetail?.chatUrls ?? []
  const visibleTimeline = useMemo(() => filterWorkHistoryTimeline(timeline, filter), [filter, timeline])

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
    if (selectedId === sessionList.selectedId) return
    setSelectedId(sessionList.selectedId)
  }, [sessionList.selectedId, selectedId])

  useEffect(() => {
    const generation = ++detailGeneration.current
    setExpanded(new Set())
    setCopied(false)
    setRefreshing(false)
    if (!selectedId) {
      setTimeline([])
      setDelegations([])
      setLoading(false)
      return
    }
    const cached = detailCache.current.get(selectedId)
    if (cached) {
      rememberSessionDetail(detailCache.current, selectedId, cached)
      setTimeline(cached.timeline)
      setDelegations(cached.delegations)
      setLoading(false)
      setError(undefined)
      return
    }
    let cancelled = false
    setTimeline([])
    setDelegations([])
    setLoading(true)
    void Promise.all([
      adapter.getSessionTimeline(selectedId),
      adapter.getSessionDelegations(selectedId),
    ]).then(([nextTimeline, nextDelegations]) => {
      if (cancelled) return
      rememberSessionDetail(detailCache.current, selectedId, { timeline: nextTimeline, delegations: nextDelegations })
      if (generation !== detailGeneration.current) return
      setTimeline(nextTimeline)
      setDelegations(nextDelegations)
      setError(undefined)
    }).catch((cause) => {
      if (!cancelled && generation === detailGeneration.current) setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => { if (!cancelled && generation === detailGeneration.current) setLoading(false) })
    return () => { cancelled = true }
  }, [adapter, selectedId])

  const toggleExpanded = (id: string) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const copySessionId = () => {
    if (!selected) return
    void navigator.clipboard?.writeText(selected.id)
    setCopied(true)
  }

  const refreshSelected = () => {
    if (!selectedId || refreshing) return
    const refreshSessionId = selectedId
    const generation = ++detailGeneration.current
    setRefreshing(true)
    void Promise.all([
      adapter.getSession(refreshSessionId),
      adapter.getSessionTimeline(refreshSessionId),
      adapter.getSessionDelegations(refreshSessionId),
    ]).then(([nextSession, nextTimeline, nextDelegations]) => {
      rememberSessionDetail(detailCache.current, refreshSessionId, { timeline: nextTimeline, delegations: nextDelegations })
      if (generation !== detailGeneration.current) return
      const normalized = normalizeWorkHistorySessions([nextSession])[0]
      if (normalized) setSessions((current) => current.map((session) => session.id === refreshSessionId ? normalized : session))
      setTimeline(nextTimeline)
      setDelegations(nextDelegations)
      setExpanded(new Set())
      setError(undefined)
    }).catch((cause) => {
      if (generation === detailGeneration.current) setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => {
      if (generation === detailGeneration.current) setRefreshing(false)
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
                <button type="button" key={item.id} className="dshHelmSessionCard" data-active={item.id === selectedId} onClick={() => setSelectedId(item.id)}>
                  <div className="dshHelmSessionCardTitle">{item.title}</div>
                  <div className="dshHelmSessionCardTime">{labels.recentActivity} · {timeLabel(item.lastActivityAt)}</div>
                  <div className="dshHelmSessionCardMeta"><span>{item.chatCount} {labels.chats}</span></div>
                </button>
              ))}
              {nextCursor ? <button type="button" className="dshHelmSessionLoadMore" disabled={loadingPage} onClick={loadNextPage}>{labels.loadMore}</button> : null}
              {!sessionList.items.length && !loading ? <div className="dshHelmTimelineEmpty">{labels.noSessions}</div> : null}
            </div>
          </aside>
          <main className="dshHelmSessionDetail">
            {selected ? (
              <>
                <section className="dshHelmSessionSummary">
                  <div className="dshHelmSessionSummaryTop">
                    <div className="dshHelmSessionSummaryMain">
                      <div className="dshHelmSessionWorkspaceTitle">{selectedDetail?.title}</div>
                      <div className="dshHelmSessionTimes"><span>{labels.created} · {timeLabel(selected.createdAt)}</span><span>{labels.updated} · {timeLabel(selected.lastActivityAt)}</span></div>
                    </div>
                    <div className="dshHelmSessionIdWrap"><button type="button" className="dshHelmSessionCopy" onClick={refreshSelected} disabled={refreshing}>↻ {labels.refresh}</button><span className="dshHelmSessionIdText">{labels.sessionId} {selected.id}</span><button type="button" className="dshHelmSessionCopy" onClick={copySessionId}>{copied ? labels.copied : labels.copyId}</button></div>
                  </div>
                  <div className="dshHelmSessionFacts">
                    <div className="dshHelmSessionFactLabel">{labels.workspace}</div><div>{selected.workspace?.title ?? selected.workspace?.path ?? labels.unassignedWorkspace}</div>
                  </div>
                </section>
                <section className="dshHelmSessionContext" aria-label={labels.workContext}>
                  <div className="dshHelmSessionContextTitleRow">
                    <div className="dshHelmSessionContextTitle">{labels.workContext}</div>
                    {chatUrls.length ? <div className="dshHelmSessionContextChats">
                      <span className="dshHelmSessionContextChatsLabel">{labels.chatSessions}</span>
                      {chatUrls.map((url, index) => <button type="button" key={url} className="dshHelmContextChat" title={url} onClick={() => adapter.openUrl(url)}>{labels.openChat}{chatUrls.length > 1 ? ` ${index + 1}` : ''} ↗</button>)}
                    </div> : null}
                  </div>
                  <article className="dshHelmContextCard">
                    <div className="dshHelmContextHead">
                      <span className="dshHelmContextRole">{labels.originChat}</span>
                      <span className="dshHelmContextMessage">{selectedOrigin?.message ?? selectedDetail?.title}</span>
                    </div>
                    <details className="dshHelmContextTask">
                      <summary>{labels.task}</summary>
                      <div className="dshHelmContextTaskText">{selectedOrigin?.task ?? sessionContextFallback(labels)}</div>
                    </details>
                  </article>
                  {sortedBoundIntents.map((entry, index) => (
                    <article className="dshHelmContextCard" key={`${entry.boundAt}:${index}`}>
                      <div className="dshHelmContextHead">
                        <span className="dshHelmContextRole">{labels.boundChats} {index + 1}</span>
                        <span className="dshHelmContextMessage">{entry.intent.message}</span>
                      </div>
                      <div className="dshHelmContextMeta">
                        <span>{labels.boundAt} · {timeLabel(entry.boundAt)}</span>
                      </div>
                      <details className="dshHelmContextTask">
                        <summary>{labels.task}</summary>
                        <div className="dshHelmContextTaskText">{entry.intent.task}</div>
                      </details>
                    </article>
                  ))}
                </section>
                <nav className="dshHelmTimelineFilters" aria-label={labels.panelTitle}>
                  <button type="button" className="dshHelmTimelineFilter" data-active={filter === 'all'} onClick={() => setFilter('all')}>{labels.all}</button>
                  <button type="button" className="dshHelmTimelineFilter" data-active={filter === 'chatgpt'} onClick={() => setFilter('chatgpt')}>{labels.chatgpt}</button>
                  <button type="button" className="dshHelmTimelineFilter" data-active={filter === 'subagent'} onClick={() => setFilter('subagent')}>{labels.subagent}</button>
                </nav>
                {error ? <div className="dshHelmSessionError">{labels.loadError}: {error}</div> : null}
                <div className="dshHelmTimeline">
                  {loading ? <div className="dshHelmTimelineEmpty">{labels.loading}</div> : visibleTimeline.length ? visibleTimeline.map((item) => {
                    const delegation = delegationFor(item, delegations)
                    const isExpanded = expanded.has(item.id)
                    const hasDetails = Boolean(delegation?.requirement || delegation?.prompts.length)
                    return (
                      <article className="dshHelmTimelineItem" key={`${item.sequence}:${item.id}`}>
                        <div className="dshHelmTimelineTime">{shortTimeLabel(item.timestamp)}</div>
                        <div className="dshHelmTimelineActor"><span className="dshHelmTimelineActorBadge">{item.actor === 'chatgpt' ? labels.chatgpt : item.actorName ?? labels.subagent}</span></div>
                        <div className="dshHelmTimelineContent">
                          <div className="dshHelmTimelineTitle">{actionLabel(item, labels)}</div>
                          {timelinePrimary(item, labels) ? <div className="dshHelmTimelinePrimary">{timelinePrimary(item, labels)}</div> : null}
                          <div className="dshHelmTimelineSecondary">
                            {item.tool ? <span>{item.tool}</span> : null}
                            {item.workspace?.title ?? item.workspace?.path ? <span>{item.workspace?.title ?? item.workspace?.path}</span> : null}
                            {item.status ? <span>{item.status === 'success' ? labels.statusSuccess : item.status === 'error' ? labels.statusError : subagentStatusLabel(item.status, labels)}</span> : null}
                            {item.durationMs !== undefined ? <span>{item.durationMs} ms</span> : null}
                            {item.subagentSessionId ? <span>{labels.subagentSessionId}: {item.subagentSessionId}</span> : null}
                            {item.error?.message ? <span>{item.error.message}</span> : null}
                          </div>
                          {item.kind === 'delegation.created' && item.requirement ? <div className="dshHelmTimelineText">{item.requirement}</div> : null}
                          {item.kind === 'delegation.prompted' && item.message ? <div className="dshHelmTimelineText">{item.message}</div> : null}
                          {hasDetails ? <button type="button" className="dshHelmTimelineToggle" onClick={() => toggleExpanded(item.id)}>{isExpanded ? '−' : '+'} {labels.fullTask}</button> : null}
                          {isExpanded && delegation ? <div className="dshHelmTimelineText">{delegation.requirement ? `${labels.fullTask}\n${delegation.requirement}` : ''}{delegation.prompts.length ? `${delegation.requirement ? '\n\n' : ''}${labels.followUpPrompts}\n${delegation.prompts.map((prompt) => `• ${prompt.message}`).join('\n')}` : ''}</div> : null}
                        </div>
                      </article>
                    )
                  }) : <div className="dshHelmTimelineEmpty">{labels.noTimeline}</div>}
                </div>
              </>
            ) : <div className="dshHelmTimelineEmpty">{loading ? labels.loading : labels.noSessions}</div>}
          </main>
        </div>
      </section>
    </div>
  )
}
