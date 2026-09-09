import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createHelmTranslate, resolveHelmLocale, type HelmLocale } from './locale.js'
import { ChatGPTHelmApp, installHelmStyles } from './app.js'
import { createHttpHelmUiAdapter } from './adapter.js'
import { installSessionActivityStyles } from './components/session-activity.js'
import './standalone.css'

const standaloneAccessToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? undefined
const standaloneAdapter = createHttpHelmUiAdapter('', standaloneAccessToken)
type StandaloneTheme = 'light' | 'dark'

function initialLocale(): HelmLocale {
  const value = new URLSearchParams(window.location.search).get('locale')
  return value === 'zh' || value === 'en' ? value : resolveHelmLocale(navigator.language)
}

function initialTheme(): StandaloneTheme {
  return new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light'
}

function StandaloneApp(): JSX.Element {
  const [locale, setLocale] = useState<HelmLocale>(initialLocale)
  const [theme, setTheme] = useState<StandaloneTheme>(initialTheme)
  const t = useMemo(() => createHelmTranslate(locale), [locale])

  useEffect(() => {
    document.body.toggleAttribute('data-ds-dark-theme', theme === 'dark')
    const url = new URL(window.location.href)
    url.searchParams.set('locale', locale)
    url.searchParams.set('theme', theme)
    window.history.replaceState(null, '', url)
  }, [locale, theme])

  return (
    <main className="dshHelmStandalonePage">
      <aside className="dshHelmStandaloneSidebar" aria-label="Agent Helm">
        <div className="dshHelmStandaloneBrand">Agent Helm</div>
        <div className="dshHelmStandaloneControls" aria-label="Standalone preview controls">
          <label>
            <span>{locale === 'zh' ? '语言' : 'Language'}</span>
            <select value={locale} onChange={(event) => setLocale(event.currentTarget.value as HelmLocale)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            <span>{locale === 'zh' ? '主题' : 'Theme'}</span>
            <select value={theme} onChange={(event) => setTheme(event.currentTarget.value as StandaloneTheme)}>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>
        </div>
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
