param(
  [string]$Version = 'latest',
  [string]$Profile = 'web'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) { throw 'This installer supports Windows only.' }

$ReleaseUrl = 'https://github.com/BeforeWave/dsh-with-chatgpt/releases'
$ReleaseToolUrl = if ($env:BEFOREWAVE_RELEASE_TOOL_URL) { $env:BEFOREWAVE_RELEASE_TOOL_URL } else { 'https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install-release.ps1' }

function Fail([string]$Message) { throw "DSH with ChatGPT installer: $Message" }
function Stage([int]$Number, [string]$Message) { Write-Host "DSH with ChatGPT [$Number/3] $Message" }

Stage 1 'DSH host check'
$dsh = Get-Command dsh -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $dsh) { Fail 'dsh is required. Install DSH Desktop/CLI first.' }

$arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
if ($arch -notin @('AMD64', 'x64', 'X64')) { Fail "Windows installer currently supports win32-x64 only; detected $arch" }

$source = (Invoke-WebRequest -UseBasicParsing -Uri $ReleaseToolUrl).Content
if ([string]::IsNullOrWhiteSpace($source)) { Fail 'shared GitHub Release helper is empty' }
$ReleaseTool = [scriptblock]::Create($source)
$Version = (& $ReleaseTool resolve -ReleaseUrl $ReleaseUrl -Version $Version | Select-Object -Last 1).Trim()
Stage 2 "GitHub Release $Version"

$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("dsh-with-chatgpt-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp -Force | Out-Null
try {
  $archive = Join-Path $temp 'dsh-with-chatgpt.tgz'
  & $ReleaseTool download -ReleaseUrl $ReleaseUrl -Version $Version -ArtifactId 'dsh-with-chatgpt-package' -Output $archive
  & $dsh.Source plugin --profile $Profile add $archive
  if ($LASTEXITCODE -ne 0) { Fail "dsh plugin add failed for GitHub Release $Version" }
} finally {
  Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}

Stage 3 "Installed in DSH profile $Profile"
Write-Host "DSH with ChatGPT $Version installed. Start with: dsh $Profile"
