import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const sharedIcon = fileURLToPath(new URL('../src/__shared/ui-contract/agent-icon.tsx', import.meta.url))

// DSH standalone's esbuild uses the classic JSX transform by default. Rendering
// the bundled shared component catches an unbound React.createElement reference
// that typecheck and Vite/DSH builds alone cannot detect.
test('standalone JSX renders AgentIdentityIcon initials and native PNG without a global React variable', async () => {
  const result = await build({
    entryPoints: [sharedIcon],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node24',
    jsx: 'transform',
    external: ['react'],
    write: false,
    logLevel: 'silent',
  })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require)
  const { AgentIdentityIcon } = module.exports
  const initials = renderToStaticMarkup(React.createElement(AgentIdentityIcon, { name: 'Codex' }))
  assert.match(initials, /CO/)
  assert.match(initials, /border:1px solid rgba\(128,128,128,\.28\)/, 'text fallback alone has a subtle border')
  assert.match(initials, /background:transparent/, 'fallback has no gray fill')
  const png = 'data:image/png;base64,iVBORw0KGgo='
  const image = renderToStaticMarkup(React.createElement(AgentIdentityIcon, { name: 'Codex', iconDataUrl: png }))
  assert.match(image, /<img/)
  assert.match(image, /data:image\/png;base64/)
  assert.doesNotMatch(image, /border:|background:/, 'native app icon must render without an additional decorative shell')
})
