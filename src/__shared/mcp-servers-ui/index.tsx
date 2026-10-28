import React, { useEffect, useRef, useState } from 'react'

export type McpServerItem = {
  id: string
  name: string
  source: string
  sources?: Array<{ source: string; name: string }>
  status: 'discovered' | 'imported' | 'enabled' | 'connected' | 'needs-config' | 'auth-required' | 'unavailable' | 'error'
  issue?: 'missing-env' | 'remote-auth' | 'insecure-http'
  requiredEnv?: string[]
  canConfigureHeaders?: boolean
  canAuthorize?: boolean
  authenticated?: boolean
}

export type McpServersScanResult = {
  servers: McpServerItem[]
  failures: Array<{ source: 'codex' | 'claude'; reason: 'scan_failed' | 'invalid_response' }>
}

export type McpOAuthClientSetup = {
  grantType: 'authorization_code' | 'client_credentials'
  clientId?: string
  clientSecret?: string
  clientMetadataUrl?: string
  scope?: string
}

export type McpServersLabels = {
  myServers: string
  discover: string
  scan: string
  scanFailed: string
  import: string
  loading: string
  empty: string
  notScanned: string
  noneFound: string
  saveEnv: string
  authorize: string
  openAuth: string
  advancedAuth: string
  authAuto: string
  authMetadata: string
  authRegistered: string
  authMachine: string
  oauthClientId: string
  oauthClientSecret: string
  oauthMetadataUrl: string
  oauthScope: string
  oauthSave: string
  httpHeader: string
  httpHeaderName: string
  httpHeaderValue: string
  httpHeaderSave: string
  statuses: Record<McpServerItem['status'], string>
  issues: Record<NonNullable<McpServerItem['issue']>, string>
}

export type McpServersAdapter = {
  list: () => Promise<McpServerItem[]>
  scan: () => Promise<McpServersScanResult>
  importServer: (id: string) => Promise<McpServerItem[]>
  setEnabled: (id: string, enabled: boolean) => Promise<McpServerItem[]>
  configure: (id: string, values: Record<string, string>) => Promise<McpServerItem[]>
  configureHeaders: (id: string, headers: Record<string, string>) => Promise<McpServerItem[]>
  configureOAuth: (id: string, options: McpOAuthClientSetup) => Promise<McpServerItem[]>
  authorize: (id: string) => Promise<{ authorizationUrl?: string }>
}

const STYLE_ID = '@beforewave/agent-helm/mcp-servers-ui'

