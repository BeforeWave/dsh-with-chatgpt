import * as React from 'react'

/** Presentation-only Agent identity: native icon when available, initials otherwise. */
export function agentInitials(name: string): string {
  const words = name.trim().split(/[\s_-]+/u).filter(Boolean)
  if (!words.length) return '?'
  if (words.length > 1) return words.slice(0, 2).map((word) => word[0] ?? '').join('').toUpperCase()
  const word = words[0] ?? ''
  if (word.length <= 3) return word.toUpperCase()
  const camel = word.slice(1).match(/[A-Z]/gu)
  return camel?.length ? (word[0] + camel[0]).toUpperCase() : word.slice(0, 2).toUpperCase()
}

export function AgentIdentityIcon({ name, iconDataUrl }: { name: string; iconDataUrl?: string }): React.JSX.Element {
  const [failedSrc, setFailedSrc] = React.useState<string>()
  const src = iconDataUrl?.startsWith('data:image/png;base64,') ? iconDataUrl : undefined
  return src && src !== failedSrc ? (
    <img src={src} alt="" width={18} height={18} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setFailedSrc(src)} />
  ) : (
    <span aria-hidden="true" style={{
      boxSizing: 'border-box', display: 'inline-flex', width: '100%', height: '100%',
      alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(128,128,128,.28)', borderRadius: 6,
      background: 'transparent', fontSize: agentInitials(name).length > 2 ? 9 : 10,
      fontWeight: 750, lineHeight: 1, letterSpacing: '-.03em',
    }}>{agentInitials(name)}</span>
  )
}
