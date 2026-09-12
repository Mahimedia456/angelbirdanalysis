$ErrorActionPreference = "Stop"

Write-Host "AngelBird web reporting corrections 02 verification" -ForegroundColor Cyan

if (-not (Test-Path ".\src\pages\ReportsPage.jsx")) {
  throw "Run this script from the AngelBird project root."
}

$reports = Get-Content ".\src\pages\ReportsPage.jsx" -Raw
$ticketTable = Get-Content ".\src\components\tickets\TicketReportTable.jsx" -Raw
$ticketAnalytics = Get-Content ".\src\components\tickets\TicketAnalyticsPanel.jsx" -Raw
$satisfactionFilters = Get-Content ".\src\components\satisfaction\SatisfactionFilters.jsx" -Raw
$satisfactionTable = Get-Content ".\src\components\satisfaction\SatisfactionReportTable.jsx" -Raw
$rmaAnalytics = Get-Content ".\src\components\rma\RmaAnalyticsPanel.jsx" -Raw

if ($reports -match 'title="Ticket Procedure"') { throw "Ticket Procedure chart remains in ReportsPage." }
if ($ticketAnalytics -match 'title="Ticket Procedure"') { throw "Ticket Procedure chart remains in TicketAnalyticsPanel." }
if ($reports -match 'Procedure Wise') { throw "Procedure Wise ticket table tab remains." }
if ($reports -match '<th className="px-4 py-3">Procedure</th>') { throw "Procedure column remains in current ticket table." }
if ($ticketTable -match '>Procedure</th>') { throw "Procedure column remains in TicketReportTable." }
if ($rmaAnalytics -match 'Month-wise RMA') { throw "Month-wise RMA chart remains." }
if ($satisfactionFilters -match 'All Ratings') { throw "Rating dropdown still exists in global Satisfaction filters." }
if ($satisfactionTable -notmatch '\["Good", "Bad", "All"\]') { throw "Good -> Bad -> All table selector missing." }
if ($satisfactionTable -notmatch 'useState\("Good"\)') { throw "Good is not the default Satisfaction table selector." }
if ($reports -match 'satisfactionFilters\.rating') { throw "Global satisfaction rating filtering remains." }

$ticketHeaderOrder = $reports.IndexOf('<th className="px-4 py-3">Ticket #</th>')
$dateHeaderOrder = $reports.IndexOf('<th className="px-4 py-3">Date</th>')
if ($ticketHeaderOrder -lt 0 -or $dateHeaderOrder -lt 0 -or $ticketHeaderOrder -gt $dateHeaderOrder) {
  throw "Ticket # must appear immediately before Date in the current ticket table."
}

Write-Host "Static checks passed." -ForegroundColor Green
Write-Host "Running production build..." -ForegroundColor Cyan

npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite production build failed." }

Write-Host "Web reporting corrections 02 verified." -ForegroundColor Green
