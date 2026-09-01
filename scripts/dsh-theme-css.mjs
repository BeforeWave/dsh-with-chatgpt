import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const SHEETS = [
  ['base.css', 'base_css_default'],
  ['design-platform.css', 'design_platform_css_default'],
  ['scrollbar.css', 'scrollbar_css_default'],
  ['gradient-shadow-text.css', 'gradient_shadow_text_css_default'],
  ['shiki.css', 'shiki_css_default'],
]

function readStringAssignment(source, variable) {
  const pattern = new RegExp(`var ${variable} = ("(?:\\\\.|[^"\\\\])*");`)
  const match = source.match(pattern)
  if (!match) throw new Error(`DSH theme sheet ${variable} was not found in the published client bundle`)
  return JSON.parse(match[1])
}

export async function readDshThemeCss() {
  const clientUrl = import.meta.resolve('@deepseek-ai/dsh-client-ui-theme/client')
  const clientPath = fileURLToPath(clientUrl)
  const source = await readFile(clientPath, 'utf8')
  return SHEETS.map(([name, variable]) => `/* @deepseek-ai/dsh-client-ui-theme: ${name} */\n${readStringAssignment(source, variable)}`).join('\n\n') + '\n'
}
