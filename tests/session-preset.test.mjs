import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/dsh/session-preset.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText

// The module does `import * as agentPresets from '@deepseek-ai/dsh-agent-presets'`,
// which is unavailable in the test sandbox; stub it so the module loads and the
// fallback paths can be exercised. (`import type` bindings are erased by
// transpileModule, so only the namespace import needs stubbing.) The module
// captures the stub object at import time, so tests mutate the same object
// instead of replacing it.
const stub = {}
globalThis.__agentPresetsStub__ = stub
const stubbed = compiled.replace(
  "import * as agentPresets from '@deepseek-ai/dsh-agent-presets'",
  'const agentPresets = globalThis.__agentPresetsStub__',
)
const sessionPreset = await import(`data:text/javascript;base64,${Buffer.from(stubbed).toString('base64')}`)

function event(type, data) {
  return { type, data, seq: 0, time: Date.now() }
}

function selected(preset) {
  return event('agent-preset/selected', { agentPreset: preset })
}

function resetStub() {
  delete stub.resolveSessionPreset
  delete stub.agentPresetProjectionDefinition
}

test('local fallback picks the latest agent-preset/selected event', () => {
  const preset = sessionPreset.resolveSessionPresetLocally({
    header: { agentPreset: 'older-preset' },
    events: [selected('older-preset'), event('user/message', {}), selected('newer-preset')],
  })
  assert.equal(preset, 'newer-preset')
})

test('local fallback falls back to header.agentPreset when no selection event exists', () => {
  const preset = sessionPreset.resolveSessionPresetLocally({
    header: { agentPreset: 'header-preset' },
    events: [event('user/message', {})],
  })
  assert.equal(preset, 'header-preset')
})

test('local fallback returns undefined without any preset signal', () => {
  const preset = sessionPreset.resolveSessionPresetLocally({
    header: {},
    events: [event('user/message', {})],
  })
  assert.equal(preset, undefined)
})

test('resolveSessionPreset uses the projection fold when the package does not export resolveSessionPreset', () => {
  resetStub()
  stub.agentPresetProjectionDefinition = {
    init: (header) => header.agentPreset ?? null,
    apply: (state, event) => event.type === 'agent-preset/selected' ? event.data.agentPreset : state,
  }
  const preset = sessionPreset.resolveSessionPreset({
    header: { agentPreset: 'header-preset' },
    events: [event('user/message', {}), selected('event-preset')],
  })
  assert.equal(preset, 'event-preset')
})

test('resolveSessionPreset prefers the package-provided resolveSessionPreset', () => {
  resetStub()
  stub.resolveSessionPreset = () => 'package-preset'
  stub.agentPresetProjectionDefinition = {
    init: () => 'projection-preset',
    apply: (state) => state,
  }
  const preset = sessionPreset.resolveSessionPreset({ header: {}, events: [] })
  assert.equal(preset, 'package-preset')
})

test('resolveSessionPreset falls back to the local fold with an empty package', () => {
  resetStub()
  const preset = sessionPreset.resolveSessionPreset({
    header: {},
    events: [event('user/message', {}), selected('local-preset')],
  })
  assert.equal(preset, 'local-preset')
})
