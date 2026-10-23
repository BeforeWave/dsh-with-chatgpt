import { cloneElement, isValidElement } from 'react'
import type { ButtonHTMLAttributes, ReactElement, ReactNode, SVGProps } from 'react'

// DSH 0.2 no longer ships dsh-client-ui-primitives. Keep these seven small
// controls inside the plugin's existing shared UI so both hosts use the same
// implementation rather than attempting to load DSH 0.1 client modules.
type IconProps = SVGProps<SVGSVGElement>
function Icon({ children, size, ...props }: IconProps & { size?: number; children: ReactNode }): JSX.Element {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 16} height={size ?? 16}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
}

export function IconChevronDownOutline14(props: IconProps): JSX.Element {
  return <Icon size={14} {...props}><path d="m6 9 6 6 6-6" /></Icon>
}
export function IconChevronUpOutline14(props: IconProps): JSX.Element {
  return <Icon size={14} {...props}><path d="m6 15 6-6 6 6" /></Icon>
}
export function IconChevronRightOutline14(props: IconProps): JSX.Element {
  return <Icon size={14} {...props}><path d="m9 6 6 6-6 6" /></Icon>
}
// Preserve the exact DSH 0.1.1-rc.2 IconCodeOutline16 artwork (#), even
// when DSH 0.2 does not ship @deepseek-ai/dsh-client-ui-primitives.
export function IconCodeOutline16({ width = 16, height = 16, ...props }: IconProps): JSX.Element {
  return <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height}
    viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M12.3368 1.53569L11.931 4.43172H14.8086V5.79673H11.7404L11.1962 9.67859H14.2839V11.0436H11.0056L10.4994 14.6529L9.14873 14.4643L9.62731 11.0436H5.75876L5.25252 14.6529L3.90186 14.4643L4.38043 11.0436H1.69141V9.67859H4.57104L5.11417 5.79673H2.21609V4.43172H5.30581L5.73724 1.34713L7.08995 1.53569L6.68414 4.43172H10.5527L10.9841 1.34713L12.3368 1.53569ZM5.94937 9.67859H9.81791L10.361 5.79673H6.49353L5.94937 9.67859Z"
      fill="currentColor" />
  </svg>
}
export function IconWarningOutline16(props: IconProps): JSX.Element {
  return <Icon size={16} {...props}><path d="M10.3 4 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01" /></Icon>
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm'
}
export function Button({ variant = 'ghost', size: _size, style, type = 'button', ...props }: ButtonProps): JSX.Element {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 28,
    padding: '4px 10px',
    borderRadius: 6,
    font: 'inherit',
    fontSize: 12,
    lineHeight: '18px',
    cursor: props.disabled ? 'default' : 'pointer',
    opacity: props.disabled ? 0.55 : 1,
  } as const
  const themes = {
    primary: { color: 'var(--dsw-alias-label-on-brand, white)', background: 'var(--dsw-alias-state-business-primary, #276cf6)', border: '1px solid transparent' },
    outline: { color: 'var(--dsw-alias-label-primary)', background: 'transparent', border: '1px solid var(--dsw-alias-border-l3, #888)' },
    ghost: { color: 'var(--dsw-alias-label-primary)', background: 'transparent', border: '1px solid transparent' },
  } as const
  return <button type={type} style={{ ...base, ...themes[variant], ...style }} {...props} />
}

export function StateDot({ state, size = 8 }: { state: 'done' | 'warning' | 'error'; size?: number }): JSX.Element {
  const color = {
    done: 'var(--dsw-alias-state-success-primary, #329b69)',
    warning: 'var(--dsw-alias-state-warning-primary, #e3a728)',
    error: 'var(--dsw-alias-state-error-primary, #dd4b4b)',
  }[state]
  return <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', flex: 'none', display: 'inline-block', backgroundColor: color }} />
}

export function Tooltip({ label, children }: { label: string; children: ReactNode; side?: string; delayMs?: number; maxWidth?: number }): JSX.Element {
  if (isValidElement(children)) return cloneElement(children as ReactElement<{ title?: string }>, { title: label })
  return <span title={label}>{children}</span>
}
