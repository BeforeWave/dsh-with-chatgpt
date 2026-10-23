import { existsSync, mkdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targetRoot = join(packageRoot, 'src', '__shared')
const sharedNames = ['ui-contract', 'work-history-ui']

// Only the actual monorepo package may link canonical shared sources.
// An OSS checkout or standalone scratch may be nested anywhere below the
// monorepo: walking ancestor directories would leak private shared sources
// and can resolve a second React instance outside its isolated node_modules.
const repoRoot = resolve(packageRoot, '../..')
const canonicalRoot = packageRoot === join(repoRoot, 'packages', 'dsh-with-chatgpt')
  && sharedNames.every((name) => existsSync(join(repoRoot, 'shared', name)))
  ? join(repoRoot, 'shared')
  : undefined

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
