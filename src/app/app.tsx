import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { deriveHelmConnectionHealth, tunnelOnboardingSource, tunnelSetupCanSubmit, type TunnelSetupValues } from '@beforewave/agent-helm-ui-contract'
import { helmUiDictionaries, type HelmLocaleKey, type HelmTranslate } from './locale.js'
import { deriveHelmCapabilitySummary, getHelmCapabilityDefinition, shouldCompactHelmCapabilitySummary } from './presentation.js'
import {
  Button,
  IconChevronDownOutline14,
  IconChevronRightOutline14,
  IconChevronUpOutline14,
  IconCodeOutline16,
  IconWarningOutline16,
  StateDot,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { HelmUiDependencyName, HelmUiRuntimeState, HelmUiStatus } from '../runtime/status.js'
import { isHelmUiRequestError, type HelmUiAdapter, type HelmExternalCapability } from './adapter.js'
import { SessionActivityPanel } from './components/session-activity.js'

const CSS_ID = '@beforewave/dsh-with-chatgpt/client'
export const HELM_LOCALE_NS = 'dsh.chatgptHelm' as const

const css = `
.dshHelmLayer{flex:none;align-items:center;width:100%;height:42px;margin:8px 0 0;display:flex;position:relative}
.dshHelmLayer[data-rail]{width:36px;height:36px;margin:0}
.dshHelmTrigger{box-sizing:border-box;width:100%;height:36px;min-width:0;align-items:center;justify-content:flex-start;gap:4px;margin:0;padding:0 14px;border:0;border-radius:18px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:14px;display:inline-flex;overflow:hidden}
.dshHelmTrigger:hover,.dshHelmTrigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmTrigger:focus{outline:none}
.dshHelmTrigger:focus-visible{outline:1px solid var(--dsw-alias-border-l4);outline-offset:1px}
.dshHelmLayer[data-rail] .dshHelmTrigger{width:36px;height:36px;justify-content:center;margin:0;padding:0}
.dshHelmIcon{width:16px;height:16px;flex:none}
.dshHelmLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}
.dshHelmTriggerCaps{flex:none;display:inline-flex;align-items:center;gap:2px;font-size:12px;line-height:1}
.dshHelmTriggerIssue{width:16px;height:16px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-error-primary)}
.dshHelmPanel{z-index:30;box-sizing:border-box;width:100%;max-width:calc(100vw - 24px);padding:4px;border:1px solid var(--dsw-alias-border-inverted);border-radius:12px;background:var(--dsw-specific-menu);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;position:fixed;overflow:visible}
.dshHelmBody{display:flex;flex-direction:column;gap:0}
.dshHelmRow{box-sizing:border-box;min-height:50px;width:100%;display:flex;align-items:center;gap:8px;padding:7px 8px 7px 11px;position:relative;border-bottom:0}
.dshHelmRow::after{content:"";position:absolute;left:11px;right:8px;bottom:0;border-bottom:1px solid var(--dsw-alias-border-l2);pointer-events:none}
.dshHelmRow:last-child::after{display:none}
.dshHelmNameArea{min-width:0;flex:1;display:flex;align-items:center;gap:6px;overflow:hidden}
.dshHelmCapsInline{position:relative;min-width:0;flex:1;display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px;font-weight:500;white-space:nowrap;overflow:hidden}
.dshHelmCapsItem{display:inline-flex;align-items:center;gap:3px;flex:none}
.dshHelmCapsItemLabel{display:inline}
.dshHelmCapsInline[data-compact=true]>.dshHelmCapsItem .dshHelmCapsItemLabel{display:none}
.dshHelmCapsMeasure{position:absolute;visibility:hidden;pointer-events:none;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.dshHelmName{min-width:0;max-width:100%;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}
.dshHelmNameButton{box-sizing:border-box;min-width:0;max-width:100%;height:28px;justify-content:flex-start;margin:0;padding:0;border-radius:4px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshHelmNameButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmNameButton[data-management=true]{cursor:pointer}
.dshHelmNameButton:focus{outline:none}
.dshHelmNameButton:focus-visible{outline:1px solid var(--dsw-alias-border-l4);outline-offset:1px}
.dshHelmTooltipTarget{min-width:0;max-width:100%;display:inline-flex;align-items:center}
.dshHelmState{width:10px;height:10px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.dshHelmIssue{flex:none;display:inline-flex;align-items:center;color:var(--dsw-alias-state-error-primary)}
.dshHelmIssueTarget{box-sizing:border-box;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;background:transparent;color:var(--dsw-alias-state-error-primary);cursor:pointer;border-radius:6px}
.dshHelmIssueTarget:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmTunnelControl{display:inline-flex;align-items:center;gap:8px;flex:none}
.dshHelmTunnelConfig{box-sizing:border-box;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dshHelmTunnelConfig:hover,.dshHelmTunnelConfig[aria-expanded=true],.dshHelmRow:hover .dshHelmTunnelConfig{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshHelmTunnelConfig:focus{outline:none}
.dshHelmTunnelConfig:focus-visible{outline:1px solid var(--dsw-alias-border-l4);outline-offset:1px}
.dshHelmInlineState{width:10px;height:10px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.dshHelmTunnelDialogStatus{display:inline-flex;align-items:center;gap:7px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dshHelmTunnelHeaderTitle{min-width:0;flex:1;display:flex;align-items:center;gap:7px}
.dshHelmTunnelScrim{padding:14px}
.dshHelmSessionPanel.dshHelmTunnelDialog{width:min(960px,calc(100vw - 28px));height:auto;max-height:calc(100vh - 28px)}
.dshHelmTunnelDialog .dshHelmSessionHeader{height:58px;padding:0 18px}
.dshHelmTunnelDialogBody{min-height:0;flex:1 1 auto;overflow:auto;padding:14px 24px 24px}
.dshHelmTunnelDialogContent{width:100%;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,1fr);gap:14px;align-items:stretch}
.dshHelmTunnelDialogMain,.dshHelmTunnelDialogAside{min-width:0;height:100%;display:flex;flex-direction:column;gap:14px}
.dshHelmTunnelDialogMain>.dshHelmTunnelDialogStep{height:100%}
.dshHelmTunnelDialogAside>.dshHelmTunnelDialogStep{flex:1}
.dshHelmTunnelDialogErrors{grid-column:1/-1;max-height:84px;overflow:auto;display:flex;flex-direction:column;gap:5px;padding-right:4px}
.dshHelmTunnelDialogStep{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-specific-menu)}
.dshHelmTunnelStepHeading{display:flex;align-items:center;gap:6px;min-height:22px}
.dshHelmTunnelStepState,.dshHelmFieldState{display:inline-flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:500}
.dshHelmTunnelInfoButton{box-sizing:border-box;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;flex:none;padding:0;border:1px solid var(--dsw-alias-border-l3);border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);font:600 11px/1 ui-sans-serif,system-ui;cursor:help}
.dshHelmTunnelInfoButton:hover,.dshHelmTunnelInfoButton:focus-visible{border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary);outline:none}
.dshHelmTunnelPrimaryActions{align-items:center}
.dshHelmExternalLink{display:inline-flex;align-items:center;gap:4px;padding:0;border:0;background:transparent;color:var(--dsw-alias-state-business-primary);font:13px/20px inherit;font-weight:550;cursor:pointer;text-align:left}.dshHelmExternalLink:hover{text-decoration:underline}.dshHelmExternalLink:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.dshHelmTunnelInstallState:disabled{opacity:.65}
@media(max-width:900px){.dshHelmTunnelDialogBody{padding:12px}.dshHelmTunnelDialogContent{grid-template-columns:1fr}.dshHelmTunnelDialogErrors{grid-column:1}.dshHelmTunnelDialogAside{gap:12px}}
.dshHelmTunnelInstall{margin-top:4px;padding:12px;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover);display:flex;flex-direction:column;gap:6px}
.dshHelmDetails{box-sizing:border-box;padding:10px 11px 11px;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-interactive-bg-hover)}
.dshHelmGroupBody{box-sizing:border-box;position:relative;border-bottom:0}
.dshHelmGroupBody::after{content:"";position:absolute;left:26px;right:8px;bottom:0;border-bottom:1px solid var(--dsw-alias-border-l2);pointer-events:none}
.dshHelmGroupBody>.dshHelmRow{padding-left:26px}
.dshHelmGroupBody>.dshHelmRow::after{left:26px}
.dshHelmSubRow{box-sizing:border-box;min-height:42px;width:100%;display:flex;align-items:center;gap:8px;padding:6px 8px 6px 26px;position:relative;border-bottom:0}
.dshHelmSubRow::after{content:"";position:absolute;left:26px;right:8px;bottom:0;border-bottom:1px solid var(--dsw-alias-border-l2);pointer-events:none}
.dshHelmSubRow:last-child::after{display:none}
.dshHelmSubName{min-width:0;flex:1;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}
.dshHelmSubIcon{display:inline-flex;width:20px;justify-content:flex-start;align-items:center;margin-right:2px}
.dshHelmSessionEntry{cursor:pointer;background:transparent;color:inherit;text-align:left;font:inherit;border-left:0;border-right:0;border-top:0}.dshHelmSessionEntry:hover{background:transparent}.dshHelmSessionEntryTitle{min-width:0;flex:1;font-size:14px;line-height:22px}.dshHelmSessionEntryArrow{box-sizing:border-box;width:28px;height:28px;flex:none;border-radius:50%;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center}.dshHelmSessionEntry:hover .dshHelmSessionEntryArrow{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshHelmCapabilityRow{cursor:pointer;border:0;background:transparent;color:inherit;text-align:left;font:inherit}
.dshHelmCapabilityRow:hover{background:transparent}
.dshHelmCapabilityRow:focus{outline:none}
.dshHelmCapabilityRow:focus-visible{outline:1px solid var(--dsw-alias-border-l4);outline-offset:-2px}
.dshHelmExpandButton{box-sizing:border-box;width:28px;height:28px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:50%;color:var(--dsw-alias-label-tertiary);transition:background-color .12s var(--ds-ease-in-out),color .12s var(--ds-ease-in-out)}
.dshHelmCapabilityRow:hover .dshHelmExpandButton{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshHelmDetailsText{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;overflow-wrap:anywhere}
.dshHelmDetailsText[data-error=true]{color:var(--dsw-alias-state-error-primary)}
.dshHelmNote{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dshHelmActions{display:flex;gap:8px;flex-wrap:wrap;padding-top:9px}
.dshHelmSwitch{box-sizing:border-box;width:40px;height:24px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:3px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dshHelmSwitch:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dshHelmSwitch:disabled{color:var(--dsw-alias-label-dimmed);cursor:not-allowed;opacity:.45}
.dshHelmSwitchTrack{position:relative;display:inline-block;width:40px;height:24px;border-radius:12px;background:var(--dsw-alias-border-l2);transition:background-color .12s var(--ds-ease-in-out)}
.dshHelmSwitchTrack[data-on=true]{background:var(--dsw-alias-state-business-primary)}
.dshHelmSwitchThumb{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:var(--dsw-static-neutral-bluish-00);transition:transform .12s var(--ds-ease-in-out)}
.dshHelmSwitchTrack[data-on=true] .dshHelmSwitchThumb{transform:translateX(16px)}
.dshHelmLoading{margin:8px 0;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px}
.dshHelmCoreArea{position:relative}
.dshHelmConfirm{position:absolute;right:0;bottom:calc(100% + 6px);z-index:2;width:230px;padding:9px 10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:9px;background:var(--dsw-specific-menu);box-shadow:var(--dsw-shadow-lv2)}
.dshHelmConfirmText{margin:0 0 8px;color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px}
.dshHelmConfirmActions{display:flex;gap:8px;justify-content:flex-end}
.dshHelmInstallCommand{box-sizing:border-box;width:100%;display:block;margin:8px 0 0;padding:7px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-specific-menu);color:var(--dsw-alias-label-primary);text-align:left}
.dshHelmInstallCommandText{display:block;min-width:0;width:100%;font:11px/16px ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere;white-space:pre-wrap;user-select:text}
.dshHelmOperationError{box-sizing:border-box;max-height:108px;overflow:auto;padding-right:4px;white-space:pre-wrap}
.dshHelmField{display:flex;flex-direction:column;gap:5px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.dshHelmFieldLabel{display:inline-flex;align-items:center;gap:5px;width:max-content;max-width:100%}
.dshHelmFieldControl{display:grid;grid-template-columns:minmax(0,460px) auto;align-items:center;gap:8px;width:max-content;max-width:100%}
.dshHelmFieldControl .dshHelmInput{min-width:0}
.dshHelmInput{box-sizing:border-box;width:100%;height:36px;padding:6px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-specific-menu);color:var(--dsw-alias-label-primary);font:13px/20px ui-monospace,SFMono-Regular,Menlo,monospace}
.dshHelmInput:focus{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:0}
.dshHelmStepTitle{color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px;font-weight:650}
`

export function installHelmStyles(): () => void {
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${CSS_ID}"]`)
  if (existing) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = '@beforewave/dsh-with-chatgpt'
  tag.dataset.pluginCss = CSS_ID
  tag.textContent = css
  document.head.appendChild(tag)
  return () => tag.remove()
}

function InstallCommand({ command }: { command: string }): React.JSX.Element {
  return (
    <div className="dshHelmInstallCommand">
      <code className="dshHelmInstallCommandText">{command}</code>
    </div>
  )
}

function stateKey(state: HelmUiRuntimeState): HelmLocaleKey {
  switch (state) {
    case 'running': return 'stateRunning'
    case 'ready': return 'stateReady'
    case 'stopped': return 'stateStopped'
    case 'missing-config': return 'stateMissingConfig'
    case 'disabled': return 'stateDisabled'
    case 'unavailable': return 'stateUnavailable'
  }
}

function dotState(state: HelmUiRuntimeState): 'done' | 'warning' | 'error' {
  if (state === 'running' || state === 'ready') return 'done'
  if (state === 'missing-config') return 'warning'
  return 'error'
}

function statusNeedsAttention(status: HelmUiStatus | undefined, requestError: boolean): boolean {
  const presentation = deriveHelmConnectionHealth(status ? {
    ...(requestError ? { requestError: 'request error' } : {}),
    core: { state: status.core.state, ...(status.core.enabled === undefined ? {} : { enabled: status.core.enabled }), ...(status.core.message ? { message: status.core.message } : {}) },
    dependencies: [
      { name: 'tunnelClient', state: status.dependencies.tunnelClient.state },
    ],
    tunnel: { state: status.tunnel.state },
    localMcp: { state: status.localMcp.state, ...(status.localMcp.message ? { message: status.localMcp.message } : {}) },
  } : requestError ? { requestError: 'request error' } : undefined)
  return presentation.state === 'error'
}

export { helmUiDictionaries }
export type { HelmLocaleKey, HelmTranslate }

export interface ChatGPTHelmAppProps {
  wide: boolean
  t: HelmTranslate
  adapter: HelmUiAdapter
  initiallyOpen?: boolean
}

export type HelmPanelProps = ChatGPTHelmAppProps

type HelmIssue = { title: string; detail?: string }
type HelmUpdateTarget = 'core' | 'localMcp' | 'externalAgentLsp' | 'externalAccess' | 'tunnelSetup'
type HelmCapabilitySummaryItem = { icon: string; label: string }

function requestErrorDetail(cause: unknown, t: HelmTranslate): string {
  if (!isHelmUiRequestError(cause)) return cause instanceof Error ? cause.message : String(cause)
  const status = String(cause.statusCode ?? 'unknown')
  switch (cause.kind) {
    case 'service-unreachable':
      return t('localServiceUnreachable')
    case 'transport-interrupted':
      return cause.recoveredStatus ? t('localRequestRecoveredUnknown') : t('localRequestNoResponse')
    case 'invalid-response':
      return t('localServiceInvalidResponse', { status })
    case 'http-error':
      return t(cause.retryable ? 'localServiceHttpRetryable' : 'localServiceHttpRejected', { status, detail: cause.message })
  }
}

export function shouldCompactCapabilitySummary(contentWidth: number, availableWidth: number): boolean {
  return shouldCompactHelmCapabilitySummary(contentWidth, availableWidth)
}

function StatusIssue({ issue, expanded, onClick }: { issue: HelmIssue; expanded?: boolean; onClick?: (() => void) | undefined }): JSX.Element {
  return (
    <span className="dshHelmIssue">
      <Tooltip label={issue.detail ? `${issue.title}：${issue.detail}` : issue.title} side="top" delayMs={0} maxWidth={260}>
        <button type="button" className="dshHelmIssueTarget" aria-label={issue.title} aria-expanded={onClick ? expanded : undefined} onClick={(event) => { event.stopPropagation(); onClick?.() }}>
          <IconWarningOutline16 />
        </button>
      </Tooltip>
    </span>
  )
}

function ExpandChevron({ expanded }: { expanded: boolean }): JSX.Element {
  return (
    <span className="dshHelmExpandButton" aria-hidden="true">
      {expanded ? <IconChevronDownOutline14 /> : <IconChevronUpOutline14 />}
    </span>
  )
}

function TunnelGuidanceText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return <p className="dshHelmDetailsText">{parts.map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</p>
}

function TunnelInfo({ label }: { label: string }): JSX.Element {
  return (
    <Tooltip label={label} side="top" delayMs={0} maxWidth={320}>
      <button type="button" className="dshHelmTunnelInfoButton" aria-label={label}>i</button>
    </Tooltip>
  )
}

function TunnelSetupDialog({
  status,
  tunnelId,
  organizationId,
  runtimeApiKey,
  proxyUrl,
  requestError,
  pendingInstall,
  pendingSave,
  t,
  onTunnelIdChange,
  onOrganizationIdChange,
  onRuntimeApiKeyChange,
  onProxyUrlChange,
  onInstallTunnelClient,
  onConfigure,
  onOpenUrl,
  onClose,
}: {
  status: HelmUiStatus
  tunnelId: string
  organizationId: string
  runtimeApiKey: string
  proxyUrl: string
  requestError: string | undefined
  pendingInstall: boolean
  pendingSave: boolean
  t: HelmTranslate
  onTunnelIdChange: (value: string) => void
  onOrganizationIdChange: (value: string) => void
  onRuntimeApiKeyChange: (value: string) => void
  onProxyUrlChange: (value: string) => void
  onInstallTunnelClient: () => void
  onConfigure: () => void
  onOpenUrl: (url: string) => void
  onClose: () => void
}): JSX.Element {
  const tunnel = status.tunnel
  const dependencyMissing = status.dependencies.tunnelClient.state === 'unavailable'
  const [agentHelmStep, openAiStep, chatGptStep] = tunnelOnboardingSource.steps
  const hasErrors = Boolean(requestError || tunnel.error?.message || tunnel.missingEnvironment?.length)
  const canSubmit = tunnelSetupCanSubmit({ tunnelId, apiKeyConfigured: tunnel.apiKeyConfigured ?? false, runtimeApiKey })
  const configurationReady = tunnel.configured ?? Boolean(tunnel.tunnelId && tunnel.apiKeyConfigured)
  return (
    <div className="dshHelmSessionScrim dshHelmTunnelScrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section id="dshHelmTunnelSetupDialog" className="dshHelmSessionPanel dshHelmTunnelDialog" role="dialog" aria-modal="true" aria-label={t(tunnelOnboardingSource.title.key)}>
        <header className="dshHelmSessionHeader">
          <div className="dshHelmTunnelHeaderTitle">
            <div className="dshHelmSessionHeaderTitle">{t(tunnelOnboardingSource.title.key)}</div>
          </div>
          <div className="dshHelmTunnelDialogStatus" role="status"><StateDot state={dotState(tunnel.state)} size={8} /><span>{t(stateKey(tunnel.state))}</span></div>
          <button type="button" className="dshHelmSessionClose" aria-label={t('sessionClose')} onClick={onClose}>×</button>
        </header>
        <div className="dshHelmTunnelDialogBody"><div className="dshHelmTunnelDialogContent">
          {hasErrors ? (
            <div className="dshHelmTunnelDialogErrors">
              {requestError ? <p className="dshHelmDetailsText" data-error="true">{requestError}</p> : null}
              {tunnel.error?.message ? <p className="dshHelmDetailsText" data-error="true">{tunnel.error.message}</p> : null}
              {tunnel.missingEnvironment?.length ? <p className="dshHelmDetailsText" data-error="true">{t('tunnelConfigDetails', { names: tunnel.missingEnvironment.join(', ') })}</p> : null}
            </div>
          ) : null}

          <div className="dshHelmTunnelDialogMain">
            <section className="dshHelmTunnelDialogStep">
              <div className="dshHelmTunnelStepHeading">
                <strong className="dshHelmStepTitle">{t(agentHelmStep.title.key)}</strong>
                {configurationReady ? <span className="dshHelmTunnelStepState"><StateDot state={dotState('ready')} size={7} /><span>{t(stateKey('ready'))}</span></span> : null}
              </div>
              <p className="dshHelmDetailsText">{t(agentHelmStep.description.key)}</p>

              <div className="dshHelmField">
                <span className="dshHelmFieldLabel">{t(agentHelmStep.fields[0].label.key)} <TunnelInfo label={t(agentHelmStep.fields[0].description.key)} /></span>
                <div className="dshHelmFieldControl">
                  <input className="dshHelmInput" value={tunnelId} onChange={(event) => onTunnelIdChange(event.currentTarget.value)} autoComplete="off" spellCheck={false} />
                  <button type="button" className="dshHelmExternalLink" onClick={() => onOpenUrl(agentHelmStep.fields[0].helpLink.href)}>{t('fieldGet')} <span aria-hidden="true">↗</span></button>
                </div>
              </div>

              <div className="dshHelmField">
                <span className="dshHelmFieldLabel">{t(agentHelmStep.fields[1].label.key)} <TunnelInfo label={t(agentHelmStep.fields[1].description.key)} /></span>
                <div className="dshHelmFieldControl">
                  <input className="dshHelmInput" type="password" value={runtimeApiKey} placeholder={tunnel.apiKeyConfigured ? t(agentHelmStep.fields[1].savedPlaceholder.key) : undefined} onChange={(event) => onRuntimeApiKeyChange(event.currentTarget.value)} autoComplete="new-password" spellCheck={false} />
                  <button type="button" className="dshHelmExternalLink" onClick={() => onOpenUrl(agentHelmStep.fields[1].helpLink.href)}>{t('fieldGet')} <span aria-hidden="true">↗</span></button>
                </div>
              </div>

              <div className="dshHelmField">
                <span className="dshHelmFieldLabel">{t(agentHelmStep.fields[2].label.key)} <TunnelInfo label={t(agentHelmStep.fields[2].description.key)} /></span>
                <div className="dshHelmFieldControl" data-size="compact">
                  <input className="dshHelmInput" value={organizationId} onChange={(event) => onOrganizationIdChange(event.currentTarget.value)} autoComplete="off" spellCheck={false} />
                  <button type="button" className="dshHelmExternalLink" onClick={() => onOpenUrl(agentHelmStep.fields[2].helpLink.href)}>{t('fieldGet')} <span aria-hidden="true">↗</span></button>
                </div>
              </div>

              <div className="dshHelmField">
                <span className="dshHelmFieldLabel">{t(agentHelmStep.fields[3].label.key)} <TunnelInfo label={t(agentHelmStep.fields[3].description.key)} />{tunnel.proxyConfigured ? <span className="dshHelmFieldState">{t('configuredStatus')}</span> : null}</span>
                <div className="dshHelmFieldControl" data-size="proxy"><input className="dshHelmInput" value={proxyUrl} placeholder={t(agentHelmStep.fields[3].savedPlaceholder.key)} onChange={(event) => onProxyUrlChange(event.currentTarget.value)} autoComplete="off" spellCheck={false} /></div>
              </div>
              <div className="dshHelmActions dshHelmTunnelPrimaryActions">
                <Button variant="primary" size="sm" disabled={pendingSave || pendingInstall || !canSubmit} onClick={onConfigure}>{pendingSave ? t(agentHelmStep.submitting.key) : dependencyMissing ? t(agentHelmStep.saveAction.key) : t(agentHelmStep.submitAction.key)}</Button>
                {dependencyMissing ? (
                  <Button variant="outline" size="sm" disabled={pendingInstall || pendingSave} onClick={onInstallTunnelClient}>{pendingInstall ? t(openAiStep.dependency.installing.key) : t(openAiStep.dependency.installAction.key)}</Button>
                ) : (
                  <Button variant="outline" size="sm" className="dshHelmTunnelInstallState" disabled>{t(openAiStep.dependency.installedAction.key)}</Button>
                )}
              </div>
            </section>
          </div>

          <div className="dshHelmTunnelDialogAside">
            <section className="dshHelmTunnelDialogStep">
              <div className="dshHelmTunnelStepHeading">
                <strong className="dshHelmStepTitle">{t(openAiStep.title.key)}</strong>
              </div>
              <TunnelGuidanceText text={t(openAiStep.description.key)} />
              <div className="dshHelmActions">
                <button type="button" className="dshHelmExternalLink" onClick={() => onOpenUrl(openAiStep.dependency.downloadAction.href)}>{t(openAiStep.dependency.downloadAction.label.key)} <span aria-hidden="true">↗</span></button>
              </div>
            </section>

            <section className="dshHelmTunnelDialogStep">
              <div className="dshHelmTunnelStepHeading">
                <strong className="dshHelmStepTitle">{t(chatGptStep.title.key)}</strong>
              </div>
              <TunnelGuidanceText text={t(chatGptStep.description.key)} />
              <div className="dshHelmActions">
                <button type="button" className="dshHelmExternalLink" onClick={() => onOpenUrl(chatGptStep.links[0].href)}>{t(chatGptStep.links[0].label.key)} <span aria-hidden="true">↗</span></button>
                <button type="button" className="dshHelmExternalLink" onClick={() => onOpenUrl(chatGptStep.links[1].href)}>{t(chatGptStep.links[1].label.key)} <span aria-hidden="true">↗</span></button>
              </div>
            </section>
          </div>
        </div></div>
      </section>
    </div>
  )
}

function CapabilitySummary({ items }: { items: HelmCapabilitySummaryItem[] }): JSX.Element {
  const rootRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [compact, setCompact] = useState(false)
  const itemKey = items.map(({ icon, label }) => `${icon}:${label}`).join('|')

  useLayoutEffect(() => {
    const root = rootRef.current
    const measure = measureRef.current
    if (!root || !measure) return
    const update = () => setCompact(shouldCompactCapabilitySummary(measure.getBoundingClientRect().width, root.clientWidth))
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => observer.disconnect()
  }, [itemKey])

  const renderItems = (keyPrefix: string) => items.map(({ icon, label }) => (
    <span key={`${keyPrefix}:${icon}:${label}`} className="dshHelmCapsItem">
      <span aria-hidden="true">{icon}</span>
      <span className="dshHelmCapsItemLabel">{label}</span>
    </span>
  ))
  return (
    <span ref={rootRef} className="dshHelmCapsInline" data-compact={compact || undefined} aria-hidden="true">
      {renderItems('visible')}
      <span ref={measureRef} className="dshHelmCapsMeasure">{renderItems('measure')}</span>
    </span>
  )
}

function StatusRow({ name, nameExtra, description, management = false, toggleOnName = true, state, onNameClick, onToggle, onIssueClick, wholeRow = false, expanded = false, details, detailsId, detailsClassName, control, issue, t }: { name: string; nameExtra?: JSX.Element; description?: string | undefined; management?: boolean; toggleOnName?: boolean; state: HelmUiRuntimeState; onNameClick?: (() => void) | undefined; onToggle?: (() => void) | undefined; onIssueClick?: (() => void) | undefined; wholeRow?: boolean; expanded?: boolean; details?: JSX.Element | undefined; detailsId?: string | undefined; detailsClassName?: string; control?: JSX.Element; issue?: HelmIssue | undefined; t: HelmTranslate }): JSX.Element {
  const expandable = Boolean(onToggle && details)
  const rowInteractive = Boolean(wholeRow && onToggle)
  const nameClick = onNameClick ?? (toggleOnName && expandable ? onToggle : undefined)
  const rowProps = rowInteractive
    ? {
        role: 'button' as const,
        tabIndex: 0,
        ...(expandable ? { 'aria-expanded': expanded, 'aria-controls': detailsId } : {}),
        onClick: onToggle,
        onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle?.()
          }
        },
      }
    : {}
  const onNameButtonClick = nameClick
    ? (event: ReactMouseEvent<HTMLButtonElement>) => {
        if (rowInteractive) event.stopPropagation()
        nameClick()
      }
    : undefined
  return (
    <>
      <div className={`dshHelmRow${rowInteractive ? ' dshHelmCapabilityRow' : ''}`} {...rowProps}>
        <span className="dshHelmNameArea">
        {description ? (
          <Tooltip label={description} side="top" delayMs={0} maxWidth={260}>
            <span className="dshHelmTooltipTarget" tabIndex={0}>
              {nameClick ? <Button variant="ghost" size="sm" className="dshHelmNameButton" data-management={management || undefined} aria-expanded={!onNameClick && expandable ? expanded : undefined} aria-controls={!onNameClick && expandable ? detailsId : undefined} onClick={onNameButtonClick}>{name}</Button> : <span className="dshHelmName">{name}</span>}
            </span>
          </Tooltip>
        ) : nameClick ? (
          <Button variant="ghost" size="sm" className="dshHelmNameButton" aria-expanded={!onNameClick && expandable ? expanded : undefined} aria-controls={!onNameClick && expandable ? detailsId : undefined} onClick={onNameButtonClick}>{name}</Button>
        ) : (
          <span className="dshHelmName">{name}</span>
        )}
          {nameExtra}
          {issue ? <StatusIssue issue={issue} expanded={expanded} onClick={onIssueClick ?? (expandable ? onToggle : undefined)} /> : null}
        </span>
        {control ?? (
          <span className="dshHelmState" data-state={state} role="img" aria-label={t(stateKey(state))}>
            <StateDot state={dotState(state)} size={8} />
          </span>
        )}
      </div>
      {expandable && expanded ? <div id={detailsId} className={detailsClassName ?? 'dshHelmDetails'}>{details}</div> : null}
    </>
  )
}

