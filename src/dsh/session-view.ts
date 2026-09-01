import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type { SessionMessage } from '@beforewave/agent-helm'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function truncate(text: string, maxChars = 8000): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}…[truncated]`
}

function textBlocks(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block) => {
      const row = record(block)
      return row.type === 'text' && typeof row.text === 'string' ? row.text : ''
    })
    .join('')
}

function eventText(event: SessionEvent): string {
  const data = record(event.data)
  if (event.type === 'user/message') return textBlocks(data.content)
  if (event.type === 'assistant/message') {
    // Current DSH stores content directly; early 0.1 previews nested it under message.
    return textBlocks(data.content) || textBlocks(record(data.message).content)
  }
  return ''
}

export function summarizeMessages(events: readonly SessionEvent[], maxItems = 20): SessionMessage[] {
  const rows: SessionMessage[] = []
  for (const event of events) {
    if (event.type !== 'user/message' && event.type !== 'assistant/message') continue
    const text = eventText(event)
    if (!text) continue
    rows.push({
      seq: event.seq,
      time: new Date(event.time).toISOString(),
      role: event.type === 'user/message' ? 'user' : 'assistant',
      text: truncate(text),
    })
  }
  return rows.slice(-maxItems)
}

export function lastAssistantText(events: readonly SessionEvent[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (!event || event.type !== 'assistant/message') continue
    const text = eventText(event)
    if (text) return truncate(text)
  }
  return undefined
}

export function lastEventTime(events: readonly SessionEvent[]): string | undefined {
  const event = events.at(-1)
  return event ? new Date(event.time).toISOString() : undefined
}
