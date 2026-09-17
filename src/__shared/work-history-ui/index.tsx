import React, { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { WorkHistoryConversationIntent, WorkHistoryPresentationDetail, WorkHistoryPresentationLabel, WorkHistoryPresentationTitle, WorkHistoryTimelinePresentation } from '../ui-contract/index.js'
import { filterWorkHistoryActivityItems } from './model.js'
export { filterWorkHistoryActivityItems, sortWorkHistoryActivityItemsNewestFirst, type WorkHistoryActivityFilter } from './model.js'

const STYLE_ID = '@beforewave/agent-helm/work-history-ui'

export const workHistoryUiCss = `
.helm-work-history-ui.work-card{box-sizing:border-box;width:100%;padding:12px 20px;border:0;border-bottom:1px solid var(--helm-border);border-radius:0;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer;transition:background-color .12s ease}.helm-work-history-ui.work-card:last-child{border-bottom:0}.helm-work-history-ui.work-card--current{background:var(--helm-hover)}.helm-work-history-ui.work-card:hover,.helm-work-history-ui.work-card:focus-visible{background:var(--helm-hover);outline:none}.helm-work-history-ui .work-card__title{min-width:0;display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;text-overflow:ellipsis;font-size:13px;line-height:19px;font-weight:620}.helm-work-history-ui .work-card__meta{min-width:0;margin-top:5px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--helm-secondary);font-size:11px;line-height:17px}.helm-work-history-ui .work-card__meta time{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.helm-work-history-ui .work-card__linked-state{flex:none;font-weight:600}.helm-work-history-ui .work-card__linked-state--linked{font-weight:650;color:var(--helm-business)}
.helm-work-history-ui.context-card{box-sizing:border-box;min-width:0;width:100%;padding:12px 20px;border:0;border-bottom:1px solid var(--helm-border);border-radius:0;background:transparent;color:inherit;text-align:left;font:inherit;transition:background-color .12s ease}.helm-work-history-ui.context-card:last-child{border-bottom:0}.helm-work-history-ui.context-card:hover,.helm-work-history-ui.context-card:focus-visible{background:var(--helm-hover);outline:none}.helm-work-history-ui.context-card--clickable{cursor:pointer}.helm-work-history-ui .context-card__title{min-width:0;display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow-wrap:anywhere;font-size:13px;line-height:19px;font-weight:650}.helm-work-history-ui .context-card__preview{min-width:0;margin-top:4px;display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow-wrap:anywhere;color:var(--helm-secondary);font-size:12px;line-height:18px}
.helm-work-history-ui.intent-list{box-sizing:border-box;width:100%;max-height:240px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;border-top:1px solid var(--helm-border);border-bottom:1px solid var(--helm-border)}
.helm-work-history-ui.intent-detail{box-sizing:border-box;min-width:0;width:100%;padding:16px 20px;border-bottom:1px solid var(--helm-border)}.helm-work-history-ui .intent-detail__title{min-width:0;margin:0;overflow-wrap:anywhere;font-size:18px;line-height:25px;font-weight:650;letter-spacing:-.015em}.helm-work-history-ui .intent-detail__time{display:block;min-width:0;margin-top:4px;color:var(--helm-secondary);font-size:11px;line-height:18px;text-align:left}.helm-work-history-ui .intent-detail__time time{display:block;white-space:nowrap}.helm-work-history-ui .intent-detail__message{min-width:0;margin-top:10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:20px}
.helm-work-history-ui.timeline-section{width:100%;max-width:100%;min-width:0;overflow-x:hidden;border-bottom:1px solid var(--helm-border)}.helm-work-history-ui .timeline-filters{box-sizing:border-box;height:48px;display:flex;align-items:center;gap:6px;padding:0 20px;border-bottom:1px solid var(--helm-border)}.helm-work-history-ui .timeline-filter{border:0;border-radius:7px;background:transparent;color:var(--helm-secondary);padding:5px 9px;font:12px/18px inherit;cursor:pointer;transition:background-color .12s ease,color .12s ease}.helm-work-history-ui .timeline-filter:hover{background:var(--helm-hover)}.helm-work-history-ui .timeline-filter[data-active=true]{background:var(--helm-hover);color:var(--helm-primary,#25282e);font-weight:600}.helm-work-history-ui .timeline-filter:focus-visible{outline:2px solid rgba(79,108,247,.22);outline-offset:1px}.helm-work-history-ui .timeline{box-sizing:border-box;width:100%;max-width:100%;min-width:0;display:flex;flex-direction:column;padding:6px 0 22px}.helm-work-history-ui .timeline-item{box-sizing:border-box;width:100%;max-width:100%;min-width:0;display:grid;grid-template-columns:minmax(0,1fr);padding:14px 20px;border-bottom:1px solid var(--helm-border);transition:background-color .12s ease}.helm-work-history-ui .timeline-item:last-child{border-bottom:0}.helm-work-history-ui .timeline-item:hover{background:var(--helm-hover)}.helm-work-history-ui .timeline-item__meta{min-width:0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;color:var(--helm-secondary);font-size:11px;line-height:18px}.helm-work-history-ui .timeline-item__meta-main{min-width:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px 8px;text-align:right}.helm-work-history-ui .timeline-item__meta time{flex:none;color:var(--helm-secondary);white-space:nowrap;text-align:left}.helm-work-history-ui .actor-badge{min-width:0;flex:0 1 auto;display:inline-flex;max-width:100%;padding:2px 6px;border-radius:999px;background:var(--helm-badge-bg,#f0f0f2);font-size:11px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.helm-work-history-ui .timeline-item__content{width:100%;min-width:0;margin-top:7px;overflow-wrap:anywhere;font-size:13px;line-height:19px}.helm-work-history-ui .timeline-item__primary-shell{position:relative;min-width:0}.helm-work-history-ui .timeline-item__primary{min-width:0;overflow-wrap:anywhere}.helm-work-history-ui .timeline-item__primary--collapsed{max-height:57px;overflow:hidden}.helm-work-history-ui .timeline-item__primary--expanded{overflow:visible}.helm-work-history-ui .timeline-item__content strong{display:block;min-width:0;margin-bottom:1px;overflow-wrap:anywhere;font-weight:610}.helm-work-history-ui .timeline-item__content>div{min-width:0;overflow-wrap:anywhere}.helm-work-history-ui .timeline-item__toggle{padding:0 3px;border:0;border-radius:4px;background:transparent;color:var(--helm-secondary);font:11px/17px inherit;vertical-align:baseline;cursor:pointer;transition:background-color .12s ease,color .12s ease}.helm-work-history-ui .timeline-item__toggle:hover{background:var(--helm-hover);color:inherit}.helm-work-history-ui .timeline-item__toggle--collapsed{position:absolute;right:0;bottom:0;z-index:1;background:var(--helm-surface)}.helm-work-history-ui .timeline-item__toggle--collapsed::before{content:"";position:absolute;top:0;right:100%;bottom:0;width:18px;background:var(--helm-surface);pointer-events:none}.helm-work-history-ui .timeline-item:hover .timeline-item__toggle--collapsed,.helm-work-history-ui .timeline-item:hover .timeline-item__toggle--collapsed::before{background:linear-gradient(var(--helm-hover),var(--helm-hover)),var(--helm-surface)}.helm-work-history-ui .timeline-item__toggle--inline{display:inline}.helm-work-history-ui .timeline-item__secondary{min-width:0;margin-top:3px;display:flex;flex-wrap:wrap;gap:7px;overflow-wrap:anywhere;color:var(--helm-secondary);font-size:11px;line-height:17px}.helm-work-history-ui .timeline-item__secondary span{min-width:0;max-width:100%;overflow-wrap:anywhere}.helm-work-history-ui .work-history-empty{padding:32px 20px;text-align:center;color:var(--helm-secondary);font-size:12px;line-height:18px}
`

export function installWorkHistoryUiStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector<HTMLStyleElement>(`style[data-shared-css="${STYLE_ID}"]`)
  if (existing) return () => {}
  const tag = document.createElement('style')
  tag.dataset.sharedCss = STYLE_ID
  tag.textContent = workHistoryUiCss
  document.head.appendChild(tag)
  return () => tag.remove()
}

