$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Require-Text([string]$Path, [string]$Text, [string]$Label) {
  $full = Join-Path $Root $Path
  if (!(Test-Path $full)) { throw "Missing file: $Path" }
  $content = Get-Content $full -Raw
  if (!$content.Contains($Text)) { throw "Missing expected feature: $Label" }
  Write-Host "PASS: $Label" -ForegroundColor Green
}

Write-Host "AngelBird web/backend final verification" -ForegroundColor Cyan

Require-Text "src\components\satisfaction\SatisfactionReportTable.jsx" 'w-[27%]' "Satisfaction comment column receives wide layout"
Require-Text "src\components\satisfaction\SatisfactionReportTable.jsx" 'w-[19%]' "Satisfaction note columns receive wide layout"
Require-Text "src\components\rma\RmaReportTable.jsx" '>Issues<' "RMA Issues table column"
Require-Text "src\components\rma\RmaMonthlyInsights.jsx" 'Trending Issues by Month' "Trending Issues monthly chart"
Require-Text "src\components\rma\RmaAnalyticsPanel.jsx" 'RMA Month-wise Trend' "RMA month-wise trend chart"
Require-Text "backend\src\services\rmaAnalyticsService.js" 'byIssue' "RMA issue normalization/analytics"
Require-Text "backend\src\services\googleSheetsService.js" 'GOOGLE_APPS_SCRIPT_DEPLOYMENT_NOT_FOUND' "Apps Script 404 diagnostics"
Require-Text "backend\src\services\googleSheetsService.js" 'getSatisfactionNotesWriterHealth' "Apps Script writer health check"
Require-Text "tools\ANGELBIRD-SATISFACTION-NOTES-APPS-SCRIPT.gs" 'setupAngelBirdConfig' "Apps Script v2 setup"

$backendFiles = @(
  "backend\src\services\googleSheetsService.js",
  "backend\src\services\rmaAnalyticsService.js",
  "backend\src\controllers\sheetReportsController.js",
  "backend\src\routes\sheetReportsRoutes.js"
)

foreach ($relative in $backendFiles) {
  $full = Join-Path $Root $relative
  node --check $full
  if ($LASTEXITCODE -ne 0) { throw "Node syntax failed: $relative" }
  Write-Host "PASS: node --check $relative" -ForegroundColor Green
}

if (Test-Path (Join-Path $Root "package.json")) {
  Write-Host "Running Vite production build..." -ForegroundColor Cyan
  Push-Location $Root
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "package.json not present in overlay. Merge into project root, then run npm run build." -ForegroundColor Yellow
}

Write-Host "All available checks passed." -ForegroundColor Green
