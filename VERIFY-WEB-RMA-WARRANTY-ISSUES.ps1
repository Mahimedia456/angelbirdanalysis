$ErrorActionPreference = "Stop"

Write-Host "AngelBird Web - RMA Warranty + Issues verification" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$requiredFiles = @(
  "src\pages\ReportsPage.jsx",
  "src\components\rma\RmaFilters.jsx",
  "src\components\rma\RmaAnalyticsPanel.jsx",
  "src\components\rma\RmaMonthlyInsights.jsx",
  "src\components\rma\RmaReportTable.jsx",
  "backend\src\services\rmaAnalyticsService.js"
)

foreach ($file in $requiredFiles) {
  $path = Join-Path $root $file
  if (-not (Test-Path $path)) {
    throw "Missing required file: $file"
  }
}

$checks = @(
  @{ File = "src\components\rma\RmaFilters.jsx"; Text = "Warranty Status" },
  @{ File = "src\components\rma\RmaFilters.jsx"; Text = "All Issues" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "Overall Issues Distribution" },
  @{ File = "src\components\rma\RmaAnalyticsPanel.jsx"; Text = "type=\"donut\"" },
  @{ File = "src\components\rma\RmaMonthlyInsights.jsx"; Text = "Trending Issues by Month" },
  @{ File = "src\components\rma\RmaReportTable.jsx"; Text = "Warranty Status" },
  @{ File = "backend\src\services\rmaAnalyticsService.js"; Text = "byWarrantyStatus" },
  @{ File = "backend\src\services\rmaAnalyticsService.js"; Text = "warranty_status" }
)

foreach ($check in $checks) {
  $path = Join-Path $root $check.File
  $content = Get-Content $path -Raw
  if ($content -notmatch [regex]::Escape($check.Text)) {
    throw "Verification failed: '$($check.Text)' missing in $($check.File)"
  }
}

Write-Host "Static feature checks passed." -ForegroundColor Green
Write-Host "Run your normal npm build from the project root after merging this patch." -ForegroundColor Yellow
