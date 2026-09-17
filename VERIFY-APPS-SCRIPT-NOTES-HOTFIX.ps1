$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
Write-Host "AngelBird Apps Script notes writer hotfix verification"
node --check (Join-Path $backend "src/services/googleSheetsService.js")
node --check (Join-Path $backend "src/controllers/sheetReportsController.js")
Write-Host "PASS: backend syntax"
$service = Get-Content (Join-Path $backend "src/services/googleSheetsService.js") -Raw
if ($service -notmatch "GOOGLE_APPS_SCRIPT_NOTES_URL") { throw "Missing Apps Script URL support" }
if ($service -notmatch "GOOGLE_APPS_SCRIPT_NOTES_TOKEN") { throw "Missing Apps Script token support" }
if ($service -notmatch "updateSatisfactionNotesViaAppsScript") { throw "Missing Apps Script writer" }
Write-Host "PASS: Apps Script writer present"
