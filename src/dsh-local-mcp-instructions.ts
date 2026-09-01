import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import {
  helmServerInstructions,
  type HelmInstructionAvailability,
} from '@beforewave/agent-helm'

const LOCAL_MCP_SERVER_NAME = 'agent_helm_local'
const LOCAL_MCP_PUBLIC_PREFIX = `mcp__${LOCAL_MCP_SERVER_NAME}__`
const LOCAL_MCP_PROMPT_SECTION = 'agent-helm:local-mcp'
const LOCAL_MCP_PROMPT_ORDER = 110
const LOCAL_MCP_GUIDED_TOOL_NAMES = [
  'context_setup',
  'semantic_get_symbols_overview',
  'semantic_find_symbol',
  'semantic_find_declaration',
  'semantic_find_references',
  'semantic_find_implementations',
  'semantic_get_diagnostics',
]

function localMcpPublicToolName(rawName: string): string {
  return `${LOCAL_MCP_PUBLIC_PREFIX}${rawName}`
}

/**
 * DSH-specific projection of Agent Helm's generic MCP instructions.
 * Core owns the instruction semantics; this adapter only maps DSH's namespaced
 * tool names and Agent-scoped visibility into DSH's system-prompt runtime.
 */
export function localMcpAgentInstructions(available: HelmInstructionAvailability = () => true): string {
  if (!LOCAL_MCP_GUIDED_TOOL_NAMES.some((name) => available(name))) return ''
  return [
    'When Agent Helm Native MCP tools are listed for this turn, establish the execution context with context_setup before using semantic instruments. Use semantic_* for language-aware symbols, references, implementations, declarations, diagnostics, and structural edits that are actually advertised. Keep generic shell/file operations on native DSH tools; the Native MCP surface intentionally does not expose generic command or External text-helper authority.',
    `DSH exposes each Agent Helm tool as ${LOCAL_MCP_PUBLIC_PREFIX}<raw-name>. Call the visible namespaced tool with the same raw-name suffix, such as context_setup or semantic_find_symbol. Do not retry a hidden raw tool name directly.`,
    helmServerInstructions({ surface: 'local', toolName: localMcpPublicToolName, available }),
  ].join(' ')
}

/** Install the DSH host enhancement without coupling MCP connection lifecycle to prompt semantics. */
export function installDshLocalMcpAgentInstructions(ctx: Context): () => void {
  return ctx.systemPrompt.section({
    name: LOCAL_MCP_PROMPT_SECTION,
    order: LOCAL_MCP_PROMPT_ORDER,
    text: (context) => localMcpAgentInstructions(
      (rawName) => ctx.tools.get(localMcpPublicToolName(rawName), context.scope) !== undefined,
    ),
  })
}
