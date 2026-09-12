$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "AngelBird web reporting corrections 03 verification" -ForegroundColor Cyan

$required = @(
  "src\pages\ReportsPage.jsx",
  "src\utils\ticketAnalytics.js",
  "src\components\satisfaction\SatisfactionKpiCards.jsx",
  "src\components\satisfaction\SatisfactionAnalyticsPanel.jsx",
  "src\components\satisfaction\SatisfactionFilters.jsx",
  "src\components\satisfaction\SatisfactionReportTable.jsx"
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) { throw "Missing required file: $file" }
}

$ticketAnalytics = Get-Content "src\utils\ticketAnalytics.js" -Raw
if ($ticketAnalytics -notmatch 'rma_type') { throw "RMA type alias support missing" }
if ($ticketAnalytics -notmatch 'data recovery') { throw "Data Recovery classifier missing" }
if ($ticketAnalytics -match 'uniqueValidRegionTickets') { throw "Old region-restricted KPI logic still present" }

$satKpi = Get-Content "src\components\satisfaction\SatisfactionKpiCards.jsx" -Raw
if ($satKpi -match 'Solved Tickets|Not Solved|With Comments') { throw "Removed Satisfaction KPIs are still present" }

$satFilters = Get-Content "src\components\satisfaction\SatisfactionFilters.jsx" -Raw
if ($satFilters -match 'Solved Status|not_solved|solvedStatus') { throw "Solved filter is still present" }

$satAnalytics = Get-Content "src\components\satisfaction\SatisfactionAnalyticsPanel.jsx" -Raw
if ($satAnalytics -match 'Solved vs Not Solved|Comments Availability|solvedSummary|commentSummary') { throw "Removed Satisfaction charts are still present" }

$satTable = Get-Content "src\components\satisfaction\SatisfactionReportTable.jsx" -Raw
if ($satTable -match 'Solved Status') { throw "Solved Status is still visible in Satisfaction table/modal" }

$reports = Get-Content "src\pages\ReportsPage.jsx" -Raw
if ($reports -match 'satisfactionFilters\.solvedStatus|"Solved Status"') { throw "Solved status is still wired in ReportsPage" }

Write-Host "Static checks passed." -ForegroundColor Green

if (Test-Path "package.json") {
  Write-Host "Running production web build..." -ForegroundColor Yellow
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
}

Write-Host "AngelBird web reporting corrections 03 verification passed." -ForegroundColor Green
