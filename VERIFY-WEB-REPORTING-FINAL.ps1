$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$reports = Join-Path $root "src\pages\ReportsPage.jsx"
$ticketFilters = Join-Path $root "src\components\tickets\TicketFilters.jsx"
$satisfactionPanel = Join-Path $root "src\components\satisfaction\SatisfactionAnalyticsPanel.jsx"
$satisfactionKpis = Join-Path $root "src\components\satisfaction\SatisfactionKpiCards.jsx"
$rmaTable = Join-Path $root "src\components\rma\RmaReportTable.jsx"
$rmaPanel = Join-Path $root "src\components\rma\RmaAnalyticsPanel.jsx"

$required = @($reports, $ticketFilters, $satisfactionPanel, $satisfactionKpis, $rmaTable, $rmaPanel)
foreach ($file in $required) {
  if (-not (Test-Path $file)) { throw "Missing required file: $file" }
}

$reportsText = Get-Content $reports -Raw
$ticketFiltersText = Get-Content $ticketFilters -Raw
$satisfactionPanelText = Get-Content $satisfactionPanel -Raw
$satisfactionKpisText = Get-Content $satisfactionKpis -Raw
$rmaTableText = Get-Content $rmaTable -Raw
$rmaPanelText = Get-Content $rmaPanel -Raw

if ($reportsText -match '— Google Sheet') { throw "Google Sheet source wording is still visible in report table titles." }
if ($ticketFiltersText -match '>Procedure<|All Procedures|filters\.procedure|updateFilter\("procedure"') { throw "Ticket Procedure filter still exists." }
if ($reportsText -notmatch 'title="Ticket Report Data"') { throw "Ticket Report Data title not found." }
if ($reportsText -notmatch 'buildTicketRmaKpiCounts') { throw "RMA-backed Ticket KPI calculation not found." }
if ($reportsText -notmatch 'type === "data recovery" \|\| type === "data recovery rma"') { throw "Data Recovery KPI RMA Type mapping not found." }
if ($reportsText -notmatch 'normalizeRmaKpiType\(row\.rmaType\) === "rma"') { throw "Exact RMA KPI mapping not found." }
if ($satisfactionPanelText -notmatch 'With Comments vs Without Comments') { throw "Comment availability chart is missing." }
if ($satisfactionKpisText -match 'Solved|With Comments|Not Solved') { throw "Removed Satisfaction KPI cards returned." }
if ($rmaPanelText -match 'Month-wise RMA|rma_by_month') { throw "Month-wise RMA chart returned." }
if ($rmaTableText -match 'Product 2|product2') { throw "Product 2 is visible in RMA table." }

Write-Host "Static reporting checks passed." -ForegroundColor Green

if (-not (Test-Path (Join-Path $root "package.json"))) {
  Write-Host "package.json is not inside this incremental ZIP folder. Merge into the project root, then rerun this verifier to perform the production build." -ForegroundColor Yellow
  exit 0
}

Write-Host "Running production web build..." -ForegroundColor Cyan
Push-Location $root
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
}
finally {
  Pop-Location
}

Write-Host "AngelBird web reporting final verification passed." -ForegroundColor Green
