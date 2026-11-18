param([Parameter(Mandatory=$true)][ValidatePattern('^tunnel_[a-z0-9]{32}$')][string]$TunnelId,
  [string]$TunnelClient='tunnel-client', [switch]$Initialize, [Alias('Profile')][ValidateSet('production','development')][string]$RedionProfile='production')
$ErrorActionPreference='Stop'
if($TunnelClient -eq 'tunnel-client' -and (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'tools\tunnel-client.exe'))) {
  $TunnelClient=Join-Path $PSScriptRoot 'tools\tunnel-client.exe'
  $stream=[IO.File]::OpenRead($TunnelClient);$sha=[Security.Cryptography.SHA256]::Create()
  try {$clientHash=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant()}
  finally {$stream.Dispose();$sha.Dispose()}
  if($clientHash -ne 'e0b2f25d08f24a4ddb7a04f3d43b62f88d4b18a5b20f2e478295cd8f353f21e5'){throw 'Tunnel-Client-Prüfsumme stimmt nicht.'}
}
$client=Get-Command $TunnelClient -ErrorAction Stop
$node=Get-Command node -ErrorAction Stop
$entry=Join-Path $PSScriptRoot 'server\dist\index.mjs'
if(-not (Test-Path -LiteralPath $entry -PathType Leaf)){throw 'Gebauter MCP-Server fehlt.'}
$env:REDION_MCP_PROFILE=$RedionProfile
$enteredHere=$false
if(-not $env:CONTROL_PLANE_API_KEY) {
  $secure=Read-Host 'OpenAI-Tunnel-Laufzeitschlüssel (nur lokal, nicht im Chat)' -AsSecureString
  $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {$env:CONTROL_PLANE_API_KEY=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer);$enteredHere=$true}
  finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
}
try {
  if($Initialize) {
    # Feste ausführbare Datei und feste Paketdatei; keine Werkzeugparameter als Shell-Befehl.
    if($node.Source.Contains('"') -or $entry.Contains('"')) {throw 'Unzulässiger Programmpfad.'}
    # Der Client zerlegt den Befehl als Shell-Wörter; Slash-Pfade bleiben
    # dabei auch unter Windows erhalten. Windows PowerShell 5.1 benötigt
    # zusätzlich maskierte Anführungszeichen beim Aufruf einer nativen EXE.
    $command='"'+$node.Source.Replace('\','/')+'" "'+$entry.Replace('\','/')+'"'
    if($PSVersionTable.PSVersion.Major -lt 7 -or (Get-Variable PSNativeCommandArgumentPassing -ValueOnly -ErrorAction SilentlyContinue) -eq 'Legacy') {$command=$command.Replace('"','\"')}
    & $client.Source init --sample sample_mcp_stdio_local --profile redion --tunnel-id $TunnelId --mcp-command $command
    if($LASTEXITCODE -ne 0){throw 'Tunnelprofil wurde nicht erstellt.'}
  }
  & $client.Source doctor --profile redion --explain
  if($LASTEXITCODE -ne 0){throw 'Tunnelprüfung fehlgeschlagen; keine funktionierende ChatGPT-Verbindung nachgewiesen.'}
  & $client.Source run --profile redion
} finally {if($enteredHere){Remove-Item Env:CONTROL_PLANE_API_KEY -ErrorAction SilentlyContinue}}