// Layout and controls belong to one shared implementation. Host theme tokens are
// mapped by small adapters; the component does not import Chrome or DSH CSS.
export const mcpServersUiCss = `
.helm-mcp-manager{box-sizing:border-box;min-width:0;width:100%;max-height:min(55vh,480px);overflow-x:hidden;overflow-y:auto;color:var(--helm-mcp-primary,var(--helm-primary,#25282e));font-family:inherit;font-size:13px;line-height:20px}
.helm-mcp-manager *{box-sizing:border-box}
.helm-mcp-manager .helm-mcp-header{min-height:46px;padding:12px 12px 9px 26px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--helm-mcp-secondary,var(--helm-secondary,#737781));font-size:12px;font-weight:600;line-height:18px}
.helm-mcp-manager .helm-mcp-header strong{font-weight:600}
.helm-mcp-manager .helm-mcp-row{min-width:0;min-height:57px;padding:9px 12px 9px 26px;display:flex;align-items:center;gap:12px;position:relative}
.helm-mcp-manager .helm-mcp-entry{min-width:0;position:relative}
.helm-mcp-manager .helm-mcp-entry::after{content:"";position:absolute;bottom:0;left:26px;right:12px;border-bottom:1px solid var(--helm-mcp-border,var(--helm-border,#e1e3e7));pointer-events:none}
.helm-mcp-manager .helm-mcp-entry:last-child::after{display:none}
.helm-mcp-manager .helm-mcp-entry:hover{background:var(--helm-mcp-hover,var(--helm-hover,#f6f7f9))}
.helm-mcp-manager .helm-mcp-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.helm-mcp-manager .helm-mcp-name{min-width:0;display:block;overflow-wrap:anywhere;font-size:13px;font-weight:600;line-height:19px}
.helm-mcp-manager .helm-mcp-meta{min-width:0;color:var(--helm-mcp-secondary,var(--helm-secondary,#737781));font-size:11px;line-height:17px;overflow-wrap:anywhere}
.helm-mcp-manager .helm-mcp-issue{margin:0 12px 8px 26px;color:var(--helm-mcp-secondary,var(--helm-secondary,#737781));font-size:11px;line-height:17px;overflow-wrap:anywhere}
.helm-mcp-manager .helm-mcp-action{flex:none;min-height:30px;min-width:60px;padding:5px 11px;border:1px solid var(--helm-mcp-border-strong,var(--helm-border-strong,#d4d7dc));border-radius:8px;background:var(--helm-mcp-surface,var(--helm-surface,#fff));color:inherit;font-family:inherit;font-size:12px;line-height:18px;font-weight:500;cursor:pointer}
.helm-mcp-manager .helm-mcp-action:hover:not(:disabled){background:var(--helm-mcp-hover,var(--helm-hover,#f6f7f9))}
.helm-mcp-manager .helm-mcp-action:disabled,.helm-mcp-manager .helm-mcp-switch:disabled{opacity:.45;cursor:default}
.helm-mcp-manager .helm-mcp-action:focus-visible,.helm-mcp-manager .helm-mcp-switch:focus-visible,.helm-mcp-manager .helm-mcp-env-field input:focus-visible{outline:2px solid var(--helm-mcp-accent,var(--helm-business,#526bfa));outline-offset:2px}
.helm-mcp-manager .helm-mcp-switch{width:37px;height:22px;flex:none;padding:2px;border:0;border-radius:999px;background:var(--helm-mcp-switch-off,#b8bfcb);display:inline-flex;justify-content:flex-start;align-items:center;cursor:pointer;transition:background .12s}
.helm-mcp-manager .helm-mcp-switch[aria-checked="true"]{justify-content:flex-end;background:var(--helm-mcp-accent,var(--helm-business,#526bfa))}
.helm-mcp-manager .helm-mcp-switch span{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0002}
.helm-mcp-manager .helm-mcp-empty{min-height:44px;padding:12px 12px 12px 26px;color:var(--helm-mcp-secondary,var(--helm-secondary,#737781));font-size:12px;line-height:18px}
.helm-mcp-manager .helm-mcp-alert{padding:8px 12px 8px 26px;color:var(--helm-mcp-error,#b42335);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.helm-mcp-manager .helm-mcp-env-form{display:flex;flex-direction:column;gap:8px;padding:5px 12px 12px 26px}
.helm-mcp-manager .helm-mcp-env-field{display:grid;grid-template-columns:minmax(75px,1fr) minmax(0,2fr);align-items:center;gap:10px;font-size:11px;line-height:17px}
.helm-mcp-manager .helm-mcp-env-field span{overflow-wrap:anywhere}
.helm-mcp-manager .helm-mcp-env-field input{min-width:0;width:100%;min-height:30px;padding:5px 7px;border:1px solid var(--helm-mcp-border-strong,var(--helm-border-strong,#d4d7dc));border-radius:6px;background:var(--helm-mcp-surface,var(--helm-surface,#fff));color:inherit}
.helm-mcp-manager .helm-mcp-env-form .helm-mcp-action{align-self:flex-end}
.helm-mcp-manager .helm-mcp-oauth-advanced{margin:0 12px 8px 26px;font-size:12px}
.helm-mcp-manager .helm-mcp-oauth-advanced summary{cursor:pointer;color:var(--helm-mcp-secondary,var(--helm-secondary,#737781))}
.helm-mcp-manager .helm-mcp-oauth-advanced .helm-mcp-env-form{padding:8px 0}
.helm-mcp-manager .helm-mcp-oauth-advanced input,.helm-mcp-manager .helm-mcp-oauth-advanced select{min-width:0;width:100%;padding:5px 7px;min-height:30px;border:1px solid var(--helm-mcp-border-strong,var(--helm-border-strong,#d4d7dc));border-radius:6px;background:var(--helm-mcp-surface,var(--helm-surface,#fff));color:inherit}
`

