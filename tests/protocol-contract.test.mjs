import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const runtime = read('../src/runtime/runtime.ts')
const status = read('../src/runtime/status.ts')
const localMcp = read('../src/dsh/local-mcp.ts')
const http = read('../src/runtime/http.ts')

const expectedCoreMethods = [
  'configureTunnel', 'getChatSessionActivity', 'getChatSessionDelegations', 'getChatSessionSummary',
  'getChatSessionTimeline', 'getLocalMcpConnection', 'installDependency', 'listChatSessionSummaryPage',
  'reconcile', 'setCoreEnabled', 'setExternalUserAccess', 'setLocalMcpEnabled', 'shutdownDaemon', 'supervisorHealth',
]

test('DSH Core RPC method paths stay on the frozen entry contract', () => {
  const source = `${runtime}\n${status}\n${localMcp}`
  const methods = [...new Set([...source.matchAll(/\brpc\.([A-Za-z0-9_]+)\s*\(/g)]
    .map((match) => match[1])
    .filter((method) => expectedCoreMethods.includes(method)))].sort()
  assert.deepEqual(methods, expectedCoreMethods)
})

test('DSH entry endpoint paths stay stable', () => {
  assert.match(runtime, /join\(homedir\(\), '\.agent-helm', 'run', 'daemon\.sock'\)/)
  assert.match(http, /HELM_UI_STATUS_PATH = '\/api\/dsh-with-chatgpt\/status'/)
  assert.match(http, /HELM_SESSION_API_PATH = '\/api\/dsh-with-chatgpt\/sessions'/)
})
