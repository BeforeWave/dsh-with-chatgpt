import { build } from 'esbuild'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageId = '@beforewave/dsh-with-chatgpt'
const packageRoot = fileURLToPath(new URL('../', import.meta.url))

export async function buildClientBundle(outfile = join(packageRoot, 'lib/client.js')) {
  const temp = await mkdtemp(join(tmpdir(), 'dsh-chatgpt-helm-client-'))
  const bodyPath = join(temp, 'client.cjs')

  try {
    await build({
      entryPoints: [join(packageRoot, 'src/client.tsx')],
      bundle: true,
      platform: 'browser',
      format: 'cjs',
      target: 'es2022',
      outfile: bodyPath,
      external: ['react', 'react/jsx-runtime', '@deepseek-ai/*'],
      logLevel: 'silent',
    })
    const body = await readFile(bodyPath, 'utf8')
    const wrapped = `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(packageId)},\n  factory: (require) => {\n    var module = { exports: {} };\n    var exports = module.exports;\n${body}\n    return module.exports;\n  }\n});\n`
    await mkdir(dirname(outfile), { recursive: true })
    await writeFile(outfile, wrapped)
    return outfile
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await buildClientBundle()
}
