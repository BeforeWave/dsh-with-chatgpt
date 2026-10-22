import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const oldRange = '>=0.1.1-rc.2 <0.2.0'
const testedRc = '0.2.1-rc.2'
const dshPeers = Object.entries(manifest.peerDependencies).filter(([name]) =>
  name.startsWith('@deepseek-ai/dsh-'),
)

test('all DSH host peers retain 0.1 support and explicitly accept only the tested 0.2 RC', () => {
  assert.ok(dshPeers.length >= 10, 'must cover all DSH host peers')
  for (const [name, range] of dshPeers) {
    assert.equal(range, `${oldRange} || ${testedRc}`, `${name}: never admit untested 0.2 / future hosts`)
  }
  for (const name of ['@deepseek-ai/cordis', '@deepseek-ai/schemastery']) {
    assert.ok(!manifest.peerDependencies[name].includes(testedRc), `${name} has an independent version`)
  }
})

test('removed DSH 0.1 host packages are neither peers nor client injection requirements', () => {
  const removed = ['@deepseek-ai/dsh-agent-presets', '@deepseek-ai/dsh-client-runtime', '@deepseek-ai/dsh-client-ui-primitives']
  for (const name of removed) {
    assert.ok(!(name in manifest.peerDependencies), `${name}: must not block DSH 0.2 install`)
    assert.ok(!manifest.dsh.client.inject.includes(name), `${name}: must not block browser initialization`)
  }
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-sidebar'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-locale'))
})

test('server and browser bundles do not require removed DSH 0.2 modules', () => {
  const server = readFileSync(new URL('lib/index.js', root), 'utf8')
  const browser = readFileSync(new URL('lib/client.js', root), 'utf8')
  assert.doesNotMatch(server, /from["']@deepseek-ai\/dsh-agent-presets["']/)
  assert.doesNotMatch(browser, /require\(["']@deepseek-ai\/dsh-client-ui-primitives["']\)/)
})
