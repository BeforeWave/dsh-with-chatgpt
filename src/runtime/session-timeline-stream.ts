import type { ChatSessionTimelineItem, ChatSessionTimelineUpdateBatch } from '@beforewave/agent-helm'

export interface SessionTimelineSubscriber {
  onUpdates(updates: ChatSessionTimelineItem[]): void
  onError?(error: Error): void
}

interface SessionTimelineStreamState {
  subscribers: Map<SessionTimelineSubscriber, number>
  cursorSequence: number
  timer: NodeJS.Timeout | undefined
  polling: boolean
}

export interface SessionTimelineSubscriptionHubOptions {
  pollIntervalMs?: number
}

export class SessionTimelineSubscriptionHub {
  readonly #sessions = new Map<string, SessionTimelineStreamState>()
  readonly #pollIntervalMs: number

  constructor(
    readonly loadUpdates: (sessionId: string, afterSequence: number) => Promise<ChatSessionTimelineUpdateBatch>,
    readonly releaseTimeline: (sessionId: string) => Promise<void> | void = () => {},
    options: SessionTimelineSubscriptionHubOptions = {},
  ) {
    this.#pollIntervalMs = options.pollIntervalMs ?? 500
  }

  subscribe(sessionId: string, afterSequence: number, subscriber: SessionTimelineSubscriber): () => void {
    if (!Number.isInteger(afterSequence) || afterSequence < 0) throw new Error('afterSequence must be a non-negative integer')
    let state = this.#sessions.get(sessionId)
    if (!state) {
      state = {
        subscribers: new Map(),
        cursorSequence: afterSequence,
        timer: undefined,
        polling: false,
      }
      this.#sessions.set(sessionId, state)
    }
    state.subscribers.set(subscriber, afterSequence)
    if (afterSequence < state.cursorSequence) {
      state.cursorSequence = afterSequence
      if (state.timer) {
        clearTimeout(state.timer)
        state.timer = undefined
      }
    }

    if (!state.polling && !state.timer) void this.#poll(sessionId, state)

    let active = true
    return () => {
      if (!active) return
      active = false
      state?.subscribers.delete(subscriber)
      if (state && state.subscribers.size === 0) this.#release(sessionId, state)
    }
  }

  dispose(): void {
    for (const [sessionId, state] of [...this.#sessions]) this.#release(sessionId, state)
  }

  get activeSessionCount(): number {
    return this.#sessions.size
  }

  #release(sessionId: string, state: SessionTimelineStreamState): void {
    if (state.timer) clearTimeout(state.timer)
    state.timer = undefined
    state.subscribers.clear()
    if (this.#sessions.get(sessionId) !== state) return
    this.#sessions.delete(sessionId)
    void Promise.resolve(this.releaseTimeline(sessionId)).catch(() => {})
  }

  async #poll(sessionId: string, state: SessionTimelineStreamState): Promise<void> {
    if (this.#sessions.get(sessionId) !== state || state.subscribers.size === 0 || state.polling) return
    state.polling = true
    const requestedAfterSequence = state.cursorSequence
    let pollSucceeded = false
    try {
      const batch = await this.loadUpdates(sessionId, requestedAfterSequence)
      if (this.#sessions.get(sessionId) !== state || state.subscribers.size === 0) return
      if (!Number.isInteger(batch.cursorSequence) || batch.cursorSequence < requestedAfterSequence) {
        throw new Error('timeline update cursor must be monotonic')
      }
      pollSucceeded = true
      const rewoundDuringPoll = state.cursorSequence < requestedAfterSequence
      if (!rewoundDuringPoll) state.cursorSequence = batch.cursorSequence
      const updates = [...batch.updates].sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
      for (const [subscriber, subscriberCursor] of [...state.subscribers]) {
        if (subscriberCursor < requestedAfterSequence || batch.cursorSequence <= subscriberCursor) continue
        state.subscribers.set(subscriber, batch.cursorSequence)
        if (updates.length) subscriber.onUpdates(updates)
      }
    } catch (cause) {
      if (this.#sessions.get(sessionId) === state) {
        const error = cause instanceof Error ? cause : new Error(String(cause))
        for (const subscriber of state.subscribers.keys()) subscriber.onError?.(error)
      }
    } finally {
      state.polling = false
      if (this.#sessions.get(sessionId) === state && state.subscribers.size > 0) {
        const catchupPending = pollSucceeded && state.cursorSequence < requestedAfterSequence
        state.timer = setTimeout(() => {
          state.timer = undefined
          void this.#poll(sessionId, state)
        }, catchupPending ? 0 : this.#pollIntervalMs)
      }
    }
  }
}
