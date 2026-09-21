$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobile = Join-Path $root "apps\mobile"
$charts = Join-Path $mobile "src\components\ReportCharts.tsx"
$rma = Join-Path $mobile "src\rma\RmaReportScreen.tsx"

if (-not (Test-Path $charts)) { throw "ReportCharts.tsx not found" }
if (-not (Test-Path $rma)) { throw "RmaReportScreen.tsx not found" }

$chartText = Get-Content $charts -Raw
$rmaText = Get-Content $rma -Raw

if ($chartText -notmatch 'VerticalBarChart[\s\S]*enablePinchZoom') { throw "VerticalBarChart pinch zoom support missing" }
if ($rmaText -notmatch 'Date-wise RMA" items=\{analytics\.dailySummary\} enablePinchZoom') { throw "Date-wise RMA pinch zoom not enabled" }
if ($rmaText -notmatch 'Products by RMA" items=\{analytics\.productSummary\} enablePinchZoom') { throw "Products by RMA pinch zoom not enabled" }

Push-Location $mobile
try {
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
  Write-Host "RMA pinch zoom hotfix verification PASSED." -ForegroundColor Green
}
finally { Pop-Location }
