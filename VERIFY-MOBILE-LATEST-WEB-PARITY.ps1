$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobile = Join-Path $root "apps\mobile"

if (-not (Test-Path $mobile)) {
  throw "apps\mobile was not found. Merge this patch into the AngelBird project root first."
}

$checks = @(
  @{ File = "apps\mobile\src\rma\rmaAnalytics.ts"; Text = "warrantyStatus" },
  @{ File = "apps\mobile\src\rma\rmaAnalytics.ts"; Text = "deduplicateRmaRows" },
  @{ File = "apps\mobile\src\rma\RmaReportScreen.tsx"; Text = "Trending Issues by Month" },
  @{ File = "apps\mobile\src\rma\RmaReportScreen.tsx"; Text = "Warranty Status" },
  @{ File = "apps\mobile\src\components\ReportCharts.tsx"; Text = "IssueHeatmapChart" },
  @{ File = "apps\mobile\src\components\ReportCharts.tsx"; Text = "MonthlyCategoryOverview" },
  @{ File = "apps\mobile\src\tickets\ticketAnalytics.ts"; Text = "ticketRmaFallback" },
  @{ File = "apps\mobile\src\satisfaction\SatisfactionAiModal.tsx"; Text = "internalNote" },
  @{ File = "apps\mobile\src\components\ReportTableScreen.tsx"; Text = "Write Internal Note" }
)

foreach ($check in $checks) {
  $path = Join-Path $root $check.File
  if (-not (Test-Path $path)) { throw "Missing file: $($check.File)" }
  $content = Get-Content $path -Raw
  if (-not $content.Contains($check.Text)) { throw "Missing expected update '$($check.Text)' in $($check.File)" }
}

Push-Location $mobile
try {
  Write-Host "Running TypeScript check..." -ForegroundColor Cyan
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

  Write-Host "Running Expo Doctor..." -ForegroundColor Cyan
  npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

  Write-Host "AngelBird mobile latest web parity verification PASSED." -ForegroundColor Green
}
finally {
  Pop-Location
}
