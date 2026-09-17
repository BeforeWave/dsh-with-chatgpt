export const tunnelSetupLinks = {
  tunnels: 'https://platform.openai.com/settings/organization/tunnels',
  runtimeApiKeys: 'https://platform.openai.com/settings/organization/api-keys',
  organization: 'https://platform.openai.com/settings/organization/general',
  developerMode: 'https://chatgpt.com/#settings/Connectors/Advanced',
  connectors: 'https://chatgpt.com/#settings/Connectors',
  tunnelClientRelease: 'https://github.com/openai/tunnel-client/releases',
} as const

export type TunnelOnboardingTextKey =
  | 'tunnelSetupTitle'
  | 'tunnelSetupDescription'
  | 'tunnelSetupStep1'
  | 'tunnelSetupStep1Description'
  | 'tunnelSetupStep2'
  | 'tunnelSetupStep2Description'
  | 'tunnelSetupStoredLocally'
  | 'tunnelSetupStep3'
  | 'tunnelSetupStep3Description'
  | 'tunnelIdLabel'
  | 'tunnelIdDescription'
  | 'organizationIdLabel'
  | 'organizationIdDescription'
  | 'runtimeApiKeyLabel'
  | 'runtimeApiKeyDescription'
  | 'fieldGet'
  | 'runtimeApiKeyPlaceholder'
  | 'tunnelProxyLabel'
  | 'tunnelProxyDescription'
  | 'tunnelProxyPlaceholder'
  | 'tunnelProxyConfigured'
  | 'tunnelProxyNotConfigured'
  | 'saveAndConnect'
  | 'saveTunnelSetup'
  | 'savingTunnelSetup'
  | 'openTunnels'
  | 'createRuntimeApiKey'
  | 'openChatGptDeveloperMode'
  | 'openChatGptConnectors'
  | 'installTunnelClient'
  | 'tunnelClientInstalled'
  | 'tunnelClientInstallDescription'
  | 'tunnelClientRequired'
  | 'downloadTunnelClient'
  | 'tunnelApiKeyConfigured'
  | 'tunnelApiKeyMissing'
  | 'installing'

export interface TunnelOnboardingText {
  key: TunnelOnboardingTextKey
  defaultText: string
}

export type TunnelOnboardingLinkId = keyof typeof tunnelSetupLinks

export interface TunnelOnboardingLinkAction {
  id: TunnelOnboardingLinkId
  label: TunnelOnboardingText
  href: string
}

