param([ValidateSet('stdio','http')][string]$Transport='stdio', [ValidateSet('production','development')][string]$Profile='production')
$ErrorActionPreference='Stop'
$node=Get-Command node -ErrorAction Stop
$env:REDION_MCP_PROFILE=$Profile
$entry=Join-Path $PSScriptRoot 'server\dist\index.mjs'
if($Transport -eq 'http') {
  if(-not $env:REDION_MCP_HTTP_TOKEN -or $env:REDION_MCP_HTTP_TOKEN.Length -lt 32) { throw 'Für HTTP REDION_MCP_HTTP_TOKEN sicher als Prozessumgebungsvariable setzen. Nicht in den Chat oder in Skripte schreiben.' }
  & $node.Source $entry --http
} else { & $node.Source $entry }
exit $LASTEXITCODE
