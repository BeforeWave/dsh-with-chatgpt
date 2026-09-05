import * as agentPresets from '@deepseek-ai/dsh-agent-presets'
import type { SessionEvent } from '@deepseek-ai/dsh-session'

export interface SessionPresetInput {
  header: unknown
  events: readonly SessionEvent[]
}

type ResolveSessionPreset = (input: SessionPresetInput) => string | null | undefined

interface AgentPresetProjection {
  init: (header: unknown) => unknown
  apply: (state: unknown, event: unknown) => unknown
}

/**
 * `resolveSessionPreset` is only exported by unreleased builds of
 * `@deepseek-ai/dsh-agent-presets`; importing it as a named binding crashes
 * every published build at module load with:
 * "does not provide an export named 'resolveSessionPreset'".
 * Access it through the namespace object instead so the missing export is
 * a runtime `undefined` rather than a fatal SyntaxError.
 */
const presetsModule = agentPresets as typeof agentPresets & {
  resolveSessionPreset?: ResolveSessionPreset
  agentPresetProjectionDefinition?: AgentPresetProjection
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function normalizePreset(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

/**
 * Resolves the agent preset a persisted session was created with, so the
 * adapter can resume it under the same preset. Resolution order:
 *
 * 1. `resolveSessionPreset` from `@deepseek-ai/dsh-agent-presets`, when the
 *    installed build exports it.
 * 2. The package's own `agentPresetProjectionDefinition` fold (seed from
 *    `header.agentPreset`, advance through `agent-preset/selected` events),
 *    which is exported by published builds and keeps semantics in lockstep
 *    with the presets service.
 * 3. A self-contained reimplementation of the same fold.
 */
export function resolveSessionPreset(input: SessionPresetInput): string | undefined {
  const provided = presetsModule.resolveSessionPreset
  if (typeof provided === 'function') return normalizePreset(provided(input))

  const projection = presetsModule.agentPresetProjectionDefinition
  if (projection) {
    let state: unknown = projection.init(input.header)
    for (const event of input.events) state = projection.apply(state, event)
    return normalizePreset(state)
  }

  return resolveSessionPresetLocally(input)
}

/** Last-resort reimplementation of the `agentPreset` projection fold. */
export function resolveSessionPresetLocally(input: SessionPresetInput): string | undefined {
  const events = input.events
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index]
    if (event?.type !== 'agent-preset/selected') continue
    const preset = record(event.data).agentPreset
    if (typeof preset === 'string' && preset) return preset
  }
  return normalizePreset(record(input.header).agentPreset)
}
