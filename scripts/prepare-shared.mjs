import { existsSync, mkdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targetRoot = join(packageRoot, 'src', '__shared')
const sharedNames = ['ui-contract', 'work-history-ui']

let cursor = packageRoot
let canonicalRoot
while (true) {
  const candidate = join(cursor, 'shared')
  if (sharedNames.every((name) => existsSync(join(candidate, name)))) { canonicalRoot = candidate; break }
  const parent = dirname(cursor)
  if (parent === cursor) break
  cursor = parent
}

if (canonicalRoot) {
  mkdirSync(targetRoot, { recursive: true })
  for (const name of sharedNames) {
    const target = join(targetRoot, name)
    const source = join(canonicalRoot, name)
    let current = false
    try { current = realpathSync(target) === realpathSync(source) } catch {}
    if (current) continue
    rmSync(target, { recursive: true, force: true })
    symlinkSync(source, target, process.platform === 'win32' ? 'junction' : 'dir')
  }
} else {
  for (const name of sharedNames) {
    if (!existsSync(join(targetRoot, name))) throw new Error(`Missing shared source: ${name}`)
  }
}
