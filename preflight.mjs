#!/usr/bin/env node

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10)

console.log('')
console.log('DSH with ChatGPT — setup check')
console.log('')

if (nodeMajor >= 22) {
  console.log(`  ✓ Node.js 22+ — v${process.versions.node}`)
} else {
  console.log(`  ✗ Node.js 22+ — found v${process.versions.node}`)
  console.log('    Upgrade Node.js to 22 or newer before using DSH with ChatGPT.')
}

console.log('')
console.log('Serena, tunnel-client, and other Agent Helm dependencies are checked by the Agent Helm Core daemon using the Core environment.')
console.log('The DSH panel does not derive Core dependency readiness from the DSH process PATH.')
console.log('Use the DSH or Chrome Extension Agent Helm controls to view Core-authoritative dependency status and available install actions.')
console.log('')
