param(
  [Parameter(Position = 0, Mandatory = $true)]
  [ValidateSet('resolve', 'field', 'download')]
  [string]$Command,

  [Parameter(Mandatory = $true)]
  [string]$ReleaseUrl,

  [string]$Version = 'latest',
  [string]$ArtifactId,
  [string]$Field,
  [string]$Output
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
  throw "GitHub Release installer: $Message"
}

function Normalize-ReleaseUrl([string]$Value) {
  $normalized = $Value.TrimEnd('/')
  if ($normalized -notmatch '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/releases$') {
    Fail 'release URL must be an https://github.com/<owner>/<repo>/releases URL'
  }
  return $normalized
}

function Assert-SemVer([string]$Value) {
  if ($Value -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
    Fail 'version must be latest or a semantic version'
  }
}

function Invoke-GitHubRequest([string]$Uri, [string]$Output = '') {
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      if ($Output) {
        Invoke-WebRequest -UseBasicParsing -Uri $Uri -MaximumRedirection 10 -TimeoutSec 180 -OutFile $Output | Out-Null
        return
      }
      return Invoke-WebRequest -UseBasicParsing -Uri $Uri -MaximumRedirection 10 -TimeoutSec 180
    } catch {
      $responseProperty = $_.Exception.PSObject.Properties['Response']
      $status = if ($null -ne $responseProperty -and $null -ne $responseProperty.Value) { [int]$responseProperty.Value.StatusCode } else { 0 }
      # Do not retry permanent client errors; retry transient failures at most twice.
      if ($status -ge 400 -and $status -lt 500 -and $status -ne 408 -and $status -ne 429) { throw }
      if ($attempt -eq 3) { throw }
      Start-Sleep -Seconds $attempt
    }
  }
}

function Get-EffectiveUri($Response) {
  if ($null -ne $Response.BaseResponse) {
    if ($Response.BaseResponse.PSObject.Properties['ResponseUri']) {
      return $Response.BaseResponse.ResponseUri.AbsoluteUri
    }
    if ($Response.BaseResponse.PSObject.Properties['RequestMessage'] -and $null -ne $Response.BaseResponse.RequestMessage) {
      return $Response.BaseResponse.RequestMessage.RequestUri.AbsoluteUri
    }
  }
  Fail 'could not determine the effective GitHub Release URL'
}

function Resolve-Version([string]$BaseUrl, [string]$RequestedVersion) {
  if ($RequestedVersion -ne 'latest') {
    $exact = $RequestedVersion -replace '^v', ''
    Assert-SemVer $exact
    return ($exact -replace '-dev$', '')
  }
  $response = Invoke-GitHubRequest "$BaseUrl/latest"
  $effective = (Get-EffectiveUri $response).TrimEnd('/')
  $tag = ($effective -split '/')[-1] -replace '^v', ''
  Assert-SemVer $tag
  return $tag
}

function Get-Manifest([string]$BaseUrl, [string]$ExactVersion) {
  $uri = "$BaseUrl/download/v$ExactVersion/release-manifest.json"
  try {
    $response = Invoke-GitHubRequest $uri
  } catch {
    Fail "GitHub Release v$ExactVersion does not provide release-manifest.json"
  }
  try {
    $manifest = $response.Content | ConvertFrom-Json -ErrorAction Stop
  } catch {
    Fail "GitHub Release v$ExactVersion release-manifest.json is invalid JSON"
  }
  if ($null -eq $manifest -or $manifest.PSObject.Properties['releaseVersion'] -eq $null -or $manifest.releaseVersion -cne $ExactVersion) {
    Fail "release manifest version does not match Release v$ExactVersion"
  }
  return $manifest
}

$ReleaseUrl = Normalize-ReleaseUrl $ReleaseUrl
$Version = Resolve-Version $ReleaseUrl $Version
# The versioned manifest is the authoritative release proof. Avoid an extra
# unauthenticated GitHub API request on every resolve/field/download call.
$manifest = Get-Manifest $ReleaseUrl $Version

if ($Command -eq 'resolve') {
  Write-Output $Version
  return
}

if ($Command -eq 'field') {
  if ([string]::IsNullOrWhiteSpace($Field) -or $Field -notmatch '^[A-Za-z][A-Za-z0-9]*$') {
    Fail 'field must be a simple manifest property name'
  }
  $property = $manifest.PSObject.Properties[$Field]
  if ($null -eq $property -or $property.Value -isnot [string] -or [string]::IsNullOrWhiteSpace($property.Value)) {
    Fail "release manifest does not contain string field $Field"
  }
  Write-Output ([string]$property.Value)
  return
}

if ([string]::IsNullOrWhiteSpace($ArtifactId) -or $ArtifactId -notmatch '^[A-Za-z0-9._-]+$') {
  Fail 'artifact id is required and may contain only letters, numbers, dot, underscore, and hyphen'
}
if ([string]::IsNullOrWhiteSpace($Output)) {
  Fail 'output is required'
}

$matches = @($manifest.artifacts | Where-Object { $_.id -eq $ArtifactId })
if ($matches.Count -ne 1) {
  Fail "release manifest must contain exactly one $ArtifactId artifact"
}
$artifact = $matches[0]
$ProductVersion = $Version -replace "-dev$", ""
if ($artifact.version -ne $ProductVersion) {
  Fail "release artifact version $($artifact.version) does not match release target $ProductVersion"
}
if ($artifact.downloadUrl -isnot [string] -or $artifact.sha256 -isnot [string]) {
  Fail 'release artifact is missing downloadUrl or sha256'
}
$expectedPrefix = "$ReleaseUrl/download/v$Version/"
if (-not $artifact.downloadUrl.StartsWith($expectedPrefix, [System.StringComparison]::Ordinal)) {
  Fail 'release artifact URL is outside the selected GitHub Release'
}
if ($artifact.sha256 -notmatch '^[0-9a-fA-F]{64}$') {
  Fail 'release artifact SHA-256 is invalid'
}

$outputPath = [System.IO.Path]::GetFullPath($Output)
$outputDirectory = [System.IO.Path]::GetDirectoryName($outputPath)
if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
  [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}
try {
  Invoke-GitHubRequest -Uri $artifact.downloadUrl -Output $outputPath
} catch {
  Remove-Item -LiteralPath $outputPath -Force -ErrorAction SilentlyContinue
  throw
}
$actual = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
$expected = $artifact.sha256.ToLowerInvariant()
if ($actual -ne $expected) {
  Remove-Item -LiteralPath $outputPath -Force -ErrorAction SilentlyContinue
  Fail "release artifact SHA-256 verification failed for $ArtifactId"
}
Write-Output $Version
