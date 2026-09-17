$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $Root "backend\.env"

if (!(Test-Path $EnvFile)) {
  throw "backend\.env not found at $EnvFile"
}

function Get-EnvValue([string]$Name) {
  $line = Get-Content $EnvFile | Where-Object {
    $_ -match "^\s*$([regex]::Escape($Name))\s*="
  } | Select-Object -Last 1

  if (!$line) { return "" }

  $value = ($line -split "=", 2)[1].Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value
}

$url = Get-EnvValue "GOOGLE_APPS_SCRIPT_NOTES_URL"
$token = Get-EnvValue "GOOGLE_APPS_SCRIPT_NOTES_TOKEN"

if (!$url) {
  throw "GOOGLE_APPS_SCRIPT_NOTES_URL is missing in backend\.env"
}

if (!$token) {
  throw "GOOGLE_APPS_SCRIPT_NOTES_TOKEN is missing in backend\.env"
}

if ($url -match '^([A-Za-z0-9_-]{20,})$') {
  $url = "https://script.google.com/macros/s/$url/exec"
}

if ($url -match '/dev/?$') {
  $url = $url -replace '/dev/?$', '/exec'
}

if ($url -notmatch '^https://script\.google\.com/macros/s/[^/]+/exec$') {
  Write-Host "Invalid Apps Script URL:" -ForegroundColor Red
  Write-Host $url
  Write-Host "Expected: https://script.google.com/macros/s/DEPLOYMENT_ID/exec" -ForegroundColor Yellow
  exit 1
}

Write-Host "Checking Apps Script Web app..." -ForegroundColor Cyan
Write-Host $url

try {
  $response = Invoke-RestMethod -Uri $url -Method Get -MaximumRedirection 10 -TimeoutSec 30
} catch {
  Write-Host "Apps Script health check failed." -ForegroundColor Red
  Write-Host $_.Exception.Message
  Write-Host "If this is HTTP 404, redeploy Apps Script as Web app and copy the latest /exec URL." -ForegroundColor Yellow
  exit 1
}

$response | ConvertTo-Json -Depth 10

if (!$response.ok) {
  throw "Apps Script responded but ok was not true."
}

if ($response.configured -eq $false) {
  throw "Apps Script is reachable but not configured. Run setupAngelBirdConfig() once in Apps Script editor."
}

Write-Host "PASS: Apps Script notes writer is reachable and configured." -ForegroundColor Green
