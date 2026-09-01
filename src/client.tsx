import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  ChatGPTHelmApp,
  HELM_LOCALE_NS,
  helmUiDictionaries,
  installHelmStyles,
  type HelmLocaleKey,
} from './app/app.js'
import { browserHelmUiAdapter } from './app/adapter.js'
import { installSessionActivityStyles } from './app/components/session-activity.js'

export * from './app/app.js'
export * from './app/adapter.js'
export * from './app/components/session-activity.js'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh.chatgptHelm': HelmLocaleKey
  }
}

type DshChatGPTHelmAppProps = PropsRuntime<'sidebar.footer.action'> & PropsLocale<typeof HELM_LOCALE_NS>

function DshChatGPTHelmApp({ wide, t }: DshChatGPTHelmAppProps): JSX.Element {
  return <ChatGPTHelmApp wide={wide} t={t} adapter={browserHelmUiAdapter} />
}

export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installHelmStyles(), 'dsh-with-chatgpt: styles')
  ctx.effect(() => installSessionActivityStyles(), 'dsh-with-chatgpt: session activity styles')
  ctx.effect(() => ctx.locale.register(HELM_LOCALE_NS, helmUiDictionaries), 'dsh-with-chatgpt: dictionaries')
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'chatgpt-helm',
    locale: HELM_LOCALE_NS,
  }, DshChatGPTHelmApp))
}
