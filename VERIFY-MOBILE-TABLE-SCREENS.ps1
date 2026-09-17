$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobile = Join-Path $root "apps\mobile"

Write-Host "AngelBird Mobile - Separate table screens verification"

$required = @(
  "app\report-table.tsx",
  "src\components\ReportTableScreen.tsx",
  "src\tickets\TicketReportScreen.tsx",
  "src\satisfaction\SatisfactionReportScreen.tsx",
  "src\rma\RmaReportScreen.tsx"
)
foreach ($item in $required) {
  if (-not (Test-Path (Join-Path $mobile $item))) { throw "Missing: $item" }
}

Push-Location $mobile
try {
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
  npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }
} finally {
  Pop-Location
}

Write-Host "PASS: separate report table screens"