export interface WorkHistoryRowData {
  id: string
  title: string
  timestamp: string
  linked: boolean
}

export function WorkHistoryRow({ item, current = false, linkedLabel, unlinkedLabel, formatTimestamp, onSelect }: {
  item: WorkHistoryRowData
  current?: boolean
  linkedLabel: string
  unlinkedLabel: string
  formatTimestamp: (value: string) => string
  onSelect: (id: string) => void
}) {
  return (
    <button type="button" className={current ? 'helm-work-history-ui work-card work-card--current' : 'helm-work-history-ui work-card'} onClick={() => onSelect(item.id)}>
      <div className="work-card__title">{item.title}</div>
      <div className="work-card__meta">
        <time>{formatTimestamp(item.timestamp)}</time>
        <span className={item.linked ? 'work-card__linked-state work-card__linked-state--linked' : 'work-card__linked-state'}>{item.linked ? linkedLabel : unlinkedLabel}</span>
      </div>
    </button>
  )
}

export function workHistoryIntentTitle(intent: WorkHistoryConversationIntent): string {
  return intent.task.trim() || intent.message.trim()
}

export function workHistoryIntentDetail(intent: WorkHistoryConversationIntent): string {
  const message = intent.message.trim()
  return message && message !== workHistoryIntentTitle(intent) ? message : ''
}

