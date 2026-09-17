$ErrorActionPreference = "Stop"

Write-Host "AngelBird Web RMA unique-ticket + layout verification" -ForegroundColor Cyan

$checks = @(
  @{ File = "backend\src\services\rmaAnalyticsService.js"; Text = "One RMA record per Ticket #" },
  @{ File = "backend\src\services\rmaAnalyticsService.js"; Text = "mergeDuplicateRmaRows" },
  @{ File = "backend\src\services\rmaSheetService.js"; Text = "duplicateRows: Math.max" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "Date-wise RMA" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "Monthly Insights" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "Issue & Warranty Analysis" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "RMA Classification" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "Products by RMA" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = 'mode="overview"' }
)

foreach ($check in $checks) {
  $path = Join-Path $PSScriptRoot $check.File
  if (-not (Test-Path $path)) { throw "Missing file: $($check.File)" }
  $content = Get-Content $path -Raw
  if (-not $content.Contains($check.Text)) { throw "Missing expected marker '$($check.Text)' in $($check.File)" }
  Write-Host "PASS: $($check.File) -> $($check.Text)" -ForegroundColor Green
}

Write-Host "Checking backend syntax..." -ForegroundColor Cyan
node --check (Join-Path $PSScriptRoot "backend\src\services\rmaAnalyticsService.js")
if ($LASTEXITCODE -ne 0) { throw "rmaAnalyticsService.js syntax check failed" }
node --check (Join-Path $PSScriptRoot "backend\src\services\rmaSheetService.js")
if ($LASTEXITCODE -ne 0) { throw "rmaSheetService.js syntax check failed" }

Write-Host "Checking duplicate collapse behavior..." -ForegroundColor Cyan
$modulePath = (Join-Path $PSScriptRoot "backend\src\services\rmaAnalyticsService.js").Replace("\", "/")
$script = @"
import { deduplicateRmaRows } from 'file:///$modulePath';
const rows = [
  { id: 2, ticketNumber: '5173', date: '2026-09-01', rmaType: 'RMA', issues: 'Old issue', product1: 'Card A' },
  { id: 9, ticketNumber: '5173', date: '2026-09-10', rmaType: 'Data Recovery RMA', issues: '', product1: 'Card A' },
  { id: 10, ticketNumber: '6001', date: '2026-09-11', rmaType: 'RMA', issues: 'Physical Damage', product1: 'Card B' }
];
const out = deduplicateRmaRows(rows);
if (out.length !== 2) throw new Error('Expected 2 unique tickets, got ' + out.length);
const ticket = out.find((row) => row.ticketNumber === '5173');
if (!ticket) throw new Error('Ticket 5173 missing');
if (ticket.rmaType !== 'Data Recovery RMA') throw new Error('Latest row was not kept');
if (ticket.issues !== 'Old issue') throw new Error('Blank field was not backfilled');
console.log('PASS: duplicate Ticket # collapsed to one current record');
"@
node --input-type=module -e $script
if ($LASTEXITCODE -ne 0) { throw "Duplicate behavior test failed" }

Write-Host "All RMA unique-ticket/layout checks passed." -ForegroundColor Green
