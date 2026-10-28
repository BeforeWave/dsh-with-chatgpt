import { useMemo } from 'react'
import { McpServersManager, type McpServersLabels } from '../../__shared/mcp-servers-ui/index.js'
import type { HelmUiAdapter } from '../adapter.js'
import type { HelmTranslate } from '../locale.js'

export function McpServers({ adapter, t, disabled }: {
  adapter: HelmUiAdapter
  t: HelmTranslate
  disabled: boolean
}): JSX.Element {
  const labels: McpServersLabels = {
    myServers: t('mcpMyServers'), discover: t('mcpDiscover'),
    scan: t('mcpScan'), scanFailed: t('mcpScanFailed'), import: t('mcpImport'),
    loading: t('loading'), empty: t('mcpEmpty'),
    notScanned: t('mcpNotScanned'), noneFound: t('mcpNoneFound'),
    saveEnv: t('mcpSaveEnv'), authorize: t('mcpAuthorize'), openAuth: t('mcpOpenAuth'),
    advancedAuth: t('mcpAdvancedAuth'),
    authAuto: t('mcpAuthAuto'), authMetadata: t('mcpAuthMetadata'),
    authRegistered: t('mcpAuthRegistered'), authMachine: t('mcpAuthMachine'),
    oauthClientId: t('mcpOauthClientId'), oauthClientSecret: t('mcpOauthClientSecret'),
    oauthMetadataUrl: t('mcpOauthMetadataUrl'), oauthScope: t('mcpOauthScope'), oauthSave: t('mcpOauthSave'),
    httpHeader: t('mcpHttpHeader'), httpHeaderName: t('mcpHttpHeaderName'), httpHeaderValue: t('mcpHttpHeaderValue'), httpHeaderSave: t('mcpHttpHeaderSave'),

    statuses: {
      discovered: t('mcpDiscovered'), imported: t('mcpImported'),
      enabled: t('mcpEnabled'), connected: t('mcpConnected'),
      'auth-required': t('mcpAuthRequired'), 'needs-config': t('mcpNeedsConfig'),
      unavailable: t('mcpUnavailable'), error: t('mcpError'),
    },
    issues: {
      'missing-env': t('mcpMissingEnv'), 'remote-auth': t('mcpRemoteAuth'),
      'insecure-http': t('mcpInsecureHttp'),
    },
  }
  const controls = useMemo(() => ({
    list: () => adapter.listMcpServers(),
    scan: () => adapter.scanMcpServers(),
    importServer: (id: string) => adapter.importMcpServer(id),
    setEnabled: (id: string, enabled: boolean) => adapter.setMcpServerEnabled(id, enabled),
    configure: (id: string, values: Record<string, string>) => adapter.configureMcpServerEnv(id, values),
    configureOAuth: (id: string, options: import('../../__shared/mcp-servers-ui/index.js').McpOAuthClientSetup) => adapter.configureMcpOAuth(id, options),
    configureHeaders: (id: string, headers: Record<string, string>) => adapter.configureMcpHttpHeaders(id, headers),
    authorize: (id: string) => adapter.authorizeMcpServer(id),
  }), [adapter])
  return <McpServersManager labels={labels} adapter={controls} disabled={disabled} />
}
