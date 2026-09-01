import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readDshThemeCss } from './dsh-theme-css.mjs'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const outdir = join(packageRoot, 'lib/standalone')
await mkdir(outdir, { recursive: true })
await writeFile(join(outdir, 'dsh-theme.css'), await readDshThemeCss())

await build({
  entryPoints: [join(packageRoot, 'src/app/standalone.tsx')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  outdir,
  entryNames: 'app',
  assetNames: 'assets/[name]-[hash]',
  loader: {
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
  },
  plugins: [{
    name: 'omit-unused-katex-css',
    setup(context) {
      // dsh-client-ui-primitives re-exports MarkdownText from its aggregate entry,
      // which imports KaTeX CSS even though Agent Helm's standalone UI never uses
      // the Markdown renderer. Drop only that unused side-effect import so the
      // standalone package does not ship the complete KaTeX font set.
      context.onResolve({ filter: /^katex\/dist\/katex\.min\.css$/ }, () => ({ path: 'empty-katex.css', namespace: 'agent-helm-empty' }))
      context.onLoad({ filter: /.*/, namespace: 'agent-helm-empty' }, () => ({ contents: '', loader: 'css' }))
    },
  }],
  logLevel: 'silent',
})

await writeFile(join(outdir, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Agent Helm</title>
  <link rel="stylesheet" href="/dsh-theme.css">
  <link rel="stylesheet" href="/app.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>\n`)
