param([Alias('Profile')][ValidateSet('production','development')][string]$RedionProfile='production')
$ErrorActionPreference='Stop'
$profileName=if($RedionProfile -eq 'development'){'Redion-Entwicklung'}else{'Redion'}
$folder=Join-Path (Join-Path $env:APPDATA $profileName) 'automation'
$node=Get-Command node -ErrorAction SilentlyContinue
$client=Get-Command tunnel-client -ErrorAction SilentlyContinue
$bundledClient=Join-Path $PSScriptRoot 'tools\tunnel-client.exe'
$bundledVerified=$false
if(Test-Path -LiteralPath $bundledClient -PathType Leaf) {
  $stream=[IO.File]::OpenRead($bundledClient);$sha=[Security.Cryptography.SHA256]::Create()
  try {$bundledVerified=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() -eq 'e0b2f25d08f24a4ddb7a04f3d43b62f88d4b18a5b20f2e478295cd8f353f21e5'}
  finally {$stream.Dispose();$sha.Dispose()}
}
$running=$false
try {$runtime=Get-Content -LiteralPath (Join-Path $folder 'runtime.json') -Raw | ConvertFrom-Json;$running=!!(Get-Process -Id $runtime.pid -ErrorAction SilentlyContinue)}catch{}
[pscustomobject]@{Name='RED Ion';Profile=$RedionProfile;NodeAvailable=!!$node;AppProcessPresent=$running;
  BridgeDiscoveryPresent=(Test-Path -LiteralPath (Join-Path $folder 'connection.json'));
  TunnelClientAvailable=($bundledVerified -or !!$client);BundledTunnelClientVerified=$bundledVerified;ChatGPTVerified=$false} | Format-List
Write-Output 'Diese Diagnose liest keine Dokumente, Tokens oder Schlüssel. Eine vorhandene Datei beweist noch keinen MCP-Handshake.'