export function installMcpServersUiStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector<HTMLStyleElement>(`style[data-shared-css="${STYLE_ID}"]`)
  if (existing) return () => {}
  const tag = document.createElement('style')
  tag.dataset.sharedCss = STYLE_ID
  tag.textContent = mcpServersUiCss
  document.head.appendChild(tag)
  return () => tag.remove()
}

function active(server: McpServerItem): boolean {
  return server.status === 'enabled' || server.status === 'connected' || server.status === 'unavailable'
}

function McpEnvForm({ names, disabled, save, labels }: {
  names: string[]
  disabled: boolean
  save: (values: Record<string, string>) => Promise<boolean>
  labels: McpServersLabels
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const valid = names.length > 0 && names.every((name) => Boolean(values[name]?.trim()))
  return <form className="helm-mcp-env-form" onSubmit={(event) => {
    event.preventDefault()
    if (!valid || saving || disabled) return
    setSaving(true)
    void save(values).then((ok) => { if (ok) setValues({}) }).finally(() => setSaving(false))
  }}>
    {names.map((name) => <label key={name} className="helm-mcp-env-field">
      <span>{name}</span>
      <input type="password" autoComplete="off" spellCheck={false} maxLength={4096}
        disabled={disabled || saving} value={values[name] ?? ''}
        onChange={(event) => setValues((old) => ({ ...old, [name]: event.target.value }))} />
    </label>)}
    <button type="submit" className="helm-mcp-action" disabled={disabled || saving || !valid}>{labels.saveEnv}</button>
  </form>
}

function McpHeaderForm({ disabled, labels, save }: {
  disabled: boolean
  labels: McpServersLabels
  save: (headers: Record<string, string>) => Promise<boolean>
}) {
  const [name, setName] = useState('Authorization')
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const valid = /^[A-Za-z0-9-]{1,128}$/.test(name)
    && !['host','content-length','connection','transfer-encoding','origin','cookie'].includes(name.toLowerCase())
    && value.length > 0 && value.length <= 4096 && !/[\r\n]/.test(value)
  return <details className="helm-mcp-oauth-advanced">
    <summary>{labels.httpHeader}</summary>
    <form className="helm-mcp-env-form" onSubmit={(event) => {
      event.preventDefault()
      if (!valid || disabled || saving) return
      setSaving(true)
      void save({ [name]: value }).then((ok) => { if (ok) setValue('') }).finally(() => setSaving(false))
    }}>
      <label className="helm-mcp-env-field"><span>{labels.httpHeaderName}</span>
        <input autoComplete="off" spellCheck={false} maxLength={128} disabled={disabled || saving}
          value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="helm-mcp-env-field"><span>{labels.httpHeaderValue}</span>
        <input type="password" autoComplete="off" spellCheck={false} maxLength={4096}
          disabled={disabled || saving} value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <button type="submit" className="helm-mcp-action" disabled={!valid || disabled || saving}>{labels.httpHeaderSave}</button>
    </form>
  </details>
}

function McpOAuthClientForm({ disabled, labels, save }: {
  disabled: boolean
  labels: McpServersLabels
  save: (config: McpOAuthClientSetup) => Promise<boolean>
}) {
  const [mode, setMode] = useState<'auto' | 'cimd' | 'registered' | 'machine'>('auto')
  const [id, setId] = useState('')
  const [secret, setSecret] = useState('')
  const [url, setUrl] = useState('')
  const [scope, setScope] = useState('')
  const [saving, setSaving] = useState(false)
  const valid = mode === 'auto' || mode === 'cimd' && /^https:\/\/[^/]+\/.+/.test(url)
    || mode === 'registered' && Boolean(id.trim()) || mode === 'machine' && Boolean(id.trim() && secret)
  return <details className="helm-mcp-oauth-advanced">
    <summary>{labels.advancedAuth}</summary>
    <form className="helm-mcp-env-form" onSubmit={(event) => {
      event.preventDefault()
      if (!valid || disabled || saving) return
      const config: McpOAuthClientSetup = {
        grantType: mode === 'machine' ? 'client_credentials' : 'authorization_code',
        ...(mode === 'cimd' ? { clientMetadataUrl: url.trim() } : {}),
        ...(mode === 'registered' || mode === 'machine' ? { clientId: id.trim(), ...(secret ? { clientSecret: secret } : {}) } : {}),
        ...(scope.trim() ? { scope: scope.trim() } : {}),
      }
      setSaving(true)
      void save(config).then((ok) => { if (ok) setSecret('') }).finally(() => setSaving(false))
    }}>
      <label className="helm-mcp-env-field"><span>{labels.advancedAuth}</span>
        <select value={mode} disabled={disabled || saving} onChange={(event) => setMode(event.target.value as typeof mode)}>
          <option value="auto">{labels.authAuto}</option>
          <option value="cimd">{labels.authMetadata}</option>
          <option value="registered">{labels.authRegistered}</option>
          <option value="machine">{labels.authMachine}</option>
        </select>
      </label>
      {mode === 'cimd' ? <label className="helm-mcp-env-field"><span>{labels.oauthMetadataUrl}</span>
        <input autoComplete="off" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/client.json" /></label> : null}
      {mode === 'registered' || mode === 'machine' ? <>
        <label className="helm-mcp-env-field"><span>{labels.oauthClientId}</span>
          <input autoComplete="off" value={id} onChange={(event) => setId(event.target.value)} /></label>
        <label className="helm-mcp-env-field"><span>{labels.oauthClientSecret}</span>
          <input type="password" autoComplete="off" value={secret} onChange={(event) => setSecret(event.target.value)} /></label>
      </> : null}
      <label className="helm-mcp-env-field"><span>{labels.oauthScope}</span>
        <input autoComplete="off" value={scope} onChange={(event) => setScope(event.target.value)} /></label>
      <button type="submit" className="helm-mcp-action" disabled={!valid || disabled || saving}>{labels.oauthSave}</button>
    </form>
  </details>
}

export function McpServersManager({ adapter, labels, disabled = false }: {
  adapter: McpServersAdapter
  labels: McpServersLabels
  disabled?: boolean
}) {
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter
  const [items, setItems] = useState<McpServerItem[]>([])
  const [pending, setPending] = useState<string | null>('loading')
  const [scanned, setScanned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authLink, setAuthLink] = useState<{ id: string; url: string } | null>(null)

  useEffect(() => { installMcpServersUiStyles() }, [])
  useEffect(() => {
    let live = true
    void adapterRef.current.list().then((results) => {
      if (live) { setItems(results); setError(null) }
    }).catch((cause) => {
      if (live) setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => { if (live) setPending(null) })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!authLink) return
    let live = true
    const poll = async () => {
      try {
        const servers = await adapterRef.current.list()
        if (!live) return
        setItems(servers)
        if (servers.some((server) => server.id === authLink.id && server.authenticated)) setAuthLink(null)
      } catch { /* polling must not interrupt the user authentication page */ }
    }
    const interval = setInterval(() => { void poll() }, 2000)
    const expiry = setTimeout(() => { if (live) setAuthLink(null) }, 180_000)
    return () => { live = false; clearInterval(interval); clearTimeout(expiry) }
  }, [authLink?.id, authLink?.url])

  const authorize = async (id: string) => {
    setPending(id)
    try {
      const response = await adapterRef.current.authorize(id)
      setAuthLink(response.authorizationUrl ? { id, url: response.authorizationUrl } : null)
      if (!response.authorizationUrl) setItems(await adapterRef.current.list())
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setPending(null) }
  }

  const run = async (key: string, request: () => Promise<McpServerItem[]>): Promise<boolean> => {
    setPending(key)
    try { setItems(await request()); setError(null); return true }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); return false }
    finally { setPending(null) }
  }

  const scan = async (): Promise<void> => {
    setPending('scan')
    setScanned(true)
    try {
      const result = await adapterRef.current.scan()
      setItems(result.servers)
      setError(result.failures.length
        ? labels.scanFailed + ': ' + result.failures.map((failure) =>
          failure.source + ' (' + failure.reason + ')').join(', ')
        : null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setPending(null) }
  }

  const rows = (servers: McpServerItem[], imported: boolean) => servers.map((server) => {
    const source = server.sources?.map((ref) => ref.source + ':' + ref.name).join(', ') || server.source
    const canImport = server.status !== 'auth-required' || server.issue === 'missing-env' || server.issue === 'remote-auth'
    const needsConfig = server.status === 'needs-config'
    const blocked = server.status === 'auth-required' || needsConfig || server.status === 'error'
    return <div className="helm-mcp-entry" key={server.id} data-server-id={server.id}>
      <div className="helm-mcp-row">
        <div className="helm-mcp-text">
          <span className="helm-mcp-name" title={server.name}>{server.name}</span>
          <span className="helm-mcp-meta">{source} · {labels.statuses[server.status]}</span>
        </div>
        {imported
          ? <button type="button" className="helm-mcp-switch" role="switch"
              aria-label={server.name} aria-checked={active(server)}
              disabled={disabled || pending !== null || blocked}
              onClick={() => { void run(server.id, () => adapterRef.current.setEnabled(server.id, !active(server))) }}>
              <span />
            </button>
          : <button type="button" className="helm-mcp-action"
              disabled={disabled || pending !== null || !canImport}
              onClick={() => { void run(server.id, () => adapterRef.current.importServer(server.id)) }}>
              {labels.import}
            </button>}
      </div>
      {imported && server.canAuthorize && !server.authenticated
        ? <div className="helm-mcp-env-form">
            <button type="button" className="helm-mcp-action" disabled={disabled || pending !== null}
              onClick={() => { void authorize(server.id) }}>{labels.authorize}</button>
            {authLink?.id === server.id ? <a className="helm-mcp-action"
              href={authLink.url} target="_blank" rel="noopener noreferrer">{labels.openAuth}</a> : null}
          </div> : null}
      {imported && server.canConfigureHeaders
        ? <McpHeaderForm disabled={disabled || pending !== null} labels={labels}
            save={(headers) => run(server.id, () => adapterRef.current.configureHeaders(server.id, headers))} /> : null}
      {imported && server.canAuthorize
        ? <McpOAuthClientForm disabled={disabled || pending !== null} labels={labels}
            save={(config) => run(server.id, () => adapterRef.current.configureOAuth(server.id, config))} /> : null}
      {server.issue ? <p className="helm-mcp-issue">{labels.issues[server.issue]}</p> : null}
      {imported && server.issue === 'missing-env' && server.requiredEnv?.length
        ? <McpEnvForm names={server.requiredEnv} labels={labels} disabled={disabled || pending !== null}
            save={(values) => run(server.id, () => adapterRef.current.configure(server.id, values))} /> : null}
    </div>
  })

  const imported = items.filter((item) => item.source === 'agent-helm')
  const candidates = items.filter((item) => item.source !== 'agent-helm')
  return <div className="helm-mcp-manager">
    <div className="helm-mcp-header"><strong>{labels.myServers}</strong></div>
    {error ? <div role="alert" className="helm-mcp-alert">{error}</div> : null}
    {pending === 'loading' && !items.length
      ? <div className="helm-mcp-empty">{labels.loading}</div>
      : imported.length ? rows(imported, true)
        : <div className="helm-mcp-empty">{labels.empty}</div>}
    <div className="helm-mcp-header">
      <strong>{labels.discover}</strong>
      <button type="button" className="helm-mcp-action" disabled={disabled || pending !== null}
        onClick={() => { void scan() }}>{labels.scan}</button>
    </div>
    {pending === 'scan'
      ? <div className="helm-mcp-empty">{labels.loading}</div>
      : candidates.length ? rows(candidates, false)
        : <div className="helm-mcp-empty">{scanned ? labels.noneFound : labels.notScanned}</div>}
  </div>
}
