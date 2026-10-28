import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { handleHelmMcpServersRequest, HELM_MCP_SERVERS_PATH } from '../lib/runtime/index.js'

async function invoke(runtime, method, body) {
  const req = {
    method, url: HELM_MCP_SERVERS_PATH,
    async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(JSON.stringify(body)) },
  }
  let status
  let json
  const res = {
    writeHead(code) { status = code },
    setHeader() {},
    end(value) { json = JSON.parse(value) },
  }
  await handleHelmMcpServersRequest(runtime, req, res)
  return { status, json }
}

test('DSH and standalone MCP Servers API uses explicit Scan, import and approval against same Core runtime', async () => {
  const calls = []
  const candidate = { id: 'codex:notes', name: 'notes', source: 'codex', status: 'discovered' }
  const imported = { id: 'mcp:12345678-1234-1234-1234-123456789abc', name: 'notes', source: 'agent-helm', status: 'imported' }
  const runtime = {
    async listMcpServers() { calls.push('list'); return [] },
    async scanMcpServers() { calls.push('scan'); return { servers: [candidate], failures: [{ source: 'claude', reason: 'scan_failed' }] } },
    async importMcpServer(id) { calls.push(['import', id]); return [imported] },
    async configureMcpServerEnv(id, values) { calls.push(['configureEnv', id, '<redacted>']); return [imported] },
    async setMcpServerEnabled(id, enabled) { calls.push(['enable', id, enabled]); return [{ ...imported, status: 'enabled' }] },
  }
  assert.deepEqual(await invoke(runtime, 'GET'), { status: 200, json: [] })
  assert.deepEqual(calls, ['list'], 'list must not automatically scan the source Agent')
  assert.deepEqual((await invoke(runtime, 'POST', { action: 'scan' })).json,
    { servers: [candidate], failures: [{ source: 'claude', reason: 'scan_failed' }] },
    'DSH must expose both successfully discovered MCPs and failed source')
  assert.deepEqual((await invoke(runtime, 'POST', { action: 'import', id: candidate.id })).json, [imported])
  assert.deepEqual((await invoke(runtime, 'POST', { action: 'configureEnv', id: imported.id, values: { FOO: 'secret-value' } })).json, [imported])
  assert.equal((await invoke(runtime, 'POST', { action: 'enable', id: imported.id, enabled: true })).json[0].status, 'enabled')
  assert.deepEqual(calls, ['list', 'scan', ['import', candidate.id], ['configureEnv', imported.id, '<redacted>'], ['enable', imported.id, true]])
  assert.equal((await invoke(runtime, 'POST', { action: 'enable', id: 'codex:notes', enabled: true })).status, 400)
  assert.equal((await invoke(runtime, 'POST', { action: 'import', id: imported.id })).status, 400)
  assert.equal((await invoke(runtime, 'POST', { action: 'configureEnv', id: 'codex:notes', values: {} })).status, 400)
})

test('DSH Web and standalone mount the identical MCP manager inside shared production UI', async () => {
  const app = await readFile(new URL('../src/app/app.tsx', import.meta.url), 'utf8')
  const manager = await readFile(new URL('../src/app/components/mcp-servers.tsx', import.meta.url), 'utf8')
  assert.match(app, /<McpServers adapter=\{adapter\} t=\{t\}/)
  assert.match(manager, /adapter\.scanMcpServers\(\)/)
  assert.match(manager, /adapter\.importMcpServer\(id\)/)
  assert.match(manager, /adapter\.setMcpServerEnabled\(id, enabled\)/)
  assert.match(manager, /adapter\.listMcpServers\(\)/)
  assert.match(manager, /McpServersManager/)
  assert.match(manager, /__shared\/mcp-servers-ui\/index/)
  const chrome = await readFile(new URL('../../agent-helm-extensions/chrome-extension/src/components/ExternalMcpControls.tsx', import.meta.url), 'utf8')
  assert.match(chrome, /McpServersManager/)
  assert.match(chrome, /__shared\/mcp-servers-ui\/index/)
  assert(!manager.includes('className="dshHelmMcpName"'), 'no forked DSH presentation')
  assert(!chrome.includes('className="popup-subrow"'), 'no forked Chrome presentation')
})