export function WorkHistoryIntentList({ children }: { children: React.ReactNode }) {
  return <div className="helm-work-history-ui intent-list">{children}</div>
}

export function WorkHistoryIntentDetail({ intent, timestamp, formatTimestamp }: {
  intent: WorkHistoryConversationIntent
  timestamp: string
  formatTimestamp: (value: string) => string
}) {
  const detail = workHistoryIntentDetail(intent)
  return (
    <section className="helm-work-history-ui intent-detail">
      <h1 className="intent-detail__title">{workHistoryIntentTitle(intent)}</h1>
      <div className="intent-detail__time"><time>{formatTimestamp(timestamp)}</time></div>
      {detail ? <div className="intent-detail__message">{detail}</div> : null}
    </section>
  )
}

export function IntentRow({ intent, onOpen }: { intent: WorkHistoryConversationIntent; onOpen?: () => void }) {
  const title = workHistoryIntentTitle(intent)
  const detail = workHistoryIntentDetail(intent)
  const onKeyDown = onOpen ? (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpen()
  } : undefined
  return (
    <article
      className={onOpen ? 'helm-work-history-ui context-card context-card--clickable' : 'helm-work-history-ui context-card'}
      {...(onOpen ? { role: 'button', tabIndex: 0 } : {})}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div className="context-card__title">{title}</div>
      {detail ? <div className="context-card__preview">{detail}</div> : null}
    </article>
  )
}

function ExpandableActivityDetail({ text, expandLabel, collapseLabel }: { text: string; expandLabel: string; collapseLabel: string }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded) return
    const detail = detailRef.current
    if (!detail) return
    const measure = () => setOverflowing(detail.scrollHeight > detail.clientHeight + 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(detail)
    return () => observer.disconnect()
  }, [expanded, text])

  return (
    <div className="timeline-item__primary-shell" data-expanded={expanded}>
      {expanded ? (
        <div className="timeline-item__primary timeline-item__primary--expanded">
          <span>{text}</span>
          {overflowing ? <> {' '}<button type="button" className="timeline-item__toggle timeline-item__toggle--inline" aria-expanded="true" onClick={() => setExpanded(false)}>{collapseLabel}</button></> : null}
        </div>
      ) : (
        <>
          <div ref={detailRef} className="timeline-item__primary timeline-item__primary--collapsed">{text}</div>
          {overflowing ? <button type="button" className="timeline-item__toggle timeline-item__toggle--collapsed" aria-expanded="false" onClick={() => setExpanded(true)}><span aria-hidden="true">… </span>{expandLabel}</button> : null}
        </>
      )}
    </div>
  )
}

