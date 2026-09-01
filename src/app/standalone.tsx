import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { createHelmTranslate, resolveHelmLocale } from './locale.js'
import { ChatGPTHelmApp, installHelmStyles } from './app.js'
import { createHttpHelmUiAdapter } from './adapter.js'
import { installSessionActivityStyles } from './components/session-activity.js'
import './standalone.css'

const standaloneAccessToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? undefined
const standaloneAdapter = createHttpHelmUiAdapter('', standaloneAccessToken)

function StandaloneApp(): JSX.Element {
  const locale = resolveHelmLocale(navigator.language)
  const t = useMemo(() => createHelmTranslate(locale), [locale])
  return (
    <main className="dshHelmStandalonePage">
      <aside className="dshHelmStandaloneSidebar" aria-label="Agent Helm">
        <div className="dshHelmStandaloneBrand">Agent Helm</div>
        <div className="dshHelmStandaloneSpacer" />
        <ChatGPTHelmApp wide t={t} adapter={standaloneAdapter} />
      </aside>
      <section className="dshHelmStandaloneCanvas" aria-hidden="true" />
    </main>
  )
}

installHelmStyles()
installSessionActivityStyles()

const root = document.getElementById('root')
if (!root) throw new Error('standalone root element was not found')
createRoot(root).render(<StandaloneApp />)
