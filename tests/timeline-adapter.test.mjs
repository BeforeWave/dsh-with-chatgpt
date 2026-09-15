import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/app/adapter.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const adapterModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('standalone timeline subscription keeps access token in request header and does not use EventSource', async () => {
  const originalFetch = globalThis.fetch
  const originalEventSource = globalThis.EventSource
  const requests = []
  let eventSourceCalls = 0

  globalThis.EventSource = class {
    constructor() { eventSourceCalls += 1 }
  }
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), headers: new Headers(init.headers) })
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: timeline\ndata: {"updates":[{"id":"live-1","sequence":1,"timestamp":"2026-09-14T00:00:00.000Z"}]}\n\n'))
        controller.close()
      },
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }

  try {
    const adapter = adapterModule.createHttpHelmUiAdapter('http://127.0.0.1:3000', 'secret-token')
    const updates = await new Promise((resolve, reject) => {
      let unsubscribe = () => {}
      unsubscribe = adapter.subscribeSessionTimeline('session-1', 7, (items) => {
        unsubscribe()
        resolve(items)
      }, reject)
    })
    assert.equal(eventSourceCalls, 0)
    assert.equal(requests.length, 1)
    assert.equal(requests[0].headers.get('x-agent-helm-standalone-token'), 'secret-token')
    assert.equal(requests[0].headers.get('accept'), 'text/event-stream')
    assert.equal(requests[0].url.includes('secret-token'), false)
    assert.equal(new URL(requests[0].url).searchParams.get('afterSequence'), '7')
    assert.deepEqual(updates.map((item) => item.id), ['live-1'])
  } finally {
    globalThis.fetch = originalFetch
    if (originalEventSource === undefined) delete globalThis.EventSource
    else globalThis.EventSource = originalEventSource
  }
})
