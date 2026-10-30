import assert from 'node:assert/strict'
import { test } from 'node:test'
import { statusPanelAnchor } from '../src/app/panel-layout.ts'

function onScreen(anchor, height) {
  assert.ok(anchor.maxHeight >= 64, 'popup must never collapse to zero height')
  assert.ok(anchor.bottom >= 8, 'popup must stay above the viewport bottom')
  assert.ok(height - anchor.bottom - anchor.maxHeight >= 8, 'popup must stay below the viewport top')
  assert.ok(!('top' in anchor), 'DSH popup never flips below the sidebar trigger')
}

test('plugin popup keeps its previous above-trigger anchor at the bottom of DSH sidebar', () => {
  const viewport = { width: 900, height: 420 }
  const anchor = statusPanelAnchor({ left: 12, top: 362, width: 320 }, viewport)
  assert.deepEqual(anchor, { left: 12, bottom: 66, width: 320, maxHeight: 346 })
  onScreen(anchor, viewport.height)
})

test('trigger close to top never flips popup into the host clipped region', () => {
  const viewport = { width: 420, height: 520 }
  const anchor = statusPanelAnchor({ left: 360, top: 40, width: 320 }, viewport)
  assert.deepEqual(anchor, { left: 92, bottom: 448, width: 320, maxHeight: 64 })
  onScreen(anchor, viewport.height)
})

test('short viewport keeps a visible usable popup instead of collapsing it', () => {
  for (const top of [0, 1, 8, 20, 50, 120, 330, 480]) {
    const viewport = { width: 280, height: 500 }
    const anchor = statusPanelAnchor({ left: 5, top, width: 320 }, viewport)
    assert.equal(anchor.left, 8)
    assert.equal(anchor.width, 264)
    onScreen(anchor, viewport.height)
  }
})

test('expanded Code Sense scrolls within a height-limited upward popup', () => {
  const viewport = { width: 320, height: 620 }
  const anchor = statusPanelAnchor({ left: 12, top: 560, width: 296 }, viewport)
  assert.equal(anchor.bottom, 68)
  assert.equal(anchor.maxHeight, 544)
  onScreen(anchor, viewport.height)
})
