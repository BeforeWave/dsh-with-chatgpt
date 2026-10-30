/**
 * Anchor DSH's status popup above its sidebar trigger. The DSH host can clip
 * content below the sidebar; never automatically flip the popup downward.
 * Clamp the visible popup height so expanding Code Sense / Agents scrolls
 * inside the panel instead of moving the entire popup out of the viewport.
 */
export function statusPanelAnchor(
  rect: Pick<DOMRect, 'left' | 'top' | 'width'>,
  viewport: { width: number; height: number },
): { left: number; bottom: number; width: number; maxHeight: number } {
  const width = Math.max(1, Math.min(rect.width, viewport.width - 16))
  const maxHeight = Math.max(64, Math.min(rect.top - 16, viewport.height - 16))
  const bottom = Math.max(8, Math.min(viewport.height - rect.top + 8, viewport.height - maxHeight - 8))
  return {
    left: Math.max(8, Math.min(rect.left, viewport.width - width - 8)),
    bottom,
    width,
    maxHeight,
  }
}
