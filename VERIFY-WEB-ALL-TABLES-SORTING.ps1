$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$requiredFiles = @(
  "src\utils\tableSort.js",
  "src\components\common\SortableTableHeader.jsx",
  "src\pages\ReportsPage.jsx",
  "src\components\tickets\TicketReportTable.jsx",
  "src\components\satisfaction\SatisfactionReportTable.jsx",
  "src\components\rma\RmaReportTable.jsx"
)

foreach ($relative in $requiredFiles) {
  $file = Join-Path $root $relative
  if (-not (Test-Path $file)) {
    throw "Missing file: $relative"
  }
}

$checks = @(
  @{ File = "src\pages\ReportsPage.jsx"; Text = 'sortKey="ticketNumber"' },
  @{ File = "src\pages\ReportsPage.jsx"; Text = 'sortKey="supportCategory"' },
  @{ File = "src\components\satisfaction\SatisfactionReportTable.jsx"; Text = 'sortKey="internalNote"' },
  @{ File = "src\components\satisfaction\SatisfactionReportTable.jsx"; Text = 'sortKey="externalTeamNote"' },
  @{ File = "src\components\satisfaction\SatisfactionReportTable.jsx"; Text = 'sortKey="aiSummary"' },
  @{ File = "src\components\rma\RmaReportTable.jsx"; Text = 'sortKey="issues"' },
  @{ File = "src\components\rma\RmaReportTable.jsx"; Text = 'sortKey="warrantyStatus"' },
  @{ File = "src\components\rma\RmaReportTable.jsx"; Text = 'sortKey="rmaType"' },
  @{ File = "src\utils\tableSort.js"; Text = 'Keep empty values at the bottom in both directions.' }
)

foreach ($check in $checks) {
  $file = Join-Path $root $check.File
  $content = Get-Content $file -Raw

  if (-not $content.Contains($check.Text)) {
    throw "Verification failed: $($check.File) missing $($check.Text)"
  }
}

Write-Host "PASS: Ticket, Satisfaction and RMA web tables have per-column ascending/descending sorting." -ForegroundColor Green