export const tunnelOnboardingSource = {
  id: 'chatgpt-tunnel',
  title: { key: 'tunnelSetupTitle', defaultText: 'Configure ChatGPT Secure Tunnel' },
  description: { key: 'tunnelSetupDescription', defaultText: 'Configure the connection values, confirm the required permission and tunnel-client, then configure the ChatGPT Plugin.' },
  steps: [
    {
      id: 'agent-helm-configuration',
      title: { key: 'tunnelSetupStep1', defaultText: '1. Configure ChatGPT Secure Tunnel' },
      description: { key: 'tunnelSetupStep1Description', defaultText: 'Enter the ChatGPT Secure Tunnel credentials and optional proxy.' },
      getAction: { key: 'fieldGet', defaultText: 'Get' },
      fields: [
        { id: 'tunnelId', label: { key: 'tunnelIdLabel', defaultText: 'Tunnel ID' }, description: { key: 'tunnelIdDescription', defaultText: 'OpenAI Secure MCP Tunnel ID (tunnel_…) identifying the Tunnel to connect through.' }, required: true, secret: false, helpLink: { id: 'tunnels', href: tunnelSetupLinks.tunnels } },
        { id: 'apiKey', label: { key: 'runtimeApiKeyLabel', defaultText: 'Runtime API Key' }, description: { key: 'runtimeApiKeyDescription', defaultText: 'Restricted API key used by tunnel-client to access the Tunnel. Requires Tunnels Read + Use; required on first save and never shown again.' }, required: true, secret: true, savedPlaceholder: { key: 'runtimeApiKeyPlaceholder', defaultText: '••••••••••••••••' }, helpLink: { id: 'runtimeApiKeys', href: tunnelSetupLinks.runtimeApiKeys } },
        { id: 'organizationId', label: { key: 'organizationIdLabel', defaultText: 'Organization ID (optional)' }, description: { key: 'organizationIdDescription', defaultText: 'OpenAI Organization ID. Usually leave blank; set it only when you need to select an organization explicitly.' }, required: false, secret: false, helpLink: { id: 'organization', href: tunnelSetupLinks.organization } },
        { id: 'proxyUrl', label: { key: 'tunnelProxyLabel', defaultText: 'Tunnel proxy URL (optional)' }, description: { key: 'tunnelProxyDescription', defaultText: 'HTTP/HTTPS proxy used only by tunnel-client to reach the OpenAI Tunnel, for example http://127.0.0.1:7890.' }, required: false, secret: false, savedPlaceholder: { key: 'tunnelProxyPlaceholder', defaultText: 'http://127.0.0.1:7890' } },
      ],
      configuredNote: { key: 'tunnelApiKeyConfigured', defaultText: 'Runtime API Key configured' },
      missingNote: { key: 'tunnelApiKeyMissing', defaultText: 'Runtime API Key not configured' },
      proxyConfiguredNote: { key: 'tunnelProxyConfigured', defaultText: 'Tunnel proxy configured' },
      proxyMissingNote: { key: 'tunnelProxyNotConfigured', defaultText: 'Tunnel proxy not configured' },
      storageNote: { key: 'tunnelSetupStoredLocally', defaultText: 'Saved locally by Agent Helm. The Runtime API Key is not shown again.' },
      saveAction: { key: 'saveTunnelSetup', defaultText: 'Save' },
      submitAction: { key: 'saveAndConnect', defaultText: 'Save & Connect' },
      submitting: { key: 'savingTunnelSetup', defaultText: 'Saving…' },
    },
    {
      id: 'openai-guidance',
      title: { key: 'tunnelSetupStep2', defaultText: '2. Permissions & Runtime' },
      description: { key: 'tunnelSetupStep2Description', defaultText: 'Runtime API Key needs Tunnels Read + Use. Settings stay local; Agent Helm uses a compatible system tunnel-client or downloads and verifies the OpenAI official release.' },
      links: [],
      dependency: {
        id: 'tunnelClient',
        required: { key: 'tunnelClientRequired', defaultText: 'OpenAI tunnel-client is required.' },
        installDescription: { key: 'tunnelClientInstallDescription', defaultText: 'Agent Helm uses a compatible system tunnel-client first; otherwise it downloads and verifies the official release.' },
        installAction: { key: 'installTunnelClient', defaultText: 'Install tunnel-client' },
        installedAction: { key: 'tunnelClientInstalled', defaultText: 'tunnel-client installed' },
        installing: { key: 'installing', defaultText: 'Installing…' },
        downloadAction: { id: 'tunnelClientRelease', label: { key: 'downloadTunnelClient', defaultText: 'OpenAI official releases' }, href: tunnelSetupLinks.tunnelClientRelease },
      },
    },
    {
      id: 'chatgpt-connection',
      title: { key: 'tunnelSetupStep3', defaultText: '3. Configure ChatGPT Plugin' },
      description: { key: 'tunnelSetupStep3Description', defaultText: 'Enable Developer mode, then add or configure the Agent Helm plugin in ChatGPT Connectors.' },
      links: [
        { id: 'developerMode', label: { key: 'openChatGptDeveloperMode', defaultText: 'Open Developer mode' }, href: tunnelSetupLinks.developerMode },
        { id: 'connectors', label: { key: 'openChatGptConnectors', defaultText: 'Open ChatGPT Connectors' }, href: tunnelSetupLinks.connectors },
      ],
    },
  ],
} as const
export function tunnelOnboardingRequired(input: TunnelSetupProjection & { missingEnvironment?: readonly string[] }): boolean {
  return !input.tunnelId || !input.apiKeyConfigured || Boolean(input.missingEnvironment?.length)
}

export function tunnelSetupCanSubmit(input: { tunnelId: string; apiKeyConfigured: boolean; runtimeApiKey: string }): boolean {
  return Boolean(input.tunnelId.trim()) && (input.apiKeyConfigured || Boolean(input.runtimeApiKey.trim()))
}

export interface TunnelSetupValues {
  tunnelId: string
  organizationId?: string
  apiKey?: string
  proxyUrl?: string
}

export interface TunnelSetupProjection {
  tunnelId?: string
  organizationId?: string
  apiKeyConfigured: boolean
  proxyConfigured?: boolean
  proxyUrl?: string
}