export interface WorkHistoryActivityRowData {
  id: string
  timestamp: string
  sequence?: number
  actor: 'chatgpt' | 'subagent'
  actorLabel: string
  presentation: WorkHistoryTimelinePresentation
}

export interface WorkHistoryActivityLabels {
  all: string
  chatgpt: string
  subagent: string
  expand: string
  collapse: string
  empty: string
  filterAriaLabel: string
  subagentSessionId: string
  presentationLabel: (label: WorkHistoryPresentationLabel) => string
  statusLabel: (status: string) => string
}

function activityPresentationTitle(title: WorkHistoryPresentationTitle, labels: WorkHistoryActivityLabels): string {
  return title.kind === 'text' ? title.text : labels.presentationLabel(title.label)
}

function activityPresentationDetail(detail: WorkHistoryPresentationDetail, labels: WorkHistoryActivityLabels): string {
  if (detail.kind === 'duration') return `${detail.durationMs} ms`
  if (detail.kind === 'subagent-session') return `${labels.subagentSessionId}: ${detail.id}`
  if (detail.kind === 'status') return labels.statusLabel(detail.text)
  return detail.text
}

export function splitWorkHistoryActivityDetails(details: WorkHistoryPresentationDetail[]) {
  return {
    durations: details.filter((detail) => detail.kind === 'duration'),
    statuses: details.filter((detail) => detail.kind === 'status'),
    content: details.filter((detail) => detail.kind !== 'status' && detail.kind !== 'duration' && detail.kind !== 'tool' && detail.kind !== 'workspace'),
  }
}

export function WorkHistoryActivityTimeline({ items, labels, formatTimestamp }: {
  items: WorkHistoryActivityRowData[]
  labels: WorkHistoryActivityLabels
  formatTimestamp: (value: string) => string
}) {
  const [filter, setFilter] = useState<'all' | 'chatgpt' | 'subagent'>('all')
  const visible = filterWorkHistoryActivityItems(items, filter)
  return (
    <section className="helm-work-history-ui timeline-section">
      <nav className="timeline-filters" aria-label={labels.filterAriaLabel}>
        <button type="button" className="timeline-filter" data-active={filter === 'all'} onClick={() => setFilter('all')}>{labels.all}</button>
        <button type="button" className="timeline-filter" data-active={filter === 'chatgpt'} onClick={() => setFilter('chatgpt')}>{labels.chatgpt}</button>
        <button type="button" className="timeline-filter" data-active={filter === 'subagent'} onClick={() => setFilter('subagent')}>{labels.subagent}</button>
      </nav>
      <div className="timeline">
        {visible.length ? visible.map((item) => {
          const details = splitWorkHistoryActivityDetails(item.presentation.details)
          return (
            <article className="timeline-item" key={item.id}>
              <div className="timeline-item__meta">
                <time>{formatTimestamp(item.timestamp)}</time>
                <div className="timeline-item__meta-main">
                  {details.durations.map((detail, index) => <span key={`duration:${index}`}>{activityPresentationDetail(detail, labels)}</span>)}
                  {details.statuses.map((detail, index) => <span key={`status:${index}`}>{activityPresentationDetail(detail, labels)}</span>)}
                  <span className="actor-badge">{item.actorLabel}</span>
                </div>
              </div>
              <div className="timeline-item__content">
                <strong>{activityPresentationTitle(item.presentation.title, labels)}</strong>
                {item.presentation.primary ? <ExpandableActivityDetail text={item.presentation.primary} expandLabel={labels.expand} collapseLabel={labels.collapse} /> : null}
                {details.content.length ? <div className="timeline-item__secondary">{details.content.map((detail, index) => <span key={index}>{activityPresentationDetail(detail, labels)}</span>)}</div> : null}
              </div>
            </article>
          )
        }) : <div className="work-history-empty">{labels.empty}</div>}
      </div>
    </section>
  )
}
