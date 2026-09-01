declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ComponentType, ReactElement, ReactNode } from 'react'

  export interface DshButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'outline' | 'toolbar'
    size?: 'md' | 'sm'
    icon?: ReactNode
  }

  export interface DshTooltipProps {
    label: ReactNode | (() => ReactNode)
    side?: 'right' | 'top' | 'bottom'
    delayMs?: number
    disabled?: boolean
    maxWidth?: number | string
    children: ReactElement
  }

  export const Button: ComponentType<DshButtonProps>
  export const Tooltip: ComponentType<DshTooltipProps>
  export const StateDot: ComponentType<{ state: 'ongoing' | 'done' | 'warning' | 'error'; size?: number; className?: string }>
  export const IconCodeOutline16: ComponentType<{ size?: number; className?: string }>
  export const IconChevronDownOutline14: ComponentType<{ size?: number; className?: string }>
  export const IconChevronRightOutline14: ComponentType<{ size?: number; className?: string }>
  export const IconChevronUpOutline14: ComponentType<{ size?: number; className?: string }>
  export const IconWarningOutline16: ComponentType<{ size?: number; className?: string }>
}
