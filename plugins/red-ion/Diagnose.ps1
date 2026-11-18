param([Alias('Profile')][ValidateSet('auto','production','development')][string]$RedionProfile='auto')
$ErrorActionPreference='Stop'
$node=Get-Command node -ErrorAction SilentlyContinue
$client=Get-Command tunnel-client -ErrorAction SilentlyContinue
$bundledClient=Join-Path $PSScriptRoot 'tools\tunnel-client.exe'
$bundledVerified=$false
if(Test-Path -LiteralPath $bundledClient -PathType Leaf) {
  $stream=[IO.File]::OpenRead($bundledClient);$sha=[Security.Cryptography.SHA256]::Create()
  try {$bundledVerified=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() -eq 'e0b2f25d08f24a4ddb7a04f3d43b62f88d4b18a5b20f2e478295cd8f353f21e5'}
  finally {$stream.Dispose();$sha.Dispose()}
}
$runtimeStatus=$null
if($node) {
  $env:REDION_MCP_PROFILE=$RedionProfile
  try {$runtimeStatus=(& $node.Source (Join-Path $PSScriptRoot 'server\dist\index.mjs') --diagnose) | ConvertFrom-Json}catch{}
}
[pscustomobject]@{Name='RED Ion';RequestedProfile=$RedionProfile;ActiveProfile=$runtimeStatus.profile;NodeAvailable=!!$node;AppProcessPresent=!!$runtimeStatus.running;
  BridgeStatus=$runtimeStatus.status;
  TunnelClientAvailable=($bundledVerified -or !!$client);BundledTunnelClientVerified=$bundledVerified;ChatGPTVerified=$false} | Format-List
Write-Output 'Diese Diagnose liest keine Dokumente, Tokens oder Schlüssel. Eine vorhandene Datei beweist noch keinen MCP-Handshake.'
