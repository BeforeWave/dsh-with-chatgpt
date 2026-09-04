#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageName = '@beforewave/dsh-with-chatgpt'
const localBuildDependencies = [
  '@beforewave/agent-helm-ui-contract',
  '@beforewave/agent-helm',
]

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function findWorkspaceRoot() {
  let current = dirname(packageRoot)
  for (;;) {
    const manifestFile = join(current, 'package.json')
    if (existsSync(manifestFile)) {
      const manifest = readJson(manifestFile)
      const workspaces = Array.isArray(manifest.workspaces) ? manifest.workspaces : []
      const containsPackage = workspaces.some((workspace) => !workspace.includes('*') && resolve(current, workspace) === packageRoot)
      if (containsPackage && manifest.name !== packageName) return current
    }
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

function runNpm(args, cwd) {
  console.log(`▶ npm ${args.join(' ')}`)
  execFileSync('npm', args, { cwd, stdio: 'inherit' })
}

function buildProductionPackage() {
  const workspaceRoot = findWorkspaceRoot()
  if (workspaceRoot) {
    for (const dependency of localBuildDependencies) {
      runNpm(['run', 'build', '-w', dependency], workspaceRoot)
    }
    runNpm(['run', 'build', '-w', packageName], workspaceRoot)
    return
  }
  runNpm(['run', 'build'], packageRoot)
}

async function buildStandaloneDevelopmentArtifacts() {
  await build({
    entryPoints: [join(packageRoot, 'src/standalone/plugin.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    minify: true,
    outfile: join(packageRoot, 'lib/standalone-host.js'),
    external: ['@deepseek-ai/*', '@beforewave/agent-helm'],
    logLevel: 'silent',
  })
  await build({
    entryPoints: [join(packageRoot, 'src/standalone/cli.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    minify: true,
    outfile: join(packageRoot, 'lib/cli.js'),
    logLevel: 'silent',
  })
  await import('./build-standalone.mjs')
}

async function launchStandalone(args) {
  const cli = join(packageRoot, 'lib', 'cli.js')
  if (!existsSync(cli)) throw new Error(`standalone development build is missing ${cli}`)
  const child = spawn(process.execPath, [cli, 'standalone', ...args], {
    cwd: packageRoot,
    env: process.env,
    stdio: 'inherit',
  })
  const forward = (signal) => { if (child.exitCode === null) child.kill(signal) }
  process.once('SIGINT', forward)
  process.once('SIGTERM', forward)
  return await new Promise((resolvePromise, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolvePromise(code ?? (signal ? 1 : 0)))
  })
}

try {
  buildProductionPackage()
  await buildStandaloneDevelopmentArtifacts()
  process.exitCode = await launchStandalone(process.argv.slice(2))
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
