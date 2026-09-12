$ErrorActionPreference = "Stop"

Write-Host "AngelBird web reporting refinement verification" -ForegroundColor Cyan

if (-not (Test-Path ".\src\pages\ReportsPage.jsx")) {
  throw "Run this script from the AngelBird project root."
}

$chartPanel = Get-Content ".\src\components\dashboard\ChartPanel.jsx" -Raw
$reports = Get-Content ".\src\pages\ReportsPage.jsx" -Raw
$satisfaction = Get-Content ".\src\components\satisfaction\SatisfactionFilters.jsx" -Raw
$satisfactionTable = Get-Content ".\src\components\satisfaction\SatisfactionReportTable.jsx" -Raw
$rmaTable = Get-Content ".\src\components\rma\RmaReportTable.jsx" -Raw

if ($chartPanel -notmatch 'angelbird_chart_entry_limits_v2') { throw "ALL-default chart migration missing." }
if ($chartPanel -notmatch 'savedLimit \|\| "all"') { throw "Chart default ALL missing." }
if ($reports -match 'Ticket by TSE') { throw "Ticket by TSE is still visible." }
if ($reports -match '>TSE<') { throw "Visible TSE table column remains in ReportsPage." }
if ($rmaTable -match '>TSE<') { throw "Visible TSE remains in RMA table." }
if ($rmaTable -match 'Product 2') { throw "Product 2 remains in RMA table." }
if ($satisfaction -notmatch '<option value="Good">Good</option>') { throw "Good-first satisfaction filter missing." }
if ($satisfactionTable -notmatch 'AI Summary') { throw "AI Summary column missing." }
if ($reports -notmatch 'type="horizontalBar"') { throw "Horizontal Ticket by Region chart missing." }

Write-Host "Static checks passed." -ForegroundColor Green
Write-Host "Running production build..." -ForegroundColor Cyan

npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite production build failed." }

Write-Host "Web reporting update verified." -ForegroundColor Green
