param([ValidateSet('production','development')][string]$Profile='production')
$ErrorActionPreference='Stop'
$profileName=if($Profile -eq 'development'){'Redion-Entwicklung'}else{'Redion'}
$folder=Join-Path (Join-Path $env:APPDATA $profileName) 'automation'
$node=Get-Command node -ErrorAction SilentlyContinue
$client=Get-Command tunnel-client -ErrorAction SilentlyContinue
$running=$false
try {$runtime=Get-Content -LiteralPath (Join-Path $folder 'runtime.json') -Raw | ConvertFrom-Json;$running=!!(Get-Process -Id $runtime.pid -ErrorAction SilentlyContinue)}catch{}
[pscustomobject]@{Name='RED Ion';Profile=$Profile;NodeAvailable=!!$node;AppProcessPresent=$running;
  BridgeDiscoveryPresent=(Test-Path -LiteralPath (Join-Path $folder 'connection.json'));
  TunnelClientAvailable=!!$client;ChatGPTVerified=$false} | Format-List
Write-Output 'Diese Diagnose liest keine Dokumente, Tokens oder Schlüssel. Eine vorhandene Datei beweist noch keinen MCP-Handshake.'