function StatusSwitch({ enabled, disabled, label, onChange }: { enabled: boolean; disabled?: boolean; label: string; onChange: (enabled: boolean) => void }): JSX.Element {
  return (
    <button
      type="button"
      className="dshHelmSwitch"
      data-on={enabled}
      aria-label={label}
      aria-pressed={enabled}
      disabled={disabled}
      onClick={(event) => { event.stopPropagation(); onChange(!enabled) }}
    >
      <span className="dshHelmSwitchTrack" data-on={enabled} aria-hidden="true">
        <span className="dshHelmSwitchThumb" />
      </span>
    </button>
  )
}

export function ChatGPTHelmApp({ wide, t, adapter, initiallyOpen = false }: ChatGPTHelmAppProps): JSX.Element {
  const [open, setOpen] = useState(initiallyOpen)
  const [status, setStatus] = useState<HelmUiStatus | undefined>()
  const [error, setError] = useState<{ target: 'status' | HelmUpdateTarget | 'codeRead' | 'codeWrite' | 'agentDelegation' | 'serena' | 'tunnelClient'; detail: string }>()
  const [pendingTarget, setPendingTarget] = useState<HelmUpdateTarget>()
  const [pendingInstall, setPendingInstall] = useState<HelmUiDependencyName>()
  const [confirmCoreOff, setConfirmCoreOff] = useState(false)
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [expandedRow, setExpandedRow] = useState<'capabilities' | 'codeSense' | undefined>()
  const [tunnelPanelOpen, setTunnelPanelOpen] = useState(false)
  const [tunnelId, setTunnelId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [runtimeApiKey, setRuntimeApiKey] = useState('')
  const [proxyUrl, setProxyUrl] = useState('')
  const tunnelOnboardingAutoOpened = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ left: number; bottom: number; width: number }>()

  const refresh = useCallback(async () => {
    try {
      setStatus(await adapter.getStatus())
      setError((current) => current?.target === 'status' ? undefined : current)
    } catch (cause) {
      setStatus(undefined)
      setError({ target: 'status', detail: requestErrorDetail(cause, t) })
    }
  }, [adapter, t])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8, width: Math.round(rect.width) })
    }
    place()
    window.addEventListener('resize', place)
    const root = rootRef.current
    const observer = typeof ResizeObserver === 'undefined' || !root
      ? undefined
      : new ResizeObserver(place)
    if (observer && root) observer.observe(root)
    return () => {
      window.removeEventListener('resize', place)
      observer?.disconnect()
    }
  }, [open, wide])

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined
    const poll = async () => {
      await refresh()
      if (!cancelled) timer = window.setTimeout(() => { void poll() }, 5000)
    }
    void poll()
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [refresh])

  useEffect(() => {
    if (!status || status.tunnel.state !== 'missing-config' || tunnelOnboardingAutoOpened.current) return
    tunnelOnboardingAutoOpened.current = true
    setTunnelId(status.tunnel.tunnelId ?? '')
    setOrganizationId(status.tunnel.organizationId ?? '')
    setRuntimeApiKey('')
    setProxyUrl(status?.tunnel.proxyUrl ?? '')
    setOpen(false)
    setTunnelPanelOpen(true)
  }, [status?.tunnel.organizationId, status?.tunnel.proxyUrl, status?.tunnel.state, status?.tunnel.tunnelId])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && !rootRef.current?.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openUrl = (url: string | undefined) => {
    if (url) adapter.openUrl(url)
  }

  const installDependency = async (dependency: HelmUiDependencyName) => {
    setPendingInstall(dependency)
    try {
      setStatus(await adapter.installDependency(dependency))
      setError(undefined)
    } catch (cause) {
      setError({ target: dependency, detail: requestErrorDetail(cause, t) })
    } finally {
      setPendingInstall(undefined)
    }
  }

  const setEnabled = async (target: 'core' | 'localMcp', enabled: boolean) => {
    setPendingTarget(target)
    try {
      const next = target === 'core'
        ? await adapter.setCoreEnabled(enabled)
        : await adapter.setLocalMcpEnabled(enabled)
      setStatus(next)
      setError(undefined)
      setConfirmCoreOff(false)
    } catch (cause) {
      setError({ target, detail: requestErrorDetail(cause, t) })
    } finally {
      setPendingTarget(undefined)
    }
  }

  const setExternalAgentLspEnabled = async (enabled: boolean) => {
    setPendingTarget('externalAgentLsp')
    try {
      setStatus(await adapter.setExternalAgentLspEnabled(enabled))
      setError(undefined)
    } catch (cause) {
      setError({ target: 'externalAgentLsp', detail: requestErrorDetail(cause, t) })
    } finally {
      setPendingTarget(undefined)
    }
  }

  const setExternalUserAccess = async (capability: HelmExternalCapability, enabled: boolean) => {
    setPendingTarget('externalAccess')
    try {
      setStatus(await adapter.setExternalUserAccess(capability, enabled))
      setError(undefined)
    } catch (cause) {
      setError({ target: 'externalAccess', detail: requestErrorDetail(cause, t) })
    } finally {
      setPendingTarget(undefined)
    }
  }

  const openTunnelPanel = () => {
    setTunnelId(status?.tunnel.tunnelId ?? '')
    setOrganizationId(status?.tunnel.organizationId ?? '')
    setRuntimeApiKey('')
    setProxyUrl(status?.tunnel.proxyUrl ?? '')
    setOpen(false)
    setTunnelPanelOpen(true)
  }

  const configureTunnel = async () => {
    setPendingTarget('tunnelSetup')
    const input: TunnelSetupValues = {
      tunnelId,
      ...(organizationId.trim() ? { organizationId } : {}),
      ...(runtimeApiKey.trim() ? { apiKey: runtimeApiKey } : {}),
      proxyUrl,
    }
    try {
      const next = await adapter.configureTunnel(input)
      setStatus(next)
      setRuntimeApiKey('')
      setProxyUrl(next.tunnel.proxyUrl ?? '')
      setError(undefined)
    } catch (cause) {
      if (isHelmUiRequestError(cause) && cause.recoveredStatus) setStatus(cause.recoveredStatus)
      setError({ target: 'tunnelSetup', detail: requestErrorDetail(cause, t) })
    } finally {
      setPendingTarget(undefined)
    }
  }

  const toggleRow = (row: 'capabilities' | 'codeSense') => {
    setExpandedRow((current) => current === row ? undefined : row)
  }
  const tunnelManagementUrl = status?.tunnel.state === 'running' ? status.tunnel.adminUrl : undefined
  const tunnelActionError = error?.target === 'tunnelClient' || error?.target === 'tunnelSetup' ? error : undefined
  const tunnelIssue = Boolean(status && (tunnelActionError || status.dependencies.tunnelClient.state === 'unavailable' || status.tunnel.state === 'missing-config' || status.tunnel.state === 'stopped'))
  const tunnelIssueDetail = tunnelActionError?.detail ?? status?.tunnel.error?.message ?? (status?.tunnel.missingEnvironment?.length ? t('tunnelConfigDetails', { names: status.tunnel.missingEnvironment.join(', ') }) : undefined)
  const tunnelIssueInfo: HelmIssue | undefined = tunnelIssue
    ? {
        title: tunnelActionError?.target === 'tunnelClient' ? t('statusReadIssue') : tunnelActionError?.target === 'tunnelSetup' ? t('settingUpdateIssue') : status?.dependencies.tunnelClient.state === 'unavailable' ? t('tunnelDependencyIssue') : status?.tunnel.state === 'missing-config' ? t('tunnelConfigIssue') : t('tunnelStoppedIssue'),
        ...(tunnelIssueDetail ? { detail: tunnelIssueDetail } : {}),
      }
    : undefined
  const effectivePolicy = status?.effectiveExternalAccess ?? { enabled: false, mutations: false, delegation: false }
  const configuredPolicy = status?.externalUserAccess ?? { enabled: false, mutations: false, delegation: false }
  const codeSenseState: HelmUiRuntimeState = !status
    ? 'unavailable'
    : status.dependencies.serena.state === 'unavailable'
      ? 'unavailable'
      : status.dependencies.serena.state === 'ready' || status.dependencies.serena.state === 'running'
        ? 'running'
        : 'stopped'
  const needsAttention = statusNeedsAttention(status, Boolean(error))
  const capabilityDefinitions = {
    understand: getHelmCapabilityDefinition('understand'),
    coding: getHelmCapabilityDefinition('coding'),
    command: getHelmCapabilityDefinition('command'),
  }
  const capabilitySummaryItems = deriveHelmCapabilitySummary({
    understand: effectivePolicy.enabled,
    coding: effectivePolicy.mutations,
    command: effectivePolicy.delegation,
  }).map(({ icon, labelKey }) => ({ icon, label: t(labelKey) }))
  const capabilityTriggerIcons = capabilitySummaryItems.map(({ icon, label }) => <span key={label}>{icon}</span>)
  const globalStatusIssue = error?.target === 'status'
    ? `${t('statusReadIssue')}：${error.detail}`
    : undefined
  const attentionTitle = globalStatusIssue ?? (tunnelIssueInfo
    ? tunnelIssueInfo.detail ? `${tunnelIssueInfo.title}：${tunnelIssueInfo.detail}` : tunnelIssueInfo.title
    : t('needsAttention'))

  return (
    <div ref={rootRef} className="dshHelmLayer" data-rail={!wide || undefined}>
      {open && anchor && (
        <section className="dshHelmPanel" style={anchor} aria-label={t('status')}>
          <div className="dshHelmBody">
            {!status && !error && <p className="dshHelmLoading">{t('loading')}</p>}
            {!status && error?.target === 'status' ? (
              <>
                <StatusRow
                  name={t('core')}
                  description={t('coreDescription')}
                  state="unavailable"
                  t={t}
                  issue={{ title: t('coreIssue'), detail: error.detail }}
                />
                <div className="dshHelmDetails">
                  <p className="dshHelmDetailsText" data-error="true">{error.detail}</p>
                </div>
              </>
            ) : null}
            {status && (
              <>
                <StatusRow
                  name={t('capabilityGroup')}
                  nameExtra={<CapabilitySummary items={capabilitySummaryItems} />}
                  state={effectivePolicy.enabled || effectivePolicy.mutations || effectivePolicy.delegation ? 'running' : 'stopped'}
                  t={t}
                  wholeRow
                  toggleOnName={false}
                  onToggle={() => toggleRow('capabilities')}
                  expanded={expandedRow === 'capabilities'}
                  detailsId="dshHelmCapabilityDetails"
                  detailsClassName="dshHelmGroupBody"
                  details={(
                    <>
                      {!configuredPolicy.enabled ? (
                        <div className="dshHelmSubRow"><span className="dshHelmSubName">{t('accessRevoked')}</span></div>
                      ) : null}
                      <div className="dshHelmSubRow">
                        <span className="dshHelmSubName"><span className="dshHelmSubIcon" aria-hidden="true">{capabilityDefinitions.understand.icon}</span>{t(capabilityDefinitions.understand.labelKey)}</span>
                        <StatusSwitch enabled={configuredPolicy.enabled} disabled={pendingTarget !== undefined} label={t('toggleCodeRead')} onChange={(enabled) => { void setExternalUserAccess('enabled', enabled) }} />
                      </div>
                      <div className="dshHelmSubRow">
                        <span className="dshHelmSubName"><span className="dshHelmSubIcon" aria-hidden="true">{capabilityDefinitions.coding.icon}</span>{t(capabilityDefinitions.coding.labelKey)}</span>
                        <StatusSwitch enabled={configuredPolicy.mutations} disabled={pendingTarget !== undefined} label={t('toggleCodeWrite')} onChange={(enabled) => { void setExternalUserAccess('mutations', enabled) }} />
                      </div>
                      <div className="dshHelmSubRow">
                        <span className="dshHelmSubName"><span className="dshHelmSubIcon" aria-hidden="true">{capabilityDefinitions.command.icon}</span>{t(capabilityDefinitions.command.labelKey)}</span>
                        <StatusSwitch enabled={configuredPolicy.delegation} disabled={pendingTarget !== undefined} label={t('toggleAgentDelegation')} onChange={(enabled) => { void setExternalUserAccess('delegation', enabled) }} />
                      </div>
                    </>
                  )}
                  control={<ExpandChevron expanded={expandedRow === 'capabilities'} />}

                />
                <StatusRow
                  name={t('codeSense')}
                  nameExtra={<span className="dshHelmInlineState" role="img" aria-label={t(stateKey(codeSenseState))}><StateDot state={dotState(codeSenseState)} size={8} /></span>}
                  description={t('codeSenseDescription')}
                  state={codeSenseState}
                  t={t}
                  wholeRow
                  toggleOnName={false}
                  onToggle={() => toggleRow('codeSense')}
                  expanded={expandedRow === 'codeSense'}
                  detailsId="dshHelmCodeSenseDetails"
                  detailsClassName="dshHelmGroupBody"
                  details={(
                    <>
                      <div className="dshHelmSubRow">
                        <span className="dshHelmSubName">{t('externalAgentLsp')}</span>
                        <StatusSwitch
                          enabled={status.externalAgentLsp.enabled}
                          disabled={status.core.state !== 'running' || !status.externalAgentLsp.configurable || pendingTarget !== undefined}
                          label={t('toggleExternalAgentLsp')}
                          onChange={(enabled) => { void setExternalAgentLspEnabled(enabled) }}
                        />
                      </div>
                      <div className="dshHelmSubRow">
                        <span className="dshHelmSubName">{t('localMcp')}</span>
                        <StatusSwitch
                          enabled={status.localMcp.state === 'running'}
                          disabled={status.core.state !== 'running' || pendingTarget !== undefined}
                          label={t('toggleLocalMcp')}
                          onChange={(enabled) => { void setEnabled('localMcp', enabled) }}
                        />
                      </div>
                      {error?.target === 'serena' || error?.target === 'localMcp' || error?.target === 'externalAgentLsp' || status.dependencies.serena.state === 'unavailable' || status.localMcp.state === 'unavailable' || status.localMcp.message ? (
                        <div className="dshHelmDetails">
                          {error?.target === 'serena' || error?.target === 'localMcp' || error?.target === 'externalAgentLsp' ? <p className="dshHelmDetailsText dshHelmOperationError" data-error="true">{error.detail}</p> : null}
                          {status.dependencies.serena.state === 'unavailable' ? (
                            <>
                              <p className="dshHelmDetailsText" data-error="true">{status.dependencies.serena.installCommand ? t('serenaInstallDescription') : t('serenaManualDescription')}</p>
                              {status.dependencies.serena.installCommand ? <InstallCommand command={status.dependencies.serena.installCommand} /> : null}
                              <div className="dshHelmActions">
                                {status.dependencies.serena.installCommand ? (
                                  <Button variant="primary" size="sm" disabled={pendingInstall !== undefined} onClick={() => { void installDependency('serena') }}>{pendingInstall === 'serena' ? t('installing') : t('install')}</Button>
                                ) : null}
                                {status.dependencies.serena.installUrl ? <Button variant={status.dependencies.serena.installCommand ? 'outline' : 'primary'} size="sm" onClick={() => openUrl(status.dependencies.serena.installUrl)}>{status.dependencies.serena.installCommand ? t('manualSetup') : t('goInstall')}</Button> : null}
                              </div>
                            </>
                          ) : null}
                          {status.dependencies.serena.state !== 'unavailable' && (status.localMcp.state === 'unavailable' || status.localMcp.message) ? <p className="dshHelmDetailsText" data-error="true">{status.localMcp.message ?? t('localMcpIssueDetails')}</p> : null}
                        </div>
                      ) : null}
                    </>
                  )}
                  control={<ExpandChevron expanded={expandedRow === 'codeSense'} />}
                  issue={error?.target === 'serena'
                    ? { title: t('serenaDependencyIssue'), detail: error.detail }
                    : error?.target === 'externalAgentLsp' || error?.target === 'localMcp'
                      ? { title: t('settingUpdateIssue'), detail: error.detail }
                      : status.dependencies.serena.state === 'unavailable'
                        ? { title: t('serenaDependencyIssue'), detail: status.dependencies.serena.installCommand ? t('serenaInstallDescription') : t('serenaManualDescription') }
                        : status.localMcp.message || status.localMcp.state === 'unavailable'
                          ? { title: t('localMcpIssue'), detail: t('localMcpIssueDetails') }
                          : undefined}
                />
                      <StatusRow
                        name={t('tunnel')}
                        nameExtra={<span className="dshHelmInlineState" role="img" aria-label={t(stateKey(status.tunnel.state))}><StateDot state={dotState(status.tunnel.state)} size={8} /></span>}
                        description={tunnelManagementUrl ? t('tunnelManagementDescription') : undefined}
                        management={Boolean(tunnelManagementUrl)}
                        wholeRow
                        toggleOnName={false}
                        state={status.tunnel.state}
                        t={t}
                        onNameClick={tunnelManagementUrl ? () => openUrl(tunnelManagementUrl) : undefined}
                        onToggle={openTunnelPanel}
                        onIssueClick={openTunnelPanel}
                        control={(
                          <span className="dshHelmTunnelControl">
                            <Tooltip label={t(tunnelOnboardingSource.title.key)} side="top" delayMs={0} maxWidth={220}>
                              <button type="button" className="dshHelmTunnelConfig" aria-label={t(tunnelOnboardingSource.title.key)} aria-expanded={tunnelPanelOpen} aria-controls="dshHelmTunnelSetupDialog" onClick={(event) => { event.stopPropagation(); openTunnelPanel() }}>
                                <IconChevronRightOutline14 />
                              </button>
                            </Tooltip>
                          </span>
                        )}
                        issue={tunnelIssueInfo}
                      />
                <button type="button" className="dshHelmRow dshHelmSessionEntry" onClick={() => { setOpen(false); setSessionPanelOpen(true) }}>
                  <span className="dshHelmSessionEntryTitle">{t('sessionActivityEntry')}</span>
                  <span className="dshHelmSessionEntryArrow" aria-hidden="true"><IconChevronRightOutline14 /></span>
                </button>
                <div className="dshHelmCoreArea">
                  <StatusRow
                    name={t('core')}
                    description={t('coreDescription')}
                    state={status.core.state}
                    t={t}
                    control={(
                      <StatusSwitch
                        enabled={status.core.enabled ?? status.core.state === 'running'}
                        disabled={status.core.configurable === false || status.core.state === 'unavailable' || pendingTarget !== undefined}
                        label={t('toggleCore')}
                        onChange={(enabled) => {
                          if (!enabled) setConfirmCoreOff(true)
                          else void setEnabled('core', true)
                        }}
                      />
                    )}
                    issue={error?.target === 'core'
                      ? { title: t('settingUpdateIssue'), detail: error.detail }
                      : status.core.message || status.core.state === 'unavailable'
                        ? { title: t('coreIssue'), detail: status.core.message ?? t('coreIssueDetails') }
                        : undefined}
                  />
                  {confirmCoreOff ? (
                    <div className="dshHelmConfirm" role="alertdialog" aria-label={t('confirmCoreShutdown')}>
                      <p className="dshHelmConfirmText">{t('coreShutdownWarning')}</p>
                      <div className="dshHelmConfirmActions">
                        <Button variant="outline" size="sm" onClick={() => setConfirmCoreOff(false)}>{t('cancel')}</Button>
                        <Button variant="primary" size="sm" onClick={() => { setConfirmCoreOff(false); void setEnabled('core', false) }}>{t('confirmShutdown')}</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      )}
      {sessionPanelOpen ? (
        <SessionActivityPanel
          adapter={adapter}
          onClose={() => setSessionPanelOpen(false)}
          labels={{
            panelTitle: t('sessionPanelTitle'), close: t('sessionClose'), sessionList: t('sessionList'), sessionCount: t('sessionCount'), allWorkspaces: t('sessionAllWorkspaces'),
            all: t('sessionAll'), chatgpt: t('sessionChatGPT'), subagent: t('sessionSubagent'), recentActivity: t('sessionRecentActivity'),
            activities: t('sessionActivities'), chats: t('sessionChats'), workspace: t('sessionWorkspace'), created: t('sessionCreated'), updated: t('sessionUpdated'),
            chatSessions: t('sessionChatSessions'), viewChats: t('sessionViewChats'), originChat: t('sessionOriginChat'), boundChats: t('sessionBoundChats'),
            workContext: t('sessionWorkContext'), task: t('sessionTaskContext'), boundAt: t('sessionBoundAt'), unboundContext: t('sessionUnboundContext'),
            openChat: t('sessionOpenChat'), sessionId: t('sessionIdValue'), copyId: t('sessionCopyId'), copied: t('sessionCopied'), refresh: t('sessionRefresh'), loadMore: t('sessionLoadMore'), actionGeneric: t('sessionAction'), actionRead: t('sessionActionRead'), actionSearch: t('sessionActionSearch'),
            actionInspect: t('sessionActionInspect'), actionDiagnostic: t('sessionActionDiagnostic'), actionEdit: t('sessionActionEdit'), actionVerify: t('sessionActionVerify'), actionCommand: t('sessionActionCommand'),
            statusSuccess: t('sessionStatusSuccess'), statusError: t('sessionStatusError'), delegationCreated: t('sessionDelegationCreated'),
            delegationAttached: t('sessionDelegationAttached'), delegationPrompted: t('sessionDelegationPrompted'), delegationResumed: t('sessionDelegationResumed'),
            delegationStatus: t('sessionDelegationStatus'), statusIdle: t('sessionStatusIdle'), statusRunning: t('sessionStatusRunningAgent'), statusWaiting: t('sessionStatusWaiting'),
            statusFailed: t('sessionStatusFailedAgent'), statusCancelled: t('sessionStatusCancelled'), statusUnknown: t('sessionStatusUnknown'), fullTask: t('sessionFullTask'), followUpPrompts: t('sessionFollowUpPrompts'),
            subagentSessionId: t('sessionSubagentId'), noSessions: t('sessionNone'), noTimeline: t('sessionNoTimeline'), loading: t('sessionLoading'),
            loadError: t('sessionLoadError'), unassignedWorkspace: t('sessionUnassignedWorkspace'),
          }}
        />
      ) : null}
      {tunnelPanelOpen && status ? (
        <TunnelSetupDialog
          status={status}
          tunnelId={tunnelId}
          organizationId={organizationId}
          runtimeApiKey={runtimeApiKey}
          proxyUrl={proxyUrl}
          requestError={error?.target === 'tunnelClient' || error?.target === 'tunnelSetup' ? error.detail : undefined}
          pendingInstall={pendingInstall === 'tunnelClient'}
          pendingSave={pendingTarget === 'tunnelSetup'}
          t={t}
          onTunnelIdChange={setTunnelId}
          onOrganizationIdChange={setOrganizationId}
          onRuntimeApiKeyChange={setRuntimeApiKey}
          onProxyUrlChange={setProxyUrl}
          onInstallTunnelClient={() => { void installDependency('tunnelClient') }}
          onConfigure={() => { void configureTunnel() }}
          onOpenUrl={(url) => openUrl(url)}
          onClose={() => setTunnelPanelOpen(false)}
        />
      ) : null}
      <button
        type="button"
        className="dshHelmTrigger"
        aria-label={needsAttention ? `${t('trigger')}：${attentionTitle}` : t('trigger')}
        aria-expanded={open}
        title={wide ? undefined : t('trigger')}
        onClick={() => setOpen((value) => !value)}
      >
        <IconCodeOutline16 className="dshHelmIcon" />
        {wide ? <span className="dshHelmLabel">{t('trigger')}</span> : null}
        {wide ? (
          <span className="dshHelmTriggerCaps" aria-hidden="true">
            {capabilityTriggerIcons}
          </span>
        ) : null}
        {needsAttention ? <span className="dshHelmTriggerIssue" title={attentionTitle}><IconWarningOutline16 /></span> : null}
      </button>
    </div>
  )
}


/** Backward-compatible component name; both hosts mount ChatGPTHelmApp. */
export const HelmPanel = ChatGPTHelmApp
