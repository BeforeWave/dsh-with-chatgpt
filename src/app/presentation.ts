import type { HelmLocaleKey } from './locale.js'

export type HelmCapabilityId = 'understand' | 'coding' | 'command'

export type HelmCapabilityEnabledState = Record<HelmCapabilityId, boolean>

export interface HelmCapabilityDefinition {
  id: HelmCapabilityId
  icon: string
  labelKey: Extract<HelmLocaleKey, 'understand' | 'coding' | 'command'>
  toggleKey: Extract<HelmLocaleKey, 'toggleCodeRead' | 'toggleCodeWrite' | 'toggleAgentDelegation'>
}

export const helmCapabilityDefinitions: readonly HelmCapabilityDefinition[] = [
  { id: 'understand', icon: '💡', labelKey: 'understand', toggleKey: 'toggleCodeRead' },
  { id: 'coding', icon: '✋', labelKey: 'coding', toggleKey: 'toggleCodeWrite' },
  { id: 'command', icon: '👉', labelKey: 'command', toggleKey: 'toggleAgentDelegation' },
] as const

export interface HelmCapabilitySummaryItem {
  id: HelmCapabilityId
  icon: string
  labelKey: HelmCapabilityDefinition['labelKey']
}

export function getHelmCapabilityDefinition(id: HelmCapabilityId): HelmCapabilityDefinition {
  const definition = helmCapabilityDefinitions.find((item) => item.id === id)
  if (!definition) throw new Error(`Unknown Agent Helm capability: ${id}`)
  return definition
}

export function deriveHelmCapabilitySummary(state: HelmCapabilityEnabledState): HelmCapabilitySummaryItem[] {
  return helmCapabilityDefinitions
    .filter(({ id }) => state[id])
    .map(({ id, icon, labelKey }) => ({ id, icon, labelKey }))
}

export function shouldCompactHelmCapabilitySummary(contentWidth: number, availableWidth: number): boolean {
  return contentWidth > availableWidth
}
