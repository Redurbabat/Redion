param([string]$Target = (Join-Path $env:LOCALAPPDATA 'Redion-MCP'), [switch]$Update)
$ErrorActionPreference = 'Stop'
$node = Get-Command node -ErrorAction Stop
$redionNodeVersion=& $node.Source --version
if ($LASTEXITCODE -ne 0 -or [int]($redionNodeVersion.TrimStart('v').Split('.')[0]) -lt 22) { throw 'Node.js 22 oder neuer erforderlich.' }
$source = [IO.Path]::GetFullPath($PSScriptRoot)
$destination = [IO.Path]::GetFullPath($Target)
if ($source -eq $destination) { throw 'Quell- und Installationsordner müssen verschieden sein.' }
if ((Test-Path -LiteralPath $destination) -and -not $Update) { throw 'Ziel existiert bereits. Für ein bewusstes Update -Update verwenden.' }
# Ausschliesslich das vorbereitete Plugin-Paket kopieren; keine App-Profile und keine Zugangsdaten.
$allowed = @('plugin.json','mcp.json','README.md','Install.ps1','Start-MCP.ps1','Start-Tunnel.ps1','Diagnose.ps1','THIRD-PARTY-LICENSES.txt')
function Assert-RedionInstallPath([string]$Path) {
  $candidate=[IO.Path]::GetFullPath($Path)
  while ($candidate) {
    $item=Get-Item -LiteralPath $candidate -Force -ErrorAction SilentlyContinue
    if ($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Verknüpftes Installationsziel wird abgelehnt.' }
    $parent=Split-Path -Path $candidate -Parent
    if ($parent -eq $candidate) { break }
    $candidate=$parent
  }
}
Assert-RedionInstallPath $destination
foreach ($name in ($allowed + @('server\dist\index.mjs','tools\tunnel-client.exe','tools\LICENSE','tools\NOTICE','tools\tunnel-client-v0.0.21-windows-amd64-licenses.txt','tools\sha256.txt'))) {
  Assert-RedionInstallPath (Join-Path $destination $name)
}
New-Item -ItemType Directory -Path $destination -Force | Out-Null
foreach ($name in $allowed) {
  $file = Join-Path $source $name
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Paketdatei fehlt: $name" }
  Copy-Item -LiteralPath $file -Destination (Join-Path $destination $name) -Force
}
$serverTarget = Join-Path $destination 'server\dist'
New-Item -ItemType Directory -Path $serverTarget -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $source 'server\dist\index.mjs') -Destination (Join-Path $serverTarget 'index.mjs') -Force
if(Test-Path -LiteralPath (Join-Path $source 'tools\tunnel-client.exe')) {
  $toolsTarget=Join-Path $destination 'tools';New-Item -ItemType Directory -Path $toolsTarget -Force | Out-Null
  foreach($name in @('tunnel-client.exe','LICENSE','NOTICE','tunnel-client-v0.0.21-windows-amd64-licenses.txt','sha256.txt')) {
    Copy-Item -LiteralPath (Join-Path (Join-Path $source 'tools') $name) -Destination (Join-Path $toolsTarget $name) -Force
  }
}
Write-Output "RED Ion MCP lokal installiert: $destination"
Write-Output 'Keine ChatGPT-Registrierung und kein Autostart wurden dadurch aktiviert. Danach README.md öffnen.'
