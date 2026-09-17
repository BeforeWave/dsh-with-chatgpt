const chromeExtensionIdPattern = /^[a-p]{32}$/
const releaseVersionPattern = /^\d+\.\d+\.\d+(?:-dev)?$/
const productVersionPattern = /^\d+\.\d+\.\d+$/
const agentHelmInstallerReleaseUrl = 'https://github.com/BeforeWave/agent-helm-extensions/releases'

export function agentHelmInstallerSourceForRelease(releaseVersion: string) {
  if (!releaseVersionPattern.test(releaseVersion)) throw new Error('Invalid Agent Helm release version')
  const installerVersion = releaseVersion.replace(/-dev$/, '')
  const githubReleaseVersion = installerVersion
  if (!productVersionPattern.test(installerVersion)) throw new Error('Invalid Agent Helm installer version')
  const macosAssetName = `Agent-Helm-Installer-${installerVersion}.pkg`
  const windowsAssetName = `Agent-Helm-Installer-${installerVersion}-win32-x64.cmd`
  return {
    macos: {
      version: installerVersion,
      releaseVersion: githubReleaseVersion,
      releaseUrl: agentHelmInstallerReleaseUrl,
      assetName: macosAssetName,
      downloadUrl: `${agentHelmInstallerReleaseUrl}/download/v${githubReleaseVersion}/${macosAssetName}`,
    },
    windows: {
      version: installerVersion,
      releaseVersion: githubReleaseVersion,
      platform: 'win32-x64',
      releaseUrl: agentHelmInstallerReleaseUrl,
      assetName: windowsAssetName,
      downloadUrl: `${agentHelmInstallerReleaseUrl}/download/v${githubReleaseVersion}/${windowsAssetName}`,
    },
  } as const
}

export function agentHelmMacosInstallerFilename(version: string, extensionId: string): string {
  if (!chromeExtensionIdPattern.test(extensionId)) throw new Error('Invalid Chrome Extension ID')
  if (!productVersionPattern.test(version)) throw new Error('Invalid Agent Helm installer version')
  return `Agent-Helm-Installer-${version}--chrome-${extensionId}.pkg`
}
